import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyProfiles() {
  console.log('🔍 Verifying all users have profiles...\n');

  try {
    const users = await prisma.user.findMany({
      include: {
        studentProfile: true,
        tutorProfile: true,
      },
    });

    console.log(`Total users: ${users.length}\n`);

    let allGood = true;

    for (const user of users) {
      const hasProfile = user.studentProfile || user.tutorProfile;
      const status = hasProfile ? '✅' : '❌';
      const profileType = user.studentProfile ? 'Student' : user.tutorProfile ? 'Tutor' : 'MISSING';
      
      console.log(`${status} ${user.email} (${user.role}) - ${profileType} profile`);
      
      if (!hasProfile) {
        allGood = false;
      }
    }

    console.log('\n' + (allGood ? '✅ All users have profiles!' : '❌ Some users are missing profiles!'));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyProfiles();
