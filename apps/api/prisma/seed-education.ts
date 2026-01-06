import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedEducation() {
  console.log('🌱 Seeding education data...');

  // Get countries
  const senegal = await prisma.country.findUnique({ where: { code: 'SN' } });
  const cameroon = await prisma.country.findUnique({ where: { code: 'CM' } });
  const ivoryCoast = await prisma.country.findUnique({ where: { code: 'CI' } });

  if (!senegal || !cameroon || !ivoryCoast) {
    throw new Error('Countries not found. Please run region seed first.');
  }

  // ============================================================================
  // 1. CREATE SUBJECTS
  // ============================================================================
  console.log('Creating subjects...');

  const subjects = await Promise.all([
    // Sciences
    prisma.subject.upsert({
      where: { code: 'MATH' },
      update: {},
      create: {
        code: 'MATH',
        name: 'Mathématiques',
        nameEn: 'Mathematics',
        category: 'SCIENCE',
        icon: '🔢',
        color: '#3B82F6',
        sortOrder: 1,
      },
    }),
    prisma.subject.upsert({
      where: { code: 'PHYSICS' },
      update: {},
      create: {
        code: 'PHYSICS',
        name: 'Physique-Chimie',
        nameEn: 'Physics-Chemistry',
        category: 'SCIENCE',
        icon: '⚗️',
        color: '#8B5CF6',
        sortOrder: 2,
      },
    }),
    prisma.subject.upsert({
      where: { code: 'SVT' },
      update: {},
      create: {
        code: 'SVT',
        name: 'SVT',
        nameEn: 'Life and Earth Sciences',
        category: 'SCIENCE',
        icon: '🧬',
        color: '#10B981',
        sortOrder: 3,
      },
    }),
    // Languages
    prisma.subject.upsert({
      where: { code: 'FRENCH' },
      update: {},
      create: {
        code: 'FRENCH',
        name: 'Français',
        nameEn: 'French',
        category: 'LANGUAGE',
        icon: '📚',
        color: '#EF4444',
        sortOrder: 4,
      },
    }),
    prisma.subject.upsert({
      where: { code: 'ENGLISH' },
      update: {},
      create: {
        code: 'ENGLISH',
        name: 'Anglais',
        nameEn: 'English',
        category: 'LANGUAGE',
        icon: '🇬🇧',
        color: '#F59E0B',
        sortOrder: 5,
      },
    }),
    prisma.subject.upsert({
      where: { code: 'SPANISH' },
      update: {},
      create: {
        code: 'SPANISH',
        name: 'Espagnol',
        nameEn: 'Spanish',
        category: 'LANGUAGE',
        icon: '🇪🇸',
        color: '#F97316',
        sortOrder: 6,
      },
    }),
    // Humanities
    prisma.subject.upsert({
      where: { code: 'HISTORY_GEO' },
      update: {},
      create: {
        code: 'HISTORY_GEO',
        name: 'Histoire-Géographie',
        nameEn: 'History-Geography',
        category: 'HUMANITIES',
        icon: '🌍',
        color: '#14B8A6',
        sortOrder: 7,
      },
    }),
    prisma.subject.upsert({
      where: { code: 'PHILOSOPHY' },
      update: {},
      create: {
        code: 'PHILOSOPHY',
        name: 'Philosophie',
        nameEn: 'Philosophy',
        category: 'HUMANITIES',
        icon: '🤔',
        color: '#6366F1',
        sortOrder: 8,
      },
    }),
    prisma.subject.upsert({
      where: { code: 'ECONOMICS' },
      update: {},
      create: {
        code: 'ECONOMICS',
        name: 'Économie',
        nameEn: 'Economics',
        category: 'ECONOMICS',
        icon: '💰',
        color: '#84CC16',
        sortOrder: 9,
      },
    }),
  ]);

  console.log(`✅ Created ${subjects.length} subjects`);

  // ============================================================================
  // 2. CREATE TEACHING LANGUAGES
  // ============================================================================
  console.log('Creating teaching languages...');

  const teachingLanguages = await Promise.all([
    prisma.teachingLanguage.upsert({
      where: { code: 'fr' },
      update: {},
      create: {
        code: 'fr',
        name: 'Français',
        nativeName: 'Français',
        sortOrder: 1,
      },
    }),
    prisma.teachingLanguage.upsert({
      where: { code: 'en' },
      update: {},
      create: {
        code: 'en',
        name: 'Anglais',
        nativeName: 'English',
        sortOrder: 2,
      },
    }),
    prisma.teachingLanguage.upsert({
      where: { code: 'es' },
      update: {},
      create: {
        code: 'es',
        name: 'Espagnol',
        nativeName: 'Español',
        sortOrder: 3,
      },
    }),
  ]);

  console.log(`✅ Created ${teachingLanguages.length} teaching languages`);

  // ============================================================================
  // 3. CREATE LOCAL LANGUAGES
  // ============================================================================
  console.log('Creating local languages...');

  // Senegal
  await Promise.all([
    prisma.localLanguage.upsert({
      where: { countryId_name: { countryId: senegal.id, name: 'Wolof' } },
      update: {},
      create: {
        countryId: senegal.id,
        name: 'Wolof',
        code: 'wol',
        isOfficial: true,
        sortOrder: 1,
      },
    }),
    prisma.localLanguage.upsert({
      where: { countryId_name: { countryId: senegal.id, name: 'Pulaar' } },
      update: {},
      create: {
        countryId: senegal.id,
        name: 'Pulaar',
        code: 'fuc',
        isOfficial: true,
        sortOrder: 2,
      },
    }),
  ]);

  // Cameroon
  await Promise.all([
    prisma.localLanguage.upsert({
      where: { countryId_name: { countryId: cameroon.id, name: 'Ewondo' } },
      update: {},
      create: {
        countryId: cameroon.id,
        name: 'Ewondo',
        isOfficial: false,
        sortOrder: 1,
      },
    }),
    prisma.localLanguage.upsert({
      where: { countryId_name: { countryId: cameroon.id, name: 'Duala' } },
      update: {},
      create: {
        countryId: cameroon.id,
        name: 'Duala',
        isOfficial: false,
        sortOrder: 2,
      },
    }),
  ]);

  console.log('✅ Created local languages');

  // ============================================================================
  // 4. CREATE EDUCATION SYSTEMS
  // ============================================================================
  console.log('Creating education systems...');

  // French System for all countries
  const frenchSystemSN = await prisma.educationSystem.upsert({
    where: { countryId_code: { countryId: senegal.id, code: 'FRENCH' } },
    update: {},
    create: {
      countryId: senegal.id,
      code: 'FRENCH',
      name: 'Système Français',
      description: 'Système éducatif français',
      sortOrder: 1,
    },
  });

  const frenchSystemCM = await prisma.educationSystem.upsert({
    where: { countryId_code: { countryId: cameroon.id, code: 'FRENCH' } },
    update: {},
    create: {
      countryId: cameroon.id,
      code: 'FRENCH',
      name: 'Système Français',
      description: 'Système éducatif français',
      sortOrder: 1,
    },
  });

  const frenchSystemCI = await prisma.educationSystem.upsert({
    where: { countryId_code: { countryId: ivoryCoast.id, code: 'FRENCH' } },
    update: {},
    create: {
      countryId: ivoryCoast.id,
      code: 'FRENCH',
      name: 'Système Français',
      description: 'Système éducatif français',
      sortOrder: 1,
    },
  });

  console.log('✅ Created education systems');

  // ============================================================================
  // 5. CREATE EDUCATION LEVELS (French System - Senegal as example)
  // ============================================================================
  console.log('Creating education levels...');

  const levels = await Promise.all([
    // Primary
    prisma.educationLevel.upsert({
      where: { systemId_code: { systemId: frenchSystemSN.id, code: 'CP' } },
      update: {},
      create: {
        systemId: frenchSystemSN.id,
        code: 'CP',
        name: 'CP',
        category: 'PRIMARY',
        order: 1,
        hasStreams: false,
      },
    }),
    prisma.educationLevel.upsert({
      where: { systemId_code: { systemId: frenchSystemSN.id, code: 'CE1' } },
      update: {},
      create: {
        systemId: frenchSystemSN.id,
        code: 'CE1',
        name: 'CE1',
        category: 'PRIMARY',
        order: 2,
        hasStreams: false,
      },
    }),
    // Middle School
    prisma.educationLevel.upsert({
      where: { systemId_code: { systemId: frenchSystemSN.id, code: '6EME' } },
      update: {},
      create: {
        systemId: frenchSystemSN.id,
        code: '6EME',
        name: '6ème',
        category: 'MIDDLE_SCHOOL',
        order: 6,
        hasStreams: false,
      },
    }),
    // High School
    prisma.educationLevel.upsert({
      where: { systemId_code: { systemId: frenchSystemSN.id, code: 'SECONDE' } },
      update: {},
      create: {
        systemId: frenchSystemSN.id,
        code: 'SECONDE',
        name: 'Seconde',
        category: 'HIGH_SCHOOL',
        order: 10,
        hasStreams: true,
      },
    }),
    prisma.educationLevel.upsert({
      where: { systemId_code: { systemId: frenchSystemSN.id, code: 'TERMINALE' } },
      update: {},
      create: {
        systemId: frenchSystemSN.id,
        code: 'TERMINALE',
        name: 'Terminale',
        category: 'HIGH_SCHOOL',
        order: 12,
        hasStreams: true,
      },
    }),
  ]);

  console.log(`✅ Created ${levels.length} education levels`);

  // ============================================================================
  // 6. CREATE EDUCATION STREAMS
  // ============================================================================
  console.log('Creating education streams...');

  const terminale = levels.find(l => l.code === 'TERMINALE')!;

  const streams = await Promise.all([
    prisma.educationStream.upsert({
      where: { levelId_code: { levelId: terminale.id, code: 'S' } },
      update: {},
      create: {
        levelId: terminale.id,
        code: 'S',
        name: 'Scientifique',
        description: 'Série Scientifique',
        sortOrder: 1,
      },
    }),
    prisma.educationStream.upsert({
      where: { levelId_code: { levelId: terminale.id, code: 'L' } },
      update: {},
      create: {
        levelId: terminale.id,
        code: 'L',
        name: 'Littéraire',
        description: 'Série Littéraire',
        sortOrder: 2,
      },
    }),
    prisma.educationStream.upsert({
      where: { levelId_code: { levelId: terminale.id, code: 'ES' } },
      update: {},
      create: {
        levelId: terminale.id,
        code: 'ES',
        name: 'Économique et Social',
        description: 'Série Économique et Sociale',
        sortOrder: 3,
      },
    }),
  ]);

  console.log(`✅ Created ${streams.length} education streams`);

  // ============================================================================
  // 7. LINK SUBJECTS TO LEVELS
  // ============================================================================
  console.log('Linking subjects to levels...');

  const math = subjects.find(s => s.code === 'MATH')!;
  const physics = subjects.find(s => s.code === 'PHYSICS')!;
  const french = subjects.find(s => s.code === 'FRENCH')!;

  // Terminale S - Math is core with high coefficient
  await prisma.levelSubject.upsert({
    where: { levelId_subjectId: { levelId: terminale.id, subjectId: math.id } },
    update: {},
    create: {
      levelId: terminale.id,
      subjectId: math.id,
      isCore: true,
      coefficient: 7,
      hoursPerWeek: 8,
    },
  });

  await prisma.levelSubject.upsert({
    where: { levelId_subjectId: { levelId: terminale.id, subjectId: physics.id } },
    update: {},
    create: {
      levelId: terminale.id,
      subjectId: physics.id,
      isCore: true,
      coefficient: 6,
      hoursPerWeek: 6,
    },
  });

  await prisma.levelSubject.upsert({
    where: { levelId_subjectId: { levelId: terminale.id, subjectId: french.id } },
    update: {},
    create: {
      levelId: terminale.id,
      subjectId: french.id,
      isCore: true,
      coefficient: 4,
      hoursPerWeek: 4,
    },
  });

  console.log('✅ Linked subjects to levels');

  console.log('✅ Education data seeded successfully!');
}

seedEducation()
  .catch((e) => {
    console.error('❌ Error seeding education data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
