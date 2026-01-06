import { PrismaClient } from '@prisma/client';
import { logger } from '@repo/utils';

const prisma = new PrismaClient();

/**
 * Get tutor suggestions for a student's unassigned sessions
 */
export async function getTutorSuggestionsForStudent(studentId: string) {
  try {
    // Get student's classes
    const studentClasses = await prisma.classMember.findMany({
      where: {
        studentId,
        isActive: true,
      },
      include: {
        class: {
          include: {
            sessions: {
              where: {
                tutorId: null,
                status: 'PENDING',
                scheduledStart: {
                  gte: new Date(),
                },
              },
              orderBy: {
                scheduledStart: 'asc',
              },
              take: 5,
            },
          },
        },
      },
    });

    // Get unassigned sessions
    const unassignedSessions = studentClasses.flatMap(cm => cm.class.sessions);

    if (unassignedSessions.length === 0) {
      return [];
    }

    // Get subjects from unassigned sessions
    const subjects = [...new Set(unassignedSessions.map(s => s.subject))];

    // Find tutors who teach these subjects
    const tutors = await prisma.user.findMany({
      where: {
        role: 'TUTOR',
        isActive: true,
        tutorProfile: {
          isVerified: true,
          teachingSubjects: {
            some: {
              levelSubject: {
                subject: {
                  name: {
                    in: subjects,
                  },
                },
              },
            },
          },
        },
      },
      include: {
        tutorProfile: {
          select: {
            hourlyRate: true,
            averageRating: true,
            totalReviews: true,
            experienceYears: true,
            bio: true,
            totalHoursTaught: true,
            teachingSubjects: {
              include: {
                levelSubject: {
                  include: {
                    subject: true,
                    level: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 10,
    });

    // Map sessions to suggested tutors
    const suggestions = unassignedSessions.map(session => {
      const matchingTutors = tutors
        .filter(t => {
          const tutorSubjects = t.tutorProfile?.teachingSubjects.map(ts => ts.levelSubject.subject.name) || [];
          return tutorSubjects.includes(session.subject);
        })
        .sort((a, b) => {
          // Sort by rating, then by reviews, then by experience
          const ratingDiff = Number(b.tutorProfile?.averageRating || 0) - Number(a.tutorProfile?.averageRating || 0);
          if (ratingDiff !== 0) return ratingDiff;
          
          const reviewsDiff = (b.tutorProfile?.totalReviews || 0) - (a.tutorProfile?.totalReviews || 0);
          if (reviewsDiff !== 0) return reviewsDiff;
          
          return (b.tutorProfile?.experienceYears || 0) - (a.tutorProfile?.experienceYears || 0);
        })
        .slice(0, 3);

      return {
        session: {
          id: session.id,
          subject: session.subject,
          scheduledStart: session.scheduledStart,
          scheduledEnd: session.scheduledEnd,
          classId: session.classId,
        },
        suggestedTutors: matchingTutors.map(t => {
          const tutorSubjects = t.tutorProfile?.teachingSubjects.map(ts => ts.levelSubject.subject.name) || [];
          const tutorLevels = [...new Set(t.tutorProfile?.teachingSubjects.map(ts => ts.levelSubject.level.name) || [])];
          
          return {
            id: t.id,
            userId: t.id,
            firstName: t.firstName,
            lastName: t.lastName,
            avatarUrl: t.avatarUrl,
            hourlyRate: Number(t.tutorProfile?.hourlyRate || 0),
            subjects: tutorSubjects,
            educationLevels: tutorLevels,
            averageRating: Number(t.tutorProfile?.averageRating || 0),
            totalReviews: t.tutorProfile?.totalReviews || 0,
            totalHoursTaught: t.tutorProfile?.totalHoursTaught || 0,
            bio: t.tutorProfile?.bio,
          };
        }),
      };
    });

    return suggestions;
  } catch (error) {
    logger.error('Failed to get tutor suggestions:', error);
    throw error;
  }
}

/**
 * Get session suggestions for a tutor based on their profile
 */
export async function getSessionSuggestionsForTutor(tutorId: string) {
  try {
    // Get tutor profile
    const tutor = await prisma.user.findUnique({
      where: { id: tutorId },
      include: {
        tutorProfile: {
          select: {
            teachingMode: true,
            hourlyRate: true,
            teachingSubjects: {
              include: {
                levelSubject: {
                  include: {
                    subject: true,
                    level: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tutor || !tutor.tutorProfile) {
      return [];
    }

    // Extract subjects and education levels from relations
    const subjects = tutor.tutorProfile.teachingSubjects.map(ts => ts.levelSubject.subject.name);
    const educationLevels = [...new Set(tutor.tutorProfile.teachingSubjects.map(ts => ts.levelSubject.level.name))];
    const { teachingMode } = tutor.tutorProfile;

    // Find unassigned sessions that match tutor's profile
    const matchingSessions = await prisma.tutoringSession.findMany({
      where: {
        tutorId: null,
        status: 'PENDING',
        scheduledStart: {
          gte: new Date(),
        },
        subject: {
          in: subjects,
        },
        // Filter by teaching mode if specified
        ...(teachingMode === 'IN_PERSON' && {
          location: { not: null },
        }),
        ...(teachingMode === 'ONLINE' && {
          onlineMeetingLink: { not: null },
        }),
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            educationLevelId: true,
            meetingType: true,
            meetingLocation: true,
            classSubjects: {
              include: {
                levelSubject: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
            _count: {
              select: {
                members: true,
              },
            },
            members: {
              where: { isActive: true },
              take: 3,
              select: {
                student: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        scheduledStart: 'asc',
      },
      take: 10,
    });

    // Filter by education level - skip filtering since we don't have educationLevel on class anymore
    // In the new schema, education level is determined by the LevelSubject relations
    const filteredSessions = matchingSessions;

    // Calculate potential earnings for each session
    const suggestions = filteredSessions.map(session => {
      const duration = (new Date(session.scheduledEnd).getTime() - new Date(session.scheduledStart).getTime()) / (1000 * 60 * 60);
      const studentCount = session.class._count.members;
      const hourlyRate = tutor.tutorProfile?.hourlyRate ? Number(tutor.tutorProfile.hourlyRate) : 0;
      const potentialEarnings = duration * studentCount * hourlyRate;

      // Extract class subjects
      const classSubjects = session.class.classSubjects.map(cs => cs.levelSubject.subject.name);

      return {
        session: {
          id: session.id,
          subject: session.subject,
          scheduledStart: session.scheduledStart,
          scheduledEnd: session.scheduledEnd,
          location: session.location,
          onlineMeetingLink: session.onlineMeetingLink,
        },
        class: {
          id: session.class.id,
          name: session.class.name,
          educationLevelId: session.class.educationLevelId,
          subjects: classSubjects,
          meetingType: session.class.meetingType,
          meetingLocation: session.class.meetingLocation,
          studentCount: studentCount,
          students: session.class.members.map(m => m.student),
        },
        potentialEarnings: Math.round(potentialEarnings),
        matchScore: calculateMatchScore(session, { subjects, educationLevels, teachingMode }),
      };
    });

    // Sort by match score and potential earnings
    suggestions.sort((a, b) => {
      const scoreDiff = b.matchScore - a.matchScore;
      if (scoreDiff !== 0) return scoreDiff;
      return b.potentialEarnings - a.potentialEarnings;
    });

    return suggestions;
  } catch (error) {
    logger.error('Failed to get session suggestions:', error);
    throw error;
  }
}

/**
 * Calculate match score between a session and tutor profile
 */
function calculateMatchScore(session: any, tutorProfile: { subjects: string[], educationLevels: string[], teachingMode: string }): number {
  let score = 0;

  // Subject match (most important)
  if (tutorProfile.subjects.includes(session.subject)) {
    score += 50;
  }

  // Teaching mode match
  if (tutorProfile.teachingMode === 'BOTH') {
    score += 20;
  } else if (
    (tutorProfile.teachingMode === 'ONLINE' && session.onlineMeetingLink) ||
    (tutorProfile.teachingMode === 'IN_PERSON' && session.location)
  ) {
    score += 20;
  }

  // Education level match - simplified since we don't have direct access to class education level
  // We could enhance this by checking if any of the tutor's levels match the class's level
  score += 30;

  return score;
}
