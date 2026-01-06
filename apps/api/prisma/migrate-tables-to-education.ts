/**
 * Data Migration Script: Convert legacy JSON/string fields to education relations
 * 
 * This script migrates data from:
 * - Class: educationLevel (Json) + subjects (String[]) → educationSystemId, educationLevelId, educationStreamId, ClassSubject
 * - ClassTimeSlot: subject (String) → levelSubjectId
 * - LearningGoal: subject (String) + educationLevel (Json) → levelSubjectId
 * - AcademicResult: subject (String) → levelSubjectId
 * - ShopProduct: subject (String) + educationLevel (String) → levelSubjectId
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationStats {
  classes: { total: number; migrated: number; failed: number };
  classSubjects: { created: number };
  classTimeSlots: { total: number; migrated: number; failed: number };
  learningGoals: { total: number; migrated: number; failed: number };
  academicResults: { total: number; migrated: number; failed: number };
  shopProducts: { total: number; migrated: number; failed: number };
  studentProfiles: { total: number; migrated: number; failed: number };
  tutorProfiles: { total: number; migrated: number; failed: number };
}

const stats: MigrationStats = {
  classes: { total: 0, migrated: 0, failed: 0 },
  classSubjects: { created: 0 },
  classTimeSlots: { total: 0, migrated: 0, failed: 0 },
  learningGoals: { total: 0, migrated: 0, failed: 0 },
  academicResults: { total: 0, migrated: 0, failed: 0 },
  shopProducts: { total: 0, migrated: 0, failed: 0 },
  studentProfiles: { total: 0, migrated: 0, failed: 0 },
  tutorProfiles: { total: 0, migrated: 0, failed: 0 },
};

/**
 * Find LevelSubject by subject name and level
 */
async function findLevelSubject(subjectName: string, levelName?: string): Promise<string | null> {
  // Try to find by subject name
  const levelSubjects = await prisma.levelSubject.findMany({
    include: {
      subject: true,
      level: true,
    },
  });

  // First try exact match with level
  if (levelName) {
    const match = levelSubjects.find(
      ls => ls.subject.name.toLowerCase() === subjectName.toLowerCase() &&
            ls.level.name.toLowerCase() === levelName.toLowerCase()
    );
    if (match) return match.id;
  }

  // Then try just subject name (take first match)
  const match = levelSubjects.find(
    ls => ls.subject.name.toLowerCase() === subjectName.toLowerCase()
  );
  
  return match?.id || null;
}

/**
 * Migrate Class table
 */
async function migrateClasses() {
  console.log('\n📚 Migrating Classes...');
  
  const classes = await prisma.class.findMany({
    where: {
      OR: [
        { educationSystemId: null },
        { educationLevelId: null },
      ],
    },
  });

  stats.classes.total = classes.length;
  console.log(`Found ${classes.length} classes to migrate`);

  for (const classItem of classes) {
    try {
      const educationLevel = classItem.educationLevel as any;
      const subjects = classItem.subjects as string[];

      if (!educationLevel || !educationLevel.level) {
        console.log(`⚠️  Class ${classItem.id}: No education level data`);
        stats.classes.failed++;
        continue;
      }

      // Find education system by level name
      const educationSystems = await prisma.educationSystem.findMany({
        include: {
          levels: true,
        },
      });

      let foundSystem = null;
      let foundLevel = null;
      let foundStream = null;

      for (const system of educationSystems) {
        const level = system.levels.find(
          l => l.name.toLowerCase() === educationLevel.level.toLowerCase() ||
               l.name.toLowerCase().includes(educationLevel.level.toLowerCase())
        );
        
        if (level) {
          foundSystem = system;
          foundLevel = level;
          
          // Try to find stream if specified
          if (educationLevel.stream) {
            const stream = await prisma.educationStream.findFirst({
              where: {
                educationSystemId: system.id,
                name: {
                  contains: educationLevel.stream,
                  mode: 'insensitive',
                },
              },
            });
            foundStream = stream;
          }
          break;
        }
      }

      if (!foundSystem || !foundLevel) {
        console.log(`⚠️  Class ${classItem.id}: Could not find education system/level for "${educationLevel.level}"`);
        stats.classes.failed++;
        continue;
      }

      // Update class with education relations
      await prisma.class.update({
        where: { id: classItem.id },
        data: {
          educationSystemId: foundSystem.id,
          educationLevelId: foundLevel.id,
          educationStreamId: foundStream?.id,
        },
      });

      // Create ClassSubject entries for each subject
      if (subjects && subjects.length > 0) {
        for (const subjectName of subjects) {
          const levelSubjectId = await findLevelSubject(subjectName, foundLevel.name);
          
          if (levelSubjectId) {
            await prisma.classSubject.create({
              data: {
                classId: classItem.id,
                levelSubjectId,
              },
            });
            stats.classSubjects.created++;
          } else {
            console.log(`⚠️  Class ${classItem.id}: Could not find LevelSubject for "${subjectName}"`);
          }
        }
      }

      stats.classes.migrated++;
      console.log(`✅ Class ${classItem.id}: Migrated to ${foundSystem.name} - ${foundLevel.name}`);
    } catch (error) {
      console.error(`❌ Class ${classItem.id}: Migration failed`, error);
      stats.classes.failed++;
    }
  }
}

/**
 * Migrate ClassTimeSlot table
 */
async function migrateClassTimeSlots() {
  console.log('\n⏰ Migrating ClassTimeSlots...');
  
  const timeSlots = await prisma.classTimeSlot.findMany({
    where: {
      levelSubjectId: null,
      subject: { not: null },
    },
  });

  stats.classTimeSlots.total = timeSlots.length;
  console.log(`Found ${timeSlots.length} time slots to migrate`);

  for (const slot of timeSlots) {
    try {
      if (!slot.subject) continue;

      const levelSubjectId = await findLevelSubject(slot.subject);
      
      if (levelSubjectId) {
        await prisma.classTimeSlot.update({
          where: { id: slot.id },
          data: { levelSubjectId },
        });
        stats.classTimeSlots.migrated++;
        console.log(`✅ TimeSlot ${slot.id}: Migrated subject "${slot.subject}"`);
      } else {
        console.log(`⚠️  TimeSlot ${slot.id}: Could not find LevelSubject for "${slot.subject}"`);
        stats.classTimeSlots.failed++;
      }
    } catch (error) {
      console.error(`❌ TimeSlot ${slot.id}: Migration failed`, error);
      stats.classTimeSlots.failed++;
    }
  }
}

/**
 * Migrate LearningGoal table
 */
async function migrateLearningGoals() {
  console.log('\n🎯 Migrating LearningGoals...');
  
  const goals = await prisma.learningGoal.findMany({
    where: {
      levelSubjectId: null,
      subject: { not: null },
    },
  });

  stats.learningGoals.total = goals.length;
  console.log(`Found ${goals.length} learning goals to migrate`);

  for (const goal of goals) {
    try {
      if (!goal.subject) continue;

      const educationLevel = goal.educationLevel as any;
      const levelName = educationLevel?.level;

      const levelSubjectId = await findLevelSubject(goal.subject, levelName);
      
      if (levelSubjectId) {
        await prisma.learningGoal.update({
          where: { id: goal.id },
          data: { levelSubjectId },
        });
        stats.learningGoals.migrated++;
        console.log(`✅ Goal ${goal.id}: Migrated subject "${goal.subject}"`);
      } else {
        console.log(`⚠️  Goal ${goal.id}: Could not find LevelSubject for "${goal.subject}"`);
        stats.learningGoals.failed++;
      }
    } catch (error) {
      console.error(`❌ Goal ${goal.id}: Migration failed`, error);
      stats.learningGoals.failed++;
    }
  }
}

/**
 * Migrate AcademicResult table
 */
async function migrateAcademicResults() {
  console.log('\n📊 Migrating AcademicResults...');
  
  const results = await prisma.academicResult.findMany({
    where: {
      levelSubjectId: null,
      subject: { not: null },
    },
  });

  stats.academicResults.total = results.length;
  console.log(`Found ${results.length} academic results to migrate`);

  for (const result of results) {
    try {
      if (!result.subject) continue;

      const levelSubjectId = await findLevelSubject(result.subject);
      
      if (levelSubjectId) {
        await prisma.academicResult.update({
          where: { id: result.id },
          data: { levelSubjectId },
        });
        stats.academicResults.migrated++;
        console.log(`✅ Result ${result.id}: Migrated subject "${result.subject}"`);
      } else {
        console.log(`⚠️  Result ${result.id}: Could not find LevelSubject for "${result.subject}"`);
        stats.academicResults.failed++;
      }
    } catch (error) {
      console.error(`❌ Result ${result.id}: Migration failed`, error);
      stats.academicResults.failed++;
    }
  }
}

/**
 * Migrate ShopProduct table
 */
async function migrateShopProducts() {
  console.log('\n🛍️  Migrating ShopProducts...');
  
  const products = await prisma.shopProduct.findMany({
    where: {
      levelSubjectId: null,
      subject: { not: null },
    },
  });

  stats.shopProducts.total = products.length;
  console.log(`Found ${products.length} shop products to migrate`);

  for (const product of products) {
    try {
      if (!product.subject) continue;

      const levelSubjectId = await findLevelSubject(product.subject, product.educationLevel || undefined);
      
      if (levelSubjectId) {
        await prisma.shopProduct.update({
          where: { id: product.id },
          data: { levelSubjectId },
        });
        stats.shopProducts.migrated++;
        console.log(`✅ Product ${product.id}: Migrated subject "${product.subject}"`);
      } else {
        console.log(`⚠️  Product ${product.id}: Could not find LevelSubject for "${product.subject}"`);
        stats.shopProducts.failed++;
      }
    } catch (error) {
      console.error(`❌ Product ${product.id}: Migration failed`, error);
      stats.shopProducts.failed++;
    }
  }
}

/**
 * Print migration summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\n📚 Classes:');
  console.log(`   Total: ${stats.classes.total}`);
  console.log(`   ✅ Migrated: ${stats.classes.migrated}`);
  console.log(`   ❌ Failed: ${stats.classes.failed}`);
  console.log(`   📎 ClassSubjects created: ${stats.classSubjects.created}`);
  
  console.log('\n⏰ ClassTimeSlots:');
  console.log(`   Total: ${stats.classTimeSlots.total}`);
  console.log(`   ✅ Migrated: ${stats.classTimeSlots.migrated}`);
  console.log(`   ❌ Failed: ${stats.classTimeSlots.failed}`);
  
  console.log('\n🎯 LearningGoals:');
  console.log(`   Total: ${stats.learningGoals.total}`);
  console.log(`   ✅ Migrated: ${stats.learningGoals.migrated}`);
  console.log(`   ❌ Failed: ${stats.learningGoals.failed}`);
  
  console.log('\n📊 AcademicResults:');
  console.log(`   Total: ${stats.academicResults.total}`);
  console.log(`   ✅ Migrated: ${stats.academicResults.migrated}`);
  console.log(`   ❌ Failed: ${stats.academicResults.failed}`);
  
  console.log('\n🛍️  ShopProducts:');
  console.log(`   Total: ${stats.shopProducts.total}`);
  console.log(`   ✅ Migrated: ${stats.shopProducts.migrated}`);
  console.log(`   ❌ Failed: ${stats.shopProducts.failed}`);
  
  console.log('\n👨‍🎓 StudentProfiles:');
  console.log(`   Total: ${stats.studentProfiles.total}`);
  console.log(`   ✅ Migrated: ${stats.studentProfiles.migrated}`);
  console.log(`   ❌ Failed: ${stats.studentProfiles.failed}`);
  
  console.log('\n👨‍🏫 TutorProfiles:');
  console.log(`   Total: ${stats.tutorProfiles.total}`);
  console.log(`   ✅ Migrated: ${stats.tutorProfiles.migrated}`);
  console.log(`   ❌ Failed: ${stats.tutorProfiles.failed}`);
  
  const totalMigrated = stats.classes.migrated + stats.classTimeSlots.migrated + 
                        stats.learningGoals.migrated + stats.academicResults.migrated + 
                        stats.shopProducts.migrated + stats.studentProfiles.migrated +
                        stats.tutorProfiles.migrated;
  const totalFailed = stats.classes.failed + stats.classTimeSlots.failed + 
                      stats.learningGoals.failed + stats.academicResults.failed + 
                      stats.shopProducts.failed + stats.studentProfiles.failed +
                      stats.tutorProfiles.failed;
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Total Migrated: ${totalMigrated}`);
  console.log(`❌ Total Failed: ${totalFailed}`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting data migration to education relations...\n');
  
  try {
    await migrateClasses();
    await migrateClassTimeSlots();
    await migrateLearningGoals();
    await migrateAcademicResults();
    await migrateShopProducts();
    await migrateStudentPreferredSubjects();
    await migrateTutorTeachingLanguages();
    
    printSummary();
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


/**
 * Migrate StudentProfile preferred subjects
 */
async function migrateStudentPreferredSubjects() {
  console.log('\n👨‍🎓 Migrating Student Preferred Subjects...');
  
  const profiles = await prisma.studentProfile.findMany({
    where: {
      NOT: {
        preferredSubjects: { isEmpty: true },
      },
    },
  });

  stats.studentProfiles = { total: profiles.length, migrated: 0, failed: 0 };
  console.log(`Found ${profiles.length} student profiles with preferred subjects`);

  for (const profile of profiles) {
    try {
      const subjects = profile.preferredSubjects as string[];
      let createdCount = 0;
      
      for (const subjectName of subjects) {
        const levelSubjectId = await findLevelSubject(subjectName);
        
        if (levelSubjectId) {
          // Check if already exists
          const existing = await prisma.studentPreferredSubject.findUnique({
            where: {
              studentProfileId_levelSubjectId: {
                studentProfileId: profile.id,
                levelSubjectId,
              },
            },
          });

          if (!existing) {
            await prisma.studentPreferredSubject.create({
              data: {
                studentProfileId: profile.id,
                levelSubjectId,
              },
            });
            createdCount++;
          }
        } else {
          console.log(`⚠️  Profile ${profile.id}: Could not find LevelSubject for "${subjectName}"`);
        }
      }

      stats.studentProfiles.migrated++;
      console.log(`✅ Profile ${profile.id}: Created ${createdCount} preferred subject relations`);
    } catch (error) {
      console.error(`❌ Profile ${profile.id}: Migration failed`, error);
      stats.studentProfiles.failed++;
    }
  }
}

/**
 * Migrate TutorProfile teaching languages
 */
async function migrateTutorTeachingLanguages() {
  console.log('\n👨‍🏫 Migrating Tutor Teaching Languages...');
  
  const profiles = await prisma.tutorProfile.findMany({
    where: {
      NOT: {
        teachingLanguageIds: { isEmpty: true },
      },
    },
  });

  stats.tutorProfiles = { total: profiles.length, migrated: 0, failed: 0 };
  console.log(`Found ${profiles.length} tutor profiles with teaching languages`);

  for (const profile of profiles) {
    try {
      const languageIds = profile.teachingLanguageIds as string[];
      let createdCount = 0;
      
      for (const languageId of languageIds) {
        // Check if language exists
        const language = await prisma.teachingLanguage.findUnique({
          where: { id: languageId },
        });
        
        if (language) {
          // Check if already exists
          const existing = await prisma.tutorTeachingLanguage.findUnique({
            where: {
              tutorProfileId_teachingLanguageId: {
                tutorProfileId: profile.id,
                teachingLanguageId: languageId,
              },
            },
          });

          if (!existing) {
            await prisma.tutorTeachingLanguage.create({
              data: {
                tutorProfileId: profile.id,
                teachingLanguageId: languageId,
              },
            });
            createdCount++;
          }
        } else {
          console.log(`⚠️  Profile ${profile.id}: Language ID "${languageId}" not found`);
        }
      }

      stats.tutorProfiles.migrated++;
      console.log(`✅ Profile ${profile.id}: Created ${createdCount} teaching language relations`);
    } catch (error) {
      console.error(`❌ Profile ${profile.id}: Migration failed`, error);
      stats.tutorProfiles.failed++;
    }
  }
}
