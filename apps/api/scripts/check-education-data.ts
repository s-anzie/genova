/**
 * Check Education Data Script
 * 
 * Verifies that education data exists in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEducationData() {
  try {
    console.log('🔍 Checking education data in database...\n');

    // Check countries
    const countries = await prisma.country.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    console.log(`✅ Countries: ${countries.length}`);
    countries.forEach(c => console.log(`   - ${c.name} (${c.code})`));

    // Check education systems
    const systems = await prisma.educationSystem.findMany({
      where: { isActive: true },
      include: { country: true },
      orderBy: { sortOrder: 'asc' },
    });
    console.log(`\n✅ Education Systems: ${systems.length}`);
    systems.forEach(s => console.log(`   - ${s.name} (${s.code}) - ${s.country.name}`));

    // Check education levels
    const levels = await prisma.educationLevel.findMany({
      where: { isActive: true },
      include: { system: true },
      orderBy: { order: 'asc' },
    });
    console.log(`\n✅ Education Levels: ${levels.length}`);
    levels.forEach(l => console.log(`   - ${l.name} (${l.code}) - ${l.system.name}`));

    // Check subjects
    const subjects = await prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    console.log(`\n✅ Subjects: ${subjects.length}`);
    subjects.forEach(s => console.log(`   - ${s.name} (${s.code})`));

    // Check teaching languages
    const languages = await prisma.teachingLanguage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    console.log(`\n✅ Teaching Languages: ${languages.length}`);
    languages.forEach(l => console.log(`   - ${l.name} (${l.code})`));

    console.log('\n✅ All education data checked successfully!');
  } catch (error) {
    console.error('❌ Error checking education data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEducationData();
