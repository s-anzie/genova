import { PrismaClient, Role, TeachingMode } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function createMissingProfiles() {
  console.log('🔍 Checking for users without profiles...\n');

  try {
    // Find all users
    const users = await prisma.user.findMany({
      include: {
        studentProfile: true,
        tutorProfile: true,
      },
    });

    console.log(`Found ${users.length} total users\n`);

    let studentsCreated = 0;
    let tutorsCreated = 0;
    let skipped = 0;

    for (const user of users) {
      if (user.role === Role.STUDENT && !user.studentProfile) {
        console.log(`Creating student profile for: ${user.email}`);
        await prisma.studentProfile.create({
          data: {
            userId: user.id,
            educationLevel: 'high_school', // Default value
          },
        });
        studentsCreated++;
      } else if (user.role === Role.TUTOR && !user.tutorProfile) {
        console.log(`Creating tutor profile for: ${user.email}`);
        await prisma.tutorProfile.create({
          data: {
            userId: user.id,
            hourlyRate: 0,
            experienceYears: 0,
            teachingMode: TeachingMode.BOTH,
          },
        });
        tutorsCreated++;
      } else {
        console.log(`✓ Profile already exists for: ${user.email}`);
        skipped++;
      }
    }

    console.log('\n✅ Migration completed!');
    console.log(`   - Student profiles created: ${studentsCreated}`);
    console.log(`   - Tutor profiles created: ${tutorsCreated}`);
    console.log(`   - Users skipped (already have profiles): ${skipped}`);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
createMissingProfiles()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
