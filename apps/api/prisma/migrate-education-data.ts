import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapping helpers
const EDUCATION_LEVEL_MAPPING: Record<string, string> = {
  'CP': 'CP',
  'CE1': 'CE1',
  'CE2': 'CE1', // Map to closest
  'CM1': 'CE1',
  'CM2': 'CE1',
  '6ème': '6EME',
  '6EME': '6EME',
  '5ème': '6EME',
  '4ème': '6EME',
  '3ème': '6EME',
  'Seconde': 'SECONDE',
  'SECONDE': 'SECONDE',
  'Première': 'SECONDE',
  'PREMIERE': 'SECONDE',
  'Terminale': 'TERMINALE',
  'TERMINALE': 'TERMINALE',
  'Licence': 'TERMINALE',
  'Master': 'TERMINALE',
  'Doctorat': 'TERMINALE',
};

const SUBJECT_MAPPING: Record<string, string> = {
  'Mathématiques': 'MATH',
  'Math': 'MATH',
  'Maths': 'MATH',
  'Physique-Chimie': 'PHYSICS',
  'Physique': 'PHYSICS',
  'Chimie': 'PHYSICS',
  'SVT': 'SVT',
  'Biologie': 'SVT',
  'Français': 'FRENCH',
  'Francais': 'FRENCH',
  'Anglais': 'ENGLISH',
  'English': 'ENGLISH',
  'Espagnol': 'SPANISH',
  'Histoire-Géographie': 'HISTORY_GEO',
  'Histoire': 'HISTORY_GEO',
  'Géographie': 'HISTORY_GEO',
  'Philosophie': 'PHILOSOPHY',
  'Philo': 'PHILOSOPHY',
  'Économie': 'ECONOMICS',
  'Economie': 'ECONOMICS',
};

const LANGUAGE_MAPPING: Record<string, string> = {
  'Français': 'fr',
  'Francais': 'fr',
  'Anglais': 'en',
  'English': 'en',
  'Espagnol': 'es',
  'Spanish': 'es',
  'Español': 'es',
};

const STREAM_MAPPING: Record<string, string> = {
  'S': 'S',
  'Scientifique': 'S',
  'L': 'L',
  'Littéraire': 'L',
  'ES': 'ES',
  'Économique': 'ES',
};

async function migrateEducationData() {
  console.log('🔄 Starting education data migration...\n');

  // Get reference data
  const subjects = await prisma.subject.findMany();
  const teachingLanguages = await prisma.teachingLanguage.findMany();
  const systems = await prisma.educationSystem.findMany();
  const levels = await prisma.educationLevel.findMany();
  const streams = await prisma.educationStream.findMany();

  console.log(`📚 Found ${subjects.length} subjects`);
  console.log(`🗣️  Found ${teachingLanguages.length} teaching languages`);
  console.log(`🎓 Found ${systems.length} education systems`);
  console.log(`📊 Found ${levels.length} education levels`);
  console.log(`🎯 Found ${streams.length} education streams\n`);

  // ============================================================================
  // MIGRATE STUDENT PROFILES
  // ============================================================================
  console.log('👨‍🎓 Migrating student profiles...');

  const students = await prisma.studentProfile.findMany({
    include: {
      user: true,
    },
  });

  let studentsUpdated = 0;
  let studentsSkipped = 0;

  for (const student of students) {
    try {
      // Skip if already migrated
      if (student.educationSystemId) {
        studentsSkipped++;
        continue;
      }

      // Get user's country
      const userCountry = student.user.countryCode || 'SN';
      
      // Find education system (default to French system)
      const system = systems.find(s => s.countryId === userCountry && s.code === 'FRENCH') 
                  || systems.find(s => s.code === 'FRENCH');

      if (!system) {
        console.warn(`⚠️  No system found for student ${student.id}`);
        continue;
      }

      // Parse education details
      let educationDetails: any = {};
      const studentAny = student as any;
      if (studentAny.educationDetails) {
        educationDetails = typeof studentAny.educationDetails === 'string'
          ? JSON.parse(studentAny.educationDetails)
          : studentAny.educationDetails;
      }

      // Map education level
      const levelCode = EDUCATION_LEVEL_MAPPING[studentAny.educationLevel || ''] 
                     || EDUCATION_LEVEL_MAPPING[educationDetails.level || '']
                     || 'TERMINALE';

      const level = levels.find(l => l.systemId === system.id && l.code === levelCode);

      if (!level) {
        console.warn(`⚠️  No level found for student ${student.id} (${levelCode})`);
        continue;
      }

      // Map stream if applicable
      let streamId: string | undefined;
      if (educationDetails.series) {
        const streamCode = STREAM_MAPPING[educationDetails.series];
        const stream = streams.find(s => s.levelId === level.id && s.code === streamCode);
        streamId = stream?.id;
      }

      // Update student profile
      await prisma.studentProfile.update({
        where: { id: student.id },
        data: {
          educationSystemId: system.id,
          educationLevelId: level.id,
          educationStreamId: streamId,
        },
      });

      studentsUpdated++;
    } catch (error) {
      console.error(`❌ Error migrating student ${student.id}:`, error);
    }
  }

  console.log(`✅ Updated ${studentsUpdated} student profiles`);
  console.log(`⏭️  Skipped ${studentsSkipped} already migrated\n`);

  // ============================================================================
  // MIGRATE TUTOR PROFILES
  // ============================================================================
  console.log('👨‍🏫 Migrating tutor profiles...');

  const tutors = await prisma.tutorProfile.findMany();

  let tutorsUpdated = 0;
  let tutorsSkipped = 0;

  for (const tutor of tutors) {
    try {
      // Skip if already migrated
      if (tutor.subjectIds && tutor.subjectIds.length > 0) {
        tutorsSkipped++;
        continue;
      }

      // Map subjects
      const subjectIds: string[] = [];
      for (const subjectName of tutor.subjects) {
        const subjectCode = SUBJECT_MAPPING[subjectName];
        if (subjectCode) {
          const subject = subjects.find(s => s.code === subjectCode);
          if (subject) {
            subjectIds.push(subject.id);
          }
        }
      }

      // Map education levels
      const levelIds: string[] = [];
      for (const levelName of tutor.educationLevels) {
        const levelCode = EDUCATION_LEVEL_MAPPING[levelName];
        if (levelCode) {
          // Find all levels with this code across all systems
          const matchingLevels = levels.filter(l => l.code === levelCode);
          levelIds.push(...matchingLevels.map(l => l.id));
        }
      }

      // Map languages
      const languageIds: string[] = [];
      for (const languageName of tutor.languages) {
        const languageCode = LANGUAGE_MAPPING[languageName];
        if (languageCode) {
          const language = teachingLanguages.find(l => l.code === languageCode);
          if (language) {
            languageIds.push(language.id);
          }
        }
      }

      // Update tutor profile
      await prisma.tutorProfile.update({
        where: { id: tutor.id },
        data: {
          subjectIds: [...new Set(subjectIds)], // Remove duplicates
          levelIds: [...new Set(levelIds)],
          teachingLanguageIds: [...new Set(languageIds)],
        },
      });

      tutorsUpdated++;
    } catch (error) {
      console.error(`❌ Error migrating tutor ${tutor.id}:`, error);
    }
  }

  console.log(`✅ Updated ${tutorsUpdated} tutor profiles`);
  console.log(`⏭️  Skipped ${tutorsSkipped} already migrated\n`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('📊 Migration Summary:');
  console.log(`   Students: ${studentsUpdated} updated, ${studentsSkipped} skipped`);
  console.log(`   Tutors: ${tutorsUpdated} updated, ${tutorsSkipped} skipped`);
  console.log('\n✅ Education data migration completed!');
}

migrateEducationData()
  .catch((e) => {
    console.error('❌ Error migrating education data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
