import { PrismaClient } from '@prisma/client';
import { generateSessionsForClass } from '../src/services/session-generator.service';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

interface MigrationStats {
  classesProcessed: number;
  classesSkipped: number;
  sessionsGenerated: number;
  conflictsPreserved: number;
  errors: Array<{ classId: string; error: string }>;
}

interface MigrationOptions {
  dryRun: boolean;
  weeksAhead: number;
}

/**
 * Migration script to generate sessions for existing ClassTimeSlots
 * Validates: Requirements 12.1, 12.2, 12.3
 */
async function migrateGenerateSessions(options: MigrationOptions): Promise<MigrationStats> {
  const stats: MigrationStats = {
    classesProcessed: 0,
    classesSkipped: 0,
    sessionsGenerated: 0,
    conflictsPreserved: 0,
    errors: [],
  };

  console.log('🚀 Starting session generation migration...');
  console.log(`   Mode: ${options.dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
  console.log(`   Weeks ahead: ${options.weeksAhead}\n`);

  try {
    // Query all active classes with ClassTimeSlots (Requirement 12.2)
    const classes = await prisma.class.findMany({
      where: {
        isActive: true,
      },
      include: {
        timeSlots: {
          where: {
            isActive: true,
          },
        },
        members: {
          where: {
            isActive: true,
          },
        },
      },
    });

    console.log(`📊 Found ${classes.length} active classes\n`);

    // Process each class
    for (const classData of classes) {
      console.log(`\n📚 Processing class: ${classData.name} (${classData.id})`);
      console.log(`   Time slots: ${classData.timeSlots.length}`);
      console.log(`   Members: ${classData.members.length}`);

      // Skip classes without time slots
      if (classData.timeSlots.length === 0) {
        console.log('   ⏭️  Skipping: No active time slots');
        stats.classesSkipped++;
        continue;
      }

      try {
        // Check for existing sessions to preserve (Requirement 12.3)
        const existingSessions = await prisma.tutoringSession.findMany({
          where: {
            classId: classData.id,
            scheduledStart: {
              gte: new Date(),
            },
          },
          select: {
            id: true,
            scheduledStart: true,
            scheduledEnd: true,
            subject: true,
          },
        });

        if (existingSessions.length > 0) {
          console.log(`   ℹ️  Found ${existingSessions.length} existing sessions (will be preserved)`);
          stats.conflictsPreserved += existingSessions.length;
        }

        if (options.dryRun) {
          // In dry-run mode, just log what would happen
          console.log(`   🔍 DRY RUN: Would generate sessions for next ${options.weeksAhead} weeks`);
          console.log(`   🔍 DRY RUN: Existing sessions would be preserved`);
          stats.classesProcessed++;
        } else {
          // Generate sessions for next N weeks (Requirement 12.2)
          const generatedSessions = await generateSessionsForClass(
            classData.id,
            options.weeksAhead
          );

          console.log(`   ✅ Generated ${generatedSessions.length} new sessions`);
          stats.sessionsGenerated += generatedSessions.length;
          stats.classesProcessed++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Error processing class: ${errorMessage}`);
        stats.errors.push({
          classId: classData.id,
          error: errorMessage,
        });
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Mode:                  ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log(`Classes processed:     ${stats.classesProcessed}`);
    console.log(`Classes skipped:       ${stats.classesSkipped}`);
    console.log(`Sessions generated:    ${stats.sessionsGenerated}`);
    console.log(`Existing preserved:    ${stats.conflictsPreserved}`);
    console.log(`Errors encountered:    ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      stats.errors.forEach((err, index) => {
        console.log(`   ${index + 1}. Class ${err.classId}: ${err.error}`);
      });
    }

    if (options.dryRun) {
      console.log('\n💡 This was a DRY RUN. No changes were made to the database.');
      console.log('   Run without --dry-run flag to apply changes.');
    }

    console.log('='.repeat(60) + '\n');

    return stats;
  } catch (error) {
    console.error('\n💥 Fatal error during migration:', error);
    throw error;
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  
  const options: MigrationOptions = {
    dryRun: false,
    weeksAhead: 4, // Default to 4 weeks
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--weeks' || arg === '-w') {
      const weeksValue = parseInt(args[i + 1] || '4', 10);
      if (isNaN(weeksValue) || weeksValue < 1 || weeksValue > 52) {
        console.error('❌ Invalid weeks value. Must be between 1 and 52.');
        process.exit(1);
      }
      options.weeksAhead = weeksValue;
      i++; // Skip next arg since we consumed it
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Session Generation Migration Script

Usage:
  npm run migrate:sessions [options]

Options:
  --dry-run, -d       Run in dry-run mode (no changes will be made)
  --weeks N, -w N     Number of weeks ahead to generate (default: 4)
  --help, -h          Show this help message

Examples:
  npm run migrate:sessions --dry-run
  npm run migrate:sessions --weeks 6
  npm run migrate:sessions --dry-run --weeks 8
      `);
      process.exit(0);
    } else {
      console.error(`❌ Unknown argument: ${arg}`);
      console.error('   Use --help for usage information');
      process.exit(1);
    }
  }

  return options;
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();

  try {
    const stats = await migrateGenerateSessions(options);

    // Exit with error code if there were errors
    if (stats.errors.length > 0) {
      console.log('⚠️  Migration completed with errors');
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
main();
