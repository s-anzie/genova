import {
  register,
  login,
  hashPassword,
  verifyPassword,
  generateAccessToken,
  refreshAccessToken,
  logout,
  requestPasswordReset,
  resetPassword,
  RegisterData,
  LoginData,
} from '../auth.service';
import { cleanDatabase, disconnectDatabase } from '../../test-setup';
import { Role } from '@prisma/client';

describe('Authentication Service', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify a correct password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('wrongPassword', hash);

      expect(isValid).toBe(false);
    });

    it('should throw error for password less than 8 characters', async () => {
      await expect(hashPassword('short')).rejects.toThrow('Password must be at least 8 characters long');
    });
  });

  describe('User Registration', () => {
    it('should register a new user with valid data', async () => {
      const registerData: RegisterData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = await register(registerData);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.firstName).toBe('John');
      expect(result.user.lastName).toBe('Doe');
      expect(Number(result.user.walletBalance)).toBe(0);
      expect(result.user.role).toBe(Role.STUDENT);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('should reject duplicate email registration', async () => {
      const registerData: RegisterData = {
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      await register(registerData);

      await expect(register(registerData)).rejects.toThrow('Email already registered');
    });

    it('should reject invalid email format', async () => {
      const registerData: RegisterData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      await expect(register(registerData)).rejects.toThrow('Invalid email format');
    });

    it('should store email in lowercase', async () => {
      const registerData: RegisterData = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = await register(registerData);

      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      await register({
        email: 'login@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should login with correct credentials', async () => {
      const loginData: LoginData = {
        email: 'login@example.com',
        password: 'password123',
      };

      const result = await login(loginData);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('login@example.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject login with incorrect password', async () => {
      const loginData: LoginData = {
        email: 'login@example.com',
        password: 'wrongPassword',
      };

      await expect(login(loginData)).rejects.toThrow('Invalid email or password');
    });

    it('should reject login with non-existent email', async () => {
      const loginData: LoginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await expect(login(loginData)).rejects.toThrow('Invalid email or password');
    });

    it('should handle case-insensitive email login', async () => {
      const loginData: LoginData = {
        email: 'LOGIN@EXAMPLE.COM',
        password: 'password123',
      };

      const result = await login(loginData);

      expect(result.user.email).toBe('login@example.com');
    });
  });

  describe('Token Management', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken({
        userId: '123',
        email: 'test@example.com',
        role: Role.STUDENT,
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should refresh access token with valid refresh token', async () => {
      const registerResult = await register({
        email: 'refresh@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      const result = await refreshAccessToken(registerResult.refreshToken);

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
    });

    it('should reject refresh with invalid token', async () => {
      await expect(refreshAccessToken('invalid-token')).rejects.toThrow();
    });

    it('should logout by revoking refresh token', async () => {
      const registerResult = await register({
        email: 'logout@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      await logout(registerResult.refreshToken);

      // Try to use the revoked token
      await expect(refreshAccessToken(registerResult.refreshToken)).rejects.toThrow('Refresh token has been revoked');
    });
  });

  describe('Password Reset', () => {
    beforeEach(async () => {
      await register({
        email: 'reset@example.com',
        password: 'oldPassword123',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should generate password reset token', async () => {
      const resetToken = await requestPasswordReset('reset@example.com');

      expect(resetToken).toBeDefined();
      expect(typeof resetToken).toBe('string');
    });

    it('should reset password with valid token', async () => {
      const resetToken = await requestPasswordReset('reset@example.com');
      await resetPassword(resetToken, 'newPassword123');

      // Try to login with new password
      const loginResult = await login({
        email: 'reset@example.com',
        password: 'newPassword123',
      });

      expect(loginResult).toBeDefined();
      expect(loginResult.user.email).toBe('reset@example.com');
    });

    it('should reject password reset with used token', async () => {
      const resetToken = await requestPasswordReset('reset@example.com');
      await resetPassword(resetToken, 'newPassword123');

      // Try to use the same token again
      await expect(resetPassword(resetToken, 'anotherPassword123')).rejects.toThrow('Reset token has already been used');
    });

    it('should reject password reset with invalid token', async () => {
      await expect(resetPassword('invalid-token', 'newPassword123')).rejects.toThrow();
    });
  });
});
