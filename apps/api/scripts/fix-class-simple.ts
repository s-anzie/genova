import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixClass() {
  try {
    // Find the class
    const scienceClass = await prisma.class.findFirst({
      where: { name: 'Science PC' },
    });

    if (!scienceClass) {
      console.log('Class not found');
      return;
    }

    console.log('Class ID:', scienceClass.id);

    // List all available education levels
    const levels = await prisma.educationLevel.findMany({
      take: 10,
    });
    console.log('\nAvailable education levels:');
    levels.forEach(level => {
      console.log(`- ${level.name} (${level.code}) - ID: ${level.id}`);
    });

    // List all available subjects
    const subjects = await prisma.subject.findMany({
      take: 10,
    });
    console.log('\nAvailable subjects:');
    subjects.forEach(subject => {
      console.log(`- ${subject.name} (${subject.code}) - ID: ${subject.id}`);
    });

    // Use the first level if available
    if (levels.length > 0) {
      const level = levels[0];
      console.log(`\nAssigning level: ${level.name}`);
      
      await prisma.class.update({
        where: { id: scienceClass.id },
        data: {
          educationLevelId: level.id,
        },
      });
      console.log('✓ Level assigned');

      // Assign subjects
      if (subjects.length > 0) {
        for (const subject of subjects.slice(0, 3)) {
          // Create or find LevelSubject
          let levelSubject = await prisma.levelSubject.findFirst({
            where: {
              levelId: level.id,
              subjectId: subject.id,
            },
          });

          if (!levelSubject) {
            levelSubject = await prisma.levelSubject.create({
              data: {
                levelId: level.id,
                subjectId: subject.id,
              },
            });
          }

          // Create ClassSubject
          const existing = await prisma.classSubject.findFirst({
            where: {
              classId: scienceClass.id,
              levelSubjectId: levelSubject.id,
            },
          });

          if (!existing) {
            await prisma.classSubject.create({
              data: {
                classId: scienceClass.id,
                levelSubjectId: levelSubject.id,
              },
            });
            console.log(`✓ Added subject: ${subject.name}`);
          }
        }
      }
    }

    console.log('\n✓ Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixClass();
