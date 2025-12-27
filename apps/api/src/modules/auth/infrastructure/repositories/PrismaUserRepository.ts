
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, UserRole } from '../../domain/entities/User';
import { PrismaClient, Role, User as PrismaUser } from '@prisma/client';

export class PrismaUserRepository implements IUserRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async save(user: User): Promise<void> {
    const data = {
      email: user.email,
      passwordHash: user.passwordHash || '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: this.mapToPrismaRole(user.role),
      isActive: user.isActive,
      isVerified: user.isVerified,
      walletBalance: 0, // Default or from user entity if we mapped it fully
    };

    // If ID exists, update, otherwise create
    // However, in our current UseCase we are creating new users mostly.
    // For simplicity, we'll assume create for now or upsert if we had ID.
    // Since our Entity ID generation strategy is not fully defined (UUID vs DB auto-inc),
    // and Prisma uses CUID/UUID usually, let's assume we rely on Prisma to generate ID for new users.

    // But wait, the Entity `User` has an `id`. If it's empty, it's new.

    if (!user.id) {
       await this.prisma.user.create({
        data: data
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: data
      });
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!prismaUser) return null;

    return this.mapToDomain(prismaUser);
  }

  async exists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    });
    return count > 0;
  }

  private mapToDomain(prismaUser: PrismaUser): User {
    const userOrError = User.create({
      email: prismaUser.email,
      passwordHash: prismaUser.passwordHash,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      role: this.mapToDomainRole(prismaUser.role),
      isActive: prismaUser.isActive,
      isVerified: prismaUser.isVerified,
      walletBalance: prismaUser.walletBalance || 0
    }, prismaUser.id);

    // In a real app we might handle the error case if data in DB is invalid
    return userOrError.getValue();
  }

  private mapToPrismaRole(role: UserRole): Role {
    switch (role) {
      case UserRole.STUDENT: return Role.STUDENT;
      case UserRole.TUTOR: return Role.TUTOR;
      case UserRole.ADMIN: return Role.ADMIN;
      // case UserRole.PARENT: return Role.PARENT; // Assuming Prisma Role has PARENT, checking schema would be good.
      default: return Role.STUDENT;
    }
  }

  private mapToDomainRole(role: Role): UserRole {
    switch (role) {
      case Role.STUDENT: return UserRole.STUDENT;
      case Role.TUTOR: return UserRole.TUTOR;
      case Role.ADMIN: return UserRole.ADMIN;
      default: return UserRole.STUDENT; // Fallback
    }
  }
}
