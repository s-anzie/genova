/**
 * Legacy Conversion Service
 * 
 * Provides backward compatibility by converting old data formats
 * to the new education architecture.
 */

import { prisma } from '../lib/prisma';
import { ValidationError } from '@repo/utils';

/**
 * Convert legacy education format to new architecture
 */
export async function convertLegacyEducationLevel(
  educationLevel: string,
  educationSystem?: string
): Promise<{
  educationSystemId: string;
  educationLevelId: string;
  educationStreamId?: string;
}> {
  // Map legacy system values to new codes
  const systemCodeMap: Record<string, string> = {
    'FRENCH': 'FRENCH',
    'SENEGALESE': 'SENEGALESE',
    'INTERNATIONAL': 'INTERNATIONAL',
    'OTHER': 'FRENCH', // Default to French for "OTHER"
  };

  const systemCode = systemCodeMap[educationSystem || 'FRENCH'] || 'FRENCH';
  
  // Find education system
  const system = await prisma.educationSystem.findFirst({
    where: {
      code: systemCode,
    },
  });

  if (!system) {
    throw new ValidationError(`Education system not found: ${systemCode}`, 'educationSystem');
  }

  // Find education level by name (case-insensitive)
  const level = await prisma.educationLevel.findFirst({
    where: {
      systemId: system.id,
      OR: [
        { name: educationLevel },
        { code: educationLevel },
      ],
    },
  });

  if (!level) {
    // If not found, try to find by partial match
    const levelPartial = await prisma.educationLevel.findFirst({
      where: {
        systemId: system.id,
        OR: [
          { name: { contains: educationLevel, mode: 'insensitive' } },
          { code: { contains: educationLevel, mode: 'insensitive' } },
        ],
      },
    });

    if (!levelPartial) {
      throw new ValidationError(
        `Education level not found: ${educationLevel} in system ${systemCode}`,
        'educationLevel'
      );
    }

    return {
      educationSystemId: system.id,
      educationLevelId: levelPartial.id,
    };
  }

  return {
    educationSystemId: system.id,
    educationLevelId: level.id,
  };
}

/**
 * Convert legacy subject names to LevelSubject IDs
 */
export async function convertLegacySubjects(
  subjectNames: string[],
  educationLevelId: string
): Promise<string[]> {
  if (!subjectNames || subjectNames.length === 0) {
    return [];
  }

  const levelSubjects = await prisma.levelSubject.findMany({
    where: {
      levelId: educationLevelId,
      subject: {
        OR: subjectNames.map(name => ({
          OR: [
            { name: { contains: name, mode: 'insensitive' } },
            { nameEn: { contains: name, mode: 'insensitive' } },
          ],
        })),
      },
    },
    select: {
      id: true,
      subject: {
        select: {
          name: true,
        },
      },
    },
  });

  // Log conversion for debugging
  console.log(`Converted ${subjectNames.length} subjects to ${levelSubjects.length} level subjects`);
  
  return levelSubjects.map(ls => ls.id);
}

/**
 * Convert legacy language names to TeachingLanguage IDs
 */
export async function convertLegacyLanguages(
  languageNames: string[]
): Promise<string[]> {
  if (!languageNames || languageNames.length === 0) {
    return [];
  }

  const languages = await prisma.teachingLanguage.findMany({
    where: {
      OR: languageNames.map(name => ({
        OR: [
          { name: { contains: name, mode: 'insensitive' } },
          { nativeName: { contains: name, mode: 'insensitive' } },
          { code: name.toLowerCase().substring(0, 2) }, // Try language code (fr, en, etc.)
        ],
      })),
    },
    select: {
      id: true,
      name: true,
    },
  });

  // Log conversion for debugging
  console.log(`Converted ${languageNames.length} languages to ${languages.length} teaching languages`);
  
  return languages.map(l => l.id);
}

/**
 * Convert legacy education level categories (Primaire, Collège, etc.) to level IDs
 */
export async function convertLegacyEducationLevels(
  levelNames: string[],
  systemId: string
): Promise<string[]> {
  if (!levelNames || levelNames.length === 0) {
    return [];
  }

  // Map French names to categories
  const categoryMap: Record<string, string> = {
    'Primaire': 'PRIMARY',
    'Collège': 'MIDDLE_SCHOOL',
    'Lycée': 'HIGH_SCHOOL',
    'Supérieur': 'UNIVERSITY',
    'Professionnel': 'PROFESSIONAL',
  };

  const categories = levelNames
    .map(name => categoryMap[name])
    .filter(Boolean);

  if (categories.length === 0) {
    // If no categories matched, return all levels for the system
    const allLevels = await prisma.educationLevel.findMany({
      where: { systemId },
      select: { id: true },
    });
    return allLevels.map(l => l.id);
  }

  const levels = await prisma.educationLevel.findMany({
    where: {
      systemId,
      category: {
        in: categories as any[],
      },
    },
    select: {
      id: true,
      name: true,
      category: true,
    },
  });

  // Log conversion for debugging
  console.log(`Converted ${levelNames.length} level names to ${levels.length} education levels`);
  
  return levels.map(l => l.id);
}

/**
 * Get teaching level subjects for a tutor based on legacy data
 * This combines subjects and education levels into LevelSubject IDs
 */
export async function getTeachingLevelSubjectsFromLegacy(
  subjects: string[],
  educationLevels: string[],
  systemId: string
): Promise<string[]> {
  if (!subjects || subjects.length === 0) {
    return [];
  }

  // Get level IDs from legacy education levels
  const levelIds = await convertLegacyEducationLevels(educationLevels, systemId);

  if (levelIds.length === 0) {
    // If no levels found, use all levels in the system
    const allLevels = await prisma.educationLevel.findMany({
      where: { systemId },
      select: { id: true },
    });
    levelIds.push(...allLevels.map(l => l.id));
  }

  // For each level, find subjects that match
  const teachingLevelSubjectIds: string[] = [];
  
  for (const levelId of levelIds) {
    const subjectIds = await convertLegacySubjects(subjects, levelId);
    teachingLevelSubjectIds.push(...subjectIds);
  }

  // Remove duplicates
  return Array.from(new Set(teachingLevelSubjectIds));
}

/**
 * Parse experience years from legacy format
 * Converts ranges like "0-1", "1-3", "10+" to a single number
 */
export function parseExperienceYears(experienceYears: string | number): number {
  if (typeof experienceYears === 'number') {
    return experienceYears;
  }

  // Handle ranges like "0-1", "1-3", "3-5", "5-10", "10+"
  if (experienceYears.includes('-')) {
    const [min, max] = experienceYears.split('-').map(s => parseInt(s.trim()));
    return Math.floor(((min ? min : 0) + (max ? max : 0)) / 2); // Return average
  }

  if (experienceYears.includes('+')) {
    const min = parseInt(experienceYears.replace('+', '').trim());
    return min; // Return minimum for "10+"
  }

  return parseInt(experienceYears) || 0;
}
