import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function cleanDatabase() {
  // Clean up all tables in reverse order of dependencies
  await prisma.notification.deleteMany();
  await prisma.shopPurchase.deleteMany();
  await prisma.shopProduct.deleteMany();
  await prisma.academicResult.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.review.deleteMany();
  await prisma.sessionReport.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.tutoringSession.deleteMany();
  await prisma.consortiumMember.deleteMany();
  await prisma.consortium.deleteMany();
  await prisma.classMember.deleteMany();
  await prisma.class.deleteMany();
  await prisma.tutorProfile.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export { prisma };
