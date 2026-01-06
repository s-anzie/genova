import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOnboardingStatus() {
  try {
    console.log('🔍 Checking all student profiles...\n');
    
    const profiles = await prisma.studentProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    console.log(`Found ${profiles.length} student profiles:\n`);

    profiles.forEach((profile) => {
      console.log('-----------------------------------');
      console.log(`User: ${profile.user.firstName} ${profile.user.lastName}`);
      console.log(`Email: ${profile.user.email}`);
      console.log(`Role: ${profile.user.role}`);
      console.log(`Profile ID: ${profile.id}`);
      console.log(`User ID: ${profile.userId}`);
      console.log(`Onboarding Completed: ${profile.onboardingCompleted}`);
      console.log(`Education System ID: ${profile.educationSystemId}`);
      console.log(`Education Level ID: ${profile.educationLevelId}`);
      console.log(`School Name: ${profile.schoolName}`);
      console.log('-----------------------------------\n');
    });

    // Check if there are any with onboardingCompleted = false
    const incomplete = profiles.filter(p => !p.onboardingCompleted);
    if (incomplete.length > 0) {
      console.log(`⚠️ ${incomplete.length} profile(s) with onboardingCompleted = false`);
      incomplete.forEach(p => {
        console.log(`  - ${p.user.email}: onboardingCompleted = ${p.onboardingCompleted}`);
      });
    } else {
      console.log('✅ All profiles have onboardingCompleted = true');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOnboardingStatus();
