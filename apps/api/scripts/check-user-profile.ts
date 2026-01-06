import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserProfile() {
  try {
    const userId = process.argv[2];
    
    if (!userId) {
      console.log('Usage: npm run check-user-profile <userId>');
      console.log('Example: npm run check-user-profile 632663fa-7df1-4768-9a0c-eff184636d4e');
      process.exit(1);
    }

    console.log(`\n🔍 Checking profile for user: ${userId}\n`);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('✅ User found:');
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Name: ${user.firstName} ${user.lastName}`);
    console.log(`   - Role: ${user.role}`);

    // Check for student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        educationSystem: {
          include: {
            country: true,
          },
        },
        educationLevel: true,
        educationStream: true,
        preferredLevelSubjects: {
          include: {
            levelSubject: {
              include: {
                subject: true,
              },
            },
          },
        },
        preferredStreamSubjects: {
          include: {
            streamSubject: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });

    if (!studentProfile) {
      console.log('\n❌ No student profile found');
      console.log('   User needs to complete onboarding\n');
      process.exit(0);
    }

    console.log('\n✅ Student profile found:');
    console.log(`   - Profile ID: ${studentProfile.id}`);
    console.log(`   - Onboarding Completed: ${studentProfile.onboardingCompleted}`);
    console.log(`   - Education System: ${studentProfile.educationSystem?.name || 'Not set'} (${studentProfile.educationSystem?.country?.name || 'N/A'})`);
    console.log(`   - Education Level: ${studentProfile.educationLevel?.name || 'Not set'}`);
    console.log(`   - Education Stream: ${studentProfile.educationStream?.name || 'Not set'}`);
    console.log(`   - School: ${studentProfile.schoolName || 'Not set'}`);
    console.log(`   - Parent Email: ${studentProfile.parentEmail || 'Not set'}`);
    console.log(`   - Parent Phone: ${studentProfile.parentPhone || 'Not set'}`);
    console.log(`   - Budget/Hour: ${studentProfile.budgetPerHour || 'Not set'}`);
    console.log(`   - Preferred Level Subjects: ${studentProfile.preferredLevelSubjects.length}`);
    console.log(`   - Preferred Stream Subjects: ${studentProfile.preferredStreamSubjects.length}`);

    if (studentProfile.preferredLevelSubjects.length > 0) {
      console.log('\n   Level Subjects:');
      studentProfile.preferredLevelSubjects.forEach((ps) => {
        console.log(`     - ${ps.levelSubject.subject.name}`);
      });
    }

    if (studentProfile.preferredStreamSubjects.length > 0) {
      console.log('\n   Stream Subjects:');
      studentProfile.preferredStreamSubjects.forEach((ps) => {
        console.log(`     - ${ps.streamSubject.subject.name}`);
      });
    }

    console.log('\n');

    if (studentProfile.onboardingCompleted) {
      console.log('✅ Onboarding is COMPLETED - User should NOT be redirected to onboarding\n');
    } else {
      console.log('⚠️  Onboarding is NOT completed - User should be redirected to onboarding\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserProfile();
