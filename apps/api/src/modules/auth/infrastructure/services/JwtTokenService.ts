
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { ITokenService, TokenPayload } from '../../application/services/ITokenService';
import { envConfig } from '@repo/utils';

export class JwtTokenService implements ITokenService {
  private prisma: PrismaClient;
  private readonly jwtSecret: string;
  private readonly accessExpiration: string;
  private readonly refreshExpiration: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.jwtSecret = envConfig.get('JWT_SECRET', 'your-secret-key-change-in-production');
    this.accessExpiration = envConfig.get('JWT_ACCESS_EXPIRATION', '15m');
    this.refreshExpiration = envConfig.get('JWT_REFRESH_EXPIRATION', '7d');
  }

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessExpiration,
      issuer: 'genova-api',
      audience: 'genova-mobile',
    } as jwt.SignOptions);
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const token = jwt.sign({ userId }, this.jwtSecret, {
      expiresIn: this.refreshExpiration,
      issuer: 'genova-api',
      audience: 'genova-mobile',
    } as jwt.SignOptions);

    // Calculate expiration date
    const expiresAt = new Date();
    const days = parseInt(this.refreshExpiration.replace('d', '')) || 7; // Default to 7 if parsing fails
    expiresAt.setDate(expiresAt.getDate() + days);

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }
}
