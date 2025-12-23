import { PrismaClient, SessionReport } from '@prisma/client';
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError 
} from '@repo/utils';

const prisma = new PrismaClient();

// Types
export interface CreateSessionReportData {
  sessionId: string;
  topicsCovered?: string;
  homeworkAssigned?: string;
  studentPerformance: { [studentId: string]: StudentPerformance };
  notes?: string;
}

export interface StudentPerformance {
  participation: number;  // 1-5
  understanding: number;  // 1-5
}

export interface SessionReportWithDetails extends SessionReport {
  session: {
    id: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    subject: string;
    class: {
      id: string;
      name: string;
      members: { studentId: string }[];
    };
  };
  tutor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

/**
 * Validate student performance ratings
 * Validates: Requirements 9.5
 */
function validatePerformanceRatings(performance: StudentPerformance): void {
  if (performance.participation < 1 || performance.participation > 5) {
    throw new ValidationError('Participation rating must be between 1 and 5');
  }
  if (performance.understanding < 1 || performance.understanding > 5) {
    throw new ValidationError('Understanding rating must be between 1 and 5');
  }
}

/**
 * Create a session report
 * Validates: Requirements 9.1, 9.2, 9.3
 */
export async function createSessionReport(
  tutorId: string,
  data: CreateSessionReportData
): Promise<SessionReportWithDetails> {
  // Validate required fields
  if (!data.sessionId) {
    throw new ValidationError('Session ID is required');
  }

  if (!data.studentPerformance || Object.keys(data.studentPerformance).length === 0) {
    throw new ValidationError('Student performance ratings are required');
  }

  // Validate all performance ratings (Requirement 9.5)
  for (const [studentId, performance] of Object.entries(data.studentPerformance)) {
    validatePerformanceRatings(performance);
  }

  // Get session with details
  const session = await prisma.tutoringSession.findUnique({
    where: { id: data.sessionId },
    include: {
      class: {
        include: {
          members: {
            where: { isActive: true },
            select: { studentId: true },
          },
        },
      },
    },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  // Verify tutor is the assigned tutor for this session
  if (session.tutorId !== tutorId) {
    throw new AuthorizationError('Only the assigned tutor can submit a report for this session');
  }

  // Verify session is completed
  if (session.status !== 'COMPLETED') {
    throw new ValidationError('Can only submit reports for completed sessions');
  }

  // Check if report already exists
  const existingReport = await prisma.sessionReport.findUnique({
    where: { sessionId: data.sessionId },
  });

  if (existingReport) {
    throw new ValidationError('A report has already been submitted for this session');
  }

  // Verify all student IDs in performance data are class members
  const classMemberIds = session.class.members.map(m => m.studentId);
  const performanceStudentIds = Object.keys(data.studentPerformance);
  
  for (const studentId of performanceStudentIds) {
    if (!classMemberIds.includes(studentId)) {
      throw new ValidationError(`Student ${studentId} is not a member of this class`);
    }
  }

  // Create session report (Requirement 9.2)
  const report = await prisma.sessionReport.create({
    data: {
      sessionId: data.sessionId,
      tutorId,
      topicsCovered: data.topicsCovered,
      homeworkAssigned: data.homeworkAssigned,
      studentPerformance: data.studentPerformance as any,
      notes: data.notes,
    },
    include: {
      session: {
        include: {
          class: {
            select: {
              id: true,
              name: true,
              members: {
                where: { isActive: true },
                select: { studentId: true },
              },
            },
          },
        },
      },
      tutor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  // TODO: Send notifications to all class members (Requirement 9.3)
  // This would be implemented in a notification service
  // For now, we'll just log it
  console.log(`Session report created for session ${data.sessionId}. Notifications should be sent to class members.`);

  return report as SessionReportWithDetails;
}

/**
 * Get session report by session ID
 * Validates: Requirements 9.4
 */
export async function getSessionReport(
  sessionId: string,
  requestingUserId: string
): Promise<SessionReportWithDetails> {
  // Get report with details
  const report = await prisma.sessionReport.findUnique({
    where: { sessionId },
    include: {
      session: {
        include: {
          class: {
            select: {
              id: true,
              name: true,
              members: {
                where: { isActive: true },
                select: { studentId: true },
              },
            },
          },
        },
      },
      tutor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!report) {
    throw new NotFoundError('Session report not found');
  }

  // Verify requesting user is either the tutor or a class member
  const isTutor = report.tutorId === requestingUserId;
  const isClassMember = report.session.class.members.some(m => m.studentId === requestingUserId);

  if (!isTutor && !isClassMember) {
    throw new AuthorizationError('Only the tutor or class members can view this report');
  }

  return report as SessionReportWithDetails;
}

/**
 * Get all reports for a tutor
 */
export async function getTutorReports(
  tutorId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<SessionReportWithDetails[]> {
  const whereConditions: any = {
    tutorId,
  };

  // Apply date filters on the session's scheduled start
  if (filters?.startDate || filters?.endDate) {
    whereConditions.session = {
      scheduledStart: {},
    };
    if (filters.startDate) {
      whereConditions.session.scheduledStart.gte = filters.startDate;
    }
    if (filters.endDate) {
      whereConditions.session.scheduledStart.lte = filters.endDate;
    }
  }

  const reports = await prisma.sessionReport.findMany({
    where: whereConditions,
    include: {
      session: {
        include: {
          class: {
            select: {
              id: true,
              name: true,
              members: {
                where: { isActive: true },
                select: { studentId: true },
              },
            },
          },
        },
      },
      tutor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return reports as SessionReportWithDetails[];
}

/**
 * Get all reports for a student
 */
export async function getStudentReports(
  studentId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<SessionReportWithDetails[]> {
  const whereConditions: any = {
    session: {
      class: {
        members: {
          some: {
            studentId,
            isActive: true,
          },
        },
      },
    },
  };

  // Apply date filters
  if (filters?.startDate || filters?.endDate) {
    if (!whereConditions.session.scheduledStart) {
      whereConditions.session.scheduledStart = {};
    }
    if (filters.startDate) {
      whereConditions.session.scheduledStart.gte = filters.startDate;
    }
    if (filters.endDate) {
      whereConditions.session.scheduledStart.lte = filters.endDate;
    }
  }

  const reports = await prisma.sessionReport.findMany({
    where: whereConditions,
    include: {
      session: {
        include: {
          class: {
            select: {
              id: true,
              name: true,
              members: {
                where: { isActive: true },
                select: { studentId: true },
              },
            },
          },
        },
      },
      tutor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return reports as SessionReportWithDetails[];
}

/**
 * Update a session report
 */
export async function updateSessionReport(
  sessionId: string,
  tutorId: string,
  data: Partial<CreateSessionReportData>
): Promise<SessionReportWithDetails> {
  // Get existing report
  const existingReport = await prisma.sessionReport.findUnique({
    where: { sessionId },
  });

  if (!existingReport) {
    throw new NotFoundError('Session report not found');
  }

  // Verify tutor is the report author
  if (existingReport.tutorId !== tutorId) {
    throw new AuthorizationError('Only the report author can update this report');
  }

  // Validate performance ratings if provided
  if (data.studentPerformance) {
    for (const [studentId, performance] of Object.entries(data.studentPerformance)) {
      validatePerformanceRatings(performance);
    }
  }

  // Update report
  const updatedReport = await prisma.sessionReport.update({
    where: { sessionId },
    data: {
      topicsCovered: data.topicsCovered,
      homeworkAssigned: data.homeworkAssigned,
      studentPerformance: data.studentPerformance as any,
      notes: data.notes,
    },
    include: {
      session: {
        include: {
          class: {
            select: {
              id: true,
              name: true,
              members: {
                where: { isActive: true },
                select: { studentId: true },
              },
            },
          },
        },
      },
      tutor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return updatedReport as SessionReportWithDetails;
}
