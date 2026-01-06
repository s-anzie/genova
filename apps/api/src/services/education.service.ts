import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '@repo/utils';

const prisma = new PrismaClient();

// ============================================================================
// EDUCATION SYSTEMS
// ============================================================================

/**
 * Get all education systems for a country
 */
export async function getEducationSystems(countryCode: string) {
  const country = await prisma.country.findUnique({
    where: { code: countryCode },
    include: {
      educationSystems: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!country) {
    throw new NotFoundError('Country not found');
  }

  return country.educationSystems;
}

/**
 * Get education system by ID
 */
export async function getEducationSystemById(systemId: string) {
  const system = await prisma.educationSystem.findUnique({
    where: { id: systemId },
    include: {
      country: true,
      levels: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!system) {
    throw new NotFoundError('Education system not found');
  }

  return system;
}

// ============================================================================
// EDUCATION LEVELS
// ============================================================================

/**
 * Get levels for a system
 */
export async function getEducationLevels(systemId: string) {
  return await prisma.educationLevel.findMany({
    where: { systemId, isActive: true },
    include: {
      streams: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
      subjects: {
        include: {
          subject: true,
        },
        orderBy: [
          { isCore: 'desc' },
          { subject: { sortOrder: 'asc' } },
        ],
      },
    },
    orderBy: { order: 'asc' },
  });
}

/**
 * Get education level by ID
 */
export async function getEducationLevelById(levelId: string) {
  const level = await prisma.educationLevel.findUnique({
    where: { id: levelId },
    include: {
      system: {
        include: {
          country: true,
        },
      },
      streams: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
      subjects: {
        include: {
          subject: true,
        },
      },
    },
  });

  if (!level) {
    throw new NotFoundError('Education level not found');
  }

  return level;
}

// ============================================================================
// EDUCATION STREAMS
// ============================================================================

/**
 * Get streams for a level
 */
export async function getEducationStreams(levelId: string) {
  return await prisma.educationStream.findMany({
    where: { levelId, isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * Get education stream by ID
 */
export async function getEducationStreamById(streamId: string) {
  const stream = await prisma.educationStream.findUnique({
    where: { id: streamId },
    include: {
      level: {
        include: {
          system: true,
        },
      },
    },
  });

  if (!stream) {
    throw new NotFoundError('Education stream not found');
  }

  return stream;
}

// ============================================================================
// SUBJECTS
// ============================================================================

/**
 * Get all subjects (for tutors)
 */
export async function getAllSubjects() {
  return await prisma.subject.findMany({
    where: { isActive: true },
    orderBy: [
      { category: 'asc' },
      { sortOrder: 'asc' },
    ],
  });
}

/**
 * Get subject by ID
 */
export async function getSubjectById(subjectId: string) {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
  });

  if (!subject) {
    throw new NotFoundError('Subject not found');
  }

  return subject;
}

/**
 * Get subject by code
 */
export async function getSubjectByCode(code: string) {
  const subject = await prisma.subject.findUnique({
    where: { code },
  });

  if (!subject) {
    throw new NotFoundError('Subject not found');
  }

  return subject;
}

/**
 * Get subjects for a level
 */
export async function getLevelSubjects(levelId: string) {
  return await prisma.levelSubject.findMany({
    where: { levelId },
    include: {
      subject: true,
    },
    orderBy: [
      { isCore: 'desc' },
      { subject: { sortOrder: 'asc' } },
    ],
  });
}

// ============================================================================
// TEACHING LANGUAGES
// ============================================================================

/**
 * Get all teaching languages
 */
export async function getTeachingLanguages() {
  return await prisma.teachingLanguage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * Get teaching language by ID
 */
export async function getTeachingLanguageById(languageId: string) {
  const language = await prisma.teachingLanguage.findUnique({
    where: { id: languageId },
  });

  if (!language) {
    throw new NotFoundError('Teaching language not found');
  }

  return language;
}

/**
 * Get teaching language by code
 */
export async function getTeachingLanguageByCode(code: string) {
  const language = await prisma.teachingLanguage.findUnique({
    where: { code },
  });

  if (!language) {
    throw new NotFoundError('Teaching language not found');
  }

  return language;
}

// ============================================================================
// LOCAL LANGUAGES
// ============================================================================

/**
 * Get local languages for a country
 */
export async function getLocalLanguages(countryCode: string) {
  const country = await prisma.country.findUnique({
    where: { code: countryCode },
    include: {
      localLanguages: {
        orderBy: [
          { isOfficial: 'desc' },
          { sortOrder: 'asc' },
        ],
      },
    },
  });

  if (!country) {
    throw new NotFoundError('Country not found');
  }

  return country.localLanguages;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate education hierarchy
 */
export async function validateEducationHierarchy(
  systemId: string,
  levelId: string,
  streamId?: string
): Promise<boolean> {
  const level = await prisma.educationLevel.findUnique({
    where: { id: levelId },
    include: { streams: true },
  });

  if (!level || level.systemId !== systemId) {
    return false;
  }

  if (streamId) {
    const stream = level.streams.find(s => s.id === streamId);
    if (!stream) {
      return false;
    }
  }

  return true;
}

/**
 * Check if subject is available for level
 */
export async function isSubjectAvailableForLevel(
  subjectId: string,
  levelId: string
): Promise<boolean> {
  const levelSubject = await prisma.levelSubject.findUnique({
    where: {
      levelId_subjectId: {
        levelId,
        subjectId,
      },
    },
  });
  return !!levelSubject;
}

/**
 * Validate that all subjects are available for a level
 */
export async function validateSubjectsForLevel(
  subjectIds: string[],
  levelId: string
): Promise<{ valid: boolean; invalidSubjects: string[] }> {
  const invalidSubjects: string[] = [];

  for (const subjectId of subjectIds) {
    const isAvailable = await isSubjectAvailableForLevel(subjectId, levelId);
    if (!isAvailable) {
      invalidSubjects.push(subjectId);
    }
  }

  return {
    valid: invalidSubjects.length === 0,
    invalidSubjects,
  };
}


// ============================================================================
// TUTOR TEACHING SUBJECTS
// ============================================================================

/**
 * Add teaching subject for a tutor
 * Links a tutor to a specific LevelSubject (e.g., "Math in 6ème")
 */
export async function addTutorTeachingSubject(
  tutorProfileId: string,
  levelSubjectId: string,
  yearsExperience?: number
) {
  // Verify levelSubject exists
  const levelSubject = await prisma.levelSubject.findUnique({
    where: { id: levelSubjectId },
    include: {
      level: {
        include: {
          system: {
            include: {
              country: true,
            },
          },
        },
      },
      subject: true,
    },
  });

  if (!levelSubject) {
    throw new NotFoundError('Level subject combination not found');
  }

  // Check if already exists
  const existing = await prisma.tutorTeachingSubject.findUnique({
    where: {
      tutorProfileId_levelSubjectId: {
        tutorProfileId,
        levelSubjectId,
      },
    },
  });

  if (existing) {
    // Update if exists
    return await prisma.tutorTeachingSubject.update({
      where: { id: existing.id },
      data: { yearsExperience },
      include: {
        levelSubject: {
          include: {
            level: {
              include: {
                system: {
                  include: {
                    country: true,
                  },
                },
              },
            },
            subject: true,
          },
        },
      },
    });
  }

  // Create new
  return await prisma.tutorTeachingSubject.create({
    data: {
      tutorProfileId,
      levelSubjectId,
      yearsExperience,
    },
    include: {
      levelSubject: {
        include: {
          level: {
            include: {
              system: {
                include: {
                  country: true,
                },
              },
            },
          },
          subject: true,
        },
      },
    },
  });
}

/**
 * Remove teaching subject for a tutor
 */
export async function removeTutorTeachingSubject(
  tutorProfileId: string,
  levelSubjectId: string
) {
  const teaching = await prisma.tutorTeachingSubject.findUnique({
    where: {
      tutorProfileId_levelSubjectId: {
        tutorProfileId,
        levelSubjectId,
      },
    },
  });

  if (!teaching) {
    throw new NotFoundError('Teaching subject not found');
  }

  await prisma.tutorTeachingSubject.delete({
    where: { id: teaching.id },
  });
}

/**
 * Get all teaching subjects for a tutor
 */
export async function getTutorTeachingSubjects(tutorProfileId: string) {
  return await prisma.tutorTeachingSubject.findMany({
    where: { tutorProfileId },
    include: {
      levelSubject: {
        include: {
          level: {
            include: {
              system: {
                include: {
                  country: true,
                },
              },
            },
          },
          subject: true,
        },
      },
    },
    orderBy: [
      { levelSubject: { level: { order: 'asc' } } },
      { levelSubject: { subject: { sortOrder: 'asc' } } },
    ],
  });
}

/**
 * Get tutors who teach a specific level subject
 */
export async function getTutorsForLevelSubject(levelSubjectId: string) {
  return await prisma.tutorTeachingSubject.findMany({
    where: { levelSubjectId },
    include: {
      tutorProfile: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              countryCode: true,
              city: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Bulk add teaching subjects for a tutor
 * Used during onboarding
 */
export async function bulkAddTutorTeachingSubjects(
  tutorProfileId: string,
  levelSubjectIds: string[]
) {
  const results = [];

  for (const levelSubjectId of levelSubjectIds) {
    try {
      const teaching = await addTutorTeachingSubject(tutorProfileId, levelSubjectId);
      results.push({ success: true, teaching });
    } catch (error: any) {
      results.push({ success: false, levelSubjectId, error: error.message });
    }
  }

  return results;
}

/**
 * Get available level subjects for a tutor based on their country
 * This ensures tutors only see subjects from their education system
 */
export async function getAvailableLevelSubjectsForTutor(tutorUserId: string) {
  // Get tutor's country
  const user = await prisma.user.findUnique({
    where: { id: tutorUserId },
    select: { countryCode: true },
  });

  if (!user || !user.countryCode) {
    throw new NotFoundError('User or country not found');
  }

  // Get education systems for this country
  const systems = await prisma.educationSystem.findMany({
    where: {
      country: {
        code: user.countryCode,
      },
      isActive: true,
    },
    include: {
      levels: {
        where: { isActive: true },
        include: {
          subjects: {
            include: {
              subject: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  // Flatten to get all level subjects
  const levelSubjects = systems.flatMap(system =>
    system.levels.flatMap(level =>
      level.subjects.map(ls => ({
        ...ls,
        level: {
          ...level,
          system: {
            id: system.id,
            code: system.code,
            name: system.name,
          },
        },
      }))
    )
  );

  return levelSubjects;
}
