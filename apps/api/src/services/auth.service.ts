import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient, User, Role } from '@prisma/client';
import { envConfig } from '@repo/utils';
import { 
  AuthenticationError, 
  ValidationError, 
  ConflictError,
  NotFoundError 
} from '@repo/utils';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Constants
const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRATION = envConfig.get('JWT_ACCESS_EXPIRATION', '15m');
const REFRESH_TOKEN_EXPIRATION = envConfig.get('JWT_REFRESH_EXPIRATION', '7d');
const JWT_SECRET = envConfig.get('JWT_SECRET', 'your-secret-key-change-in-production');

// Types
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
  birthDate?: Date;
  preferredLanguage?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'passwordHash'>;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRATION,
    issuer: 'genova-api',
    audience: 'genova-mobile',
  } as jwt.SignOptions);
}

/**
 * Generate JWT refresh token and store in database
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRATION,
    issuer: 'genova-api',
    audience: 'genova-mobile',
  } as jwt.SignOptions);

  // Calculate expiration date
  const expiresAt = new Date();
  const days = parseInt(REFRESH_TOKEN_EXPIRATION.replace('d', ''));
  expiresAt.setDate(expiresAt.getDate() + days);

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'genova-api',
      audience: 'genova-mobile',
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new AuthenticationError('Invalid or expired token');
  }
}

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<AuthTokens> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    throw new ValidationError('Invalid email format', 'email');
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Normalize role to uppercase for Prisma enum
  const roleValue = data.role ? (data.role.toUpperCase() as Role) : Role.STUDENT;

  // Create user and profile in a transaction
  const user = await prisma.$transaction(async (tx) => {
    // Create user with initial wallet balance (650000 FCFA ≈ 1000 EUR)
    const newUser = await tx.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: roleValue,
        birthDate: data.birthDate,
        preferredLanguage: data.preferredLanguage || 'en',
        walletBalance: 650000, // Initial balance for testing (bypass Stripe)
      },
    });

    // Create corresponding profile based on role
    if (roleValue === Role.STUDENT) {
      await tx.studentProfile.create({
        data: {
          userId: newUser.id,
          educationLevel: 'high_school', // Default value
        },
      });
    } else if (roleValue === Role.TUTOR) {
      await tx.tutorProfile.create({
        data: {
          userId: newUser.id,
          hourlyRate: 0, // Default value, tutor should update this
          experienceYears: 0,
          teachingMode: 'BOTH', // Default value, tutor can update this
        },
      });
    }

    return newUser;
  });

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = await generateRefreshToken(user.id);

  // Remove password hash from response
  const { passwordHash: _, ...userWithoutPassword } = user;

  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword,
  };
}

/**
 * Login user with email and password
 */
export async function login(data: LoginData): Promise<AuthTokens> {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AuthenticationError('Account is deactivated');
  }

  // Verify password
  const isPasswordValid = await verifyPassword(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = await generateRefreshToken(user.id);

  // Remove password hash from response
  const { passwordHash: _, ...userWithoutPassword } = user;

  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  // Verify refresh token
  let decoded: any;
  try {
    decoded = jwt.verify(refreshToken, JWT_SECRET);
  } catch (error) {
    throw new AuthenticationError('Invalid or expired refresh token');
  }

  // Check if refresh token exists in database and is not revoked
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken || storedToken.isRevoked) {
    throw new AuthenticationError('Refresh token has been revoked');
  }

  // Check if token is expired
  if (storedToken.expiresAt < new Date()) {
    throw new AuthenticationError('Refresh token has expired');
  }

  // Generate new access token
  const accessToken = generateAccessToken({
    userId: storedToken.user.id,
    email: storedToken.user.email,
    role: storedToken.user.role,
  });

  return { accessToken };
}

/**
 * Logout user by revoking refresh token
 */
export async function logout(refreshToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { isRevoked: true },
  });
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<string> {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Don't reveal if email exists or not for security
    throw new NotFoundError('If the email exists, a reset link will be sent');
  }

  // Generate reset token
  const resetToken = jwt.sign(
    { userId: user.id, purpose: 'password-reset' },
    JWT_SECRET,
    { expiresIn: '1h' } as jwt.SignOptions
  );

  // Calculate expiration (1 hour from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  // Store reset token in database
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token: resetToken,
      expiresAt,
    },
  });

  return resetToken;
}

/**
 * Reset password using reset token
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  // Verify token
  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new AuthenticationError('Invalid or expired reset token');
  }

  if (decoded.purpose !== 'password-reset') {
    throw new AuthenticationError('Invalid reset token');
  }

  // Check if reset token exists and is not used
  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token },
  });

  if (!resetRecord || resetRecord.isUsed) {
    throw new AuthenticationError('Reset token has already been used');
  }

  // Check if token is expired
  if (resetRecord.expiresAt < new Date()) {
    throw new AuthenticationError('Reset token has expired');
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update user password and mark token as used
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    }),
    prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { isUsed: true },
    }),
  ]);
}

/**
 * Verify email (placeholder for email verification flow)
 */
export async function verifyEmail(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true },
  });
}
