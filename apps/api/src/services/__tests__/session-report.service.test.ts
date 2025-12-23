import { PrismaClient } from '@prisma/client';
import {
  createSessionReport,
  getSessionReport,
  getTutorReports,
  getStudentReports,
  updateSessionReport,
  CreateSessionReportData,
} from '../session-report.service';
import { ValidationError, NotFoundError, AuthorizationError } from '@repo/utils';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    tutoringSession: {
      findUnique: jest.fn(),
    },
    sessionReport: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

const prisma = new PrismaClient();

describe('Session Report Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSessionReport', () => {
    const tutorId = 'tutor-123';
    const sessionId = 'session-123';
    const studentId1 = 'student-1';
    const studentId2 = 'student-2';

    const validReportData: CreateSessionReportData = {
      sessionId,
      topicsCovered: 'Algebra basics',
      homeworkAssigned: 'Complete exercises 1-10',
      studentPerformance: {
        [studentId1]: { participation: 4, understanding: 5 },
        [studentId2]: { participation: 3, understanding: 4 },
      },
      notes: 'Good session overall',
    };

    const mockSession = {
      id: sessionId,
      tutorId,
      status: 'COMPLETED',
      class: {
        id: 'class-123',
        name: 'Math Class',
        members: [
          { studentId: studentId1 },
          { studentId: studentId2 },
        ],
      },
    };

    it('should create a session report successfully', async () => {
      const mockReport = {
        id: 'report-123',
        sessionId,
        tutorId,
        ...validReportData,
        createdAt: new Date(),
        session: {
          ...mockSession,
          scheduledStart: new Date(),
          scheduledEnd: new Date(),
          subject: 'Math',
        },
        tutor: {
          id: tutorId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      };

      (prisma.tutoringSession.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.sessionReport.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.sessionReport.create as jest.Mock).mockResolvedValue(mockReport);

      const result = await createSessionReport(tutorId, validReportData);

      expect(result).toEqual(mockReport);
      expect(prisma.tutoringSession.findUnique).toHaveBeenCalledWith({
        where: { id: sessionId },
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
      expect(prisma.sessionReport.create).toHaveBeenCalled();
    });

    it('should throw ValidationError if session ID is missing', async () => {
      const invalidData = { ...validReportData, sessionId: '' };

      await expect(createSessionReport(tutorId, invalidData)).rejects.toThrow(ValidationError);
      await expect(createSessionReport(tutorId, invalidData)).rejects.toThrow('Session ID is required');
    });

    it('should throw ValidationError if student performance is missing', async () => {
      const invalidData = { ...validReportData, studentPerformance: {} };

      await expect(createSessionReport(tutorId, invalidData)).rejects.toThrow(ValidationError);
      await expect(createSessionReport(tutorId, invalidData)).rejects.toThrow('Student performance ratings are required');
    });

    it('should throw ValidationError if participation rating is out of range', async () => {
      const invalidData = {
        ...validReportData,
        studentPerformance: {
          [studentId1]: { participation: 6, understanding: 5 },
        },
      };

      (prisma.tutoringSession.findUnique as jest.Mock).mockResolvedValue(mockSession);

      await expect(createSessionReport(tutorId, invalidData)).rejects.toThrow(ValidationError);
      await expect(createSessionReport(tutorId, invalidData)).rejects.toThrow('Participation rating must be between 1 and 5');
    });

    it('should throw ValidationError if understanding rating is out of range', async () => {
      const invalidData = {
        ...validReportData,
        studentPerformance: {
          [studentId1]: { participation: 4, understanding: 0 },
        },
      };

      (prisma.tutoringSession.findUnique as jest.Mock).mockResolvedValue(mockSession);

      await expect(createSessionReport(tutorId, invalidData)).rejects.toThrow(ValidationError);
      await expect(createSessionReport(tutorId, invalidData)).rejects.toThrow('Understanding rating must be between 1 and 5');
    });

    it('should throw NotFoundError if session does not exist', async () => {
      (prisma.tutoringSession.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(createSessionReport(tutorId, validReportData)).rejects.toThrow(NotFoundError);
      await expect(createSessionReport(tutorId, validReportData)).rejects.toThrow('Session not found');
    });

    it('should throw AuthorizationError if user is not the assigned tutor', async () => {
      const wrongTutorId = 'wrong-tutor';
      (prisma.tutoringSession.findUnique as jest.Mock).mockResolvedValue(mockSession);

      await expect(createSessionReport(wrongTutorId, validReportData)).rejects.toThrow(AuthorizationError);
      await expect(createSessionReport(wrongTutorId, validReportData)).rejects.toThrow('Only the assigned tutor can submit a report for this session');
    });

    it('should throw ValidationError if session is not completed', async () => {
      const pendingSession = { ...mockSession, status: 'PENDING' };
      (prisma.tutoringSession.findUnique as jest.Mock).mockResolvedValue(pendingSession);

      await expect(createSessionReport(tutorId, validReportData)).rejects.toThrow(ValidationError);
      await expect(createSessionReport(tutorId, validReportData)).rejects.toThrow('Can only submit reports for completed sessions');
    });

    it('should throw ValidationError if report already exists', async () => {
      const existingReport = { id: 'existing-report', sessionId };
      (prisma.tutoringSession.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.sessionReport.findUnique as jest.Mock).mockResolvedValue(existingReport);

      await expect(createSessionReport(tutorId, validReportData)).rejects.toThrow(ValidationError);
      await expect(createSessionReport(tutorId, validReportData)).rejects.toThrow('A report has already been submitted for this session');
    });

    it('should throw ValidationError if student is not a class member', async () => {
      const invalidData = {
        ...validReportData,
        studentPerformance: {
          'non-member-student': { participation: 4, understanding: 5 },
        },
      };

      (prisma.tutoringSession.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.sessionReport.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(createSessionReport(tutorId, invalidData)).rejects.toThrow(ValidationError);
      await expect(createSessionReport(tutorId, invalidData)).rejects.toThrow('Student non-member-student is not a member of this class');
    });
  });

  describe('getSessionReport', () => {
    const sessionId = 'session-123';
    const tutorId = 'tutor-123';
    const studentId = 'student-123';

    const mockReport = {
      id: 'report-123',
      sessionId,
      tutorId,
      topicsCovered: 'Algebra',
      homeworkAssigned: 'Exercises 1-10',
      studentPerformance: {},
      notes: 'Good session',
      createdAt: new Date(),
      session: {
        id: sessionId,
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        subject: 'Math',
        class: {
          id: 'class-123',
          name: 'Math Class',
          members: [{ studentId }],
        },
      },
      tutor: {
        id: tutorId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
    };

    it('should return report for tutor', async () => {
      (prisma.sessionReport.findUnique as jest.Mock).mockResolvedValue(mockReport);

      const result = await getSessionReport(sessionId, tutorId);

      expect(result).toEqual(mockReport);
      expect(prisma.sessionReport.findUnique).toHaveBeenCalledWith({
        where: { sessionId },
        include: expect.any(Object),
      });
    });

    it('should return report for class member', async () => {
      (prisma.sessionReport.findUnique as jest.Mock).mockResolvedValue(mockReport);

      const result = await getSessionReport(sessionId, studentId);

      expect(result).toEqual(mockReport);
    });

    it('should throw NotFoundError if report does not exist', async () => {
      (prisma.sessionReport.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getSessionReport(sessionId, tutorId)).rejects.toThrow(NotFoundError);
      await expect(getSessionReport(sessionId, tutorId)).rejects.toThrow('Session report not found');
    });

    it('should throw AuthorizationError if user is not tutor or class member', async () => {
      const unauthorizedUserId = 'unauthorized-user';
      (prisma.sessionReport.findUnique as jest.Mock).mockResolvedValue(mockReport);

      await expect(getSessionReport(sessionId, unauthorizedUserId)).rejects.toThrow(AuthorizationError);
      await expect(getSessionReport(sessionId, unauthorizedUserId)).rejects.toThrow('Only the tutor or class members can view this report');
    });
  });

  describe('getTutorReports', () => {
    const tutorId = 'tutor-123';

    it('should return all reports for a tutor', async () => {
      const mockReports = [
        {
          id: 'report-1',
          tutorId,
          sessionId: 'session-1',
          createdAt: new Date(),
          session: {
            id: 'session-1',
            scheduledStart: new Date(),
            scheduledEnd: new Date(),
            subject: 'Math',
            class: {
              id: 'class-1',
              name: 'Math Class',
              members: [],
            },
          },
          tutor: {
            id: tutorId,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
      ];

      (prisma.sessionReport.findMany as jest.Mock).mockResolvedValue(mockReports);

      const result = await getTutorReports(tutorId);

      expect(result).toEqual(mockReports);
      expect(prisma.sessionReport.findMany).toHaveBeenCalledWith({
        where: { tutorId },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter reports by date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      (prisma.sessionReport.findMany as jest.Mock).mockResolvedValue([]);

      await getTutorReports(tutorId, { startDate, endDate });

      expect(prisma.sessionReport.findMany).toHaveBeenCalledWith({
        where: {
          tutorId,
          session: {
            scheduledStart: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getStudentReports', () => {
    const studentId = 'student-123';

    it('should return all reports for a student', async () => {
      const mockReports = [
        {
          id: 'report-1',
          tutorId: 'tutor-123',
          sessionId: 'session-1',
          createdAt: new Date(),
          session: {
            id: 'session-1',
            scheduledStart: new Date(),
            scheduledEnd: new Date(),
            subject: 'Math',
            class: {
              id: 'class-1',
              name: 'Math Class',
              members: [{ studentId }],
            },
          },
          tutor: {
            id: 'tutor-123',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
      ];

      (prisma.sessionReport.findMany as jest.Mock).mockResolvedValue(mockReports);

      const result = await getStudentReports(studentId);

      expect(result).toEqual(mockReports);
      expect(prisma.sessionReport.findMany).toHaveBeenCalledWith({
        where: {
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
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('updateSessionReport', () => {
    const sessionId = 'session-123';
    const tutorId = 'tutor-123';

    const existingReport = {
      id: 'report-123',
      sessionId,
      tutorId,
      topicsCovered: 'Old topics',
      homeworkAssigned: 'Old homework',
      studentPerformance: {},
      notes: 'Old notes',
    };

    it('should update a session report successfully', async () => {
      const updateData = {
        topicsCovered: 'New topics',
        homeworkAssigned: 'New homework',
      };

      const updatedReport = {
        ...existingReport,
        ...updateData,
        session: {
          id: sessionId,
          scheduledStart: new Date(),
          scheduledEnd: new Date(),
          subject: 'Math',
          class: {
            id: 'class-123',
            name: 'Math Class',
            members: [],
          },
        },
        tutor: {
          id: tutorId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      };

      (prisma.sessionReport.findUnique as jest.Mock).mockResolvedValue(existingReport);
      (prisma.sessionReport.update as jest.Mock).mockResolvedValue(updatedReport);

      const result = await updateSessionReport(sessionId, tutorId, updateData);

      expect(result).toEqual(updatedReport);
      expect(prisma.sessionReport.update).toHaveBeenCalledWith({
        where: { sessionId },
        data: updateData,
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundError if report does not exist', async () => {
      (prisma.sessionReport.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(updateSessionReport(sessionId, tutorId, {})).rejects.toThrow(NotFoundError);
      await expect(updateSessionReport(sessionId, tutorId, {})).rejects.toThrow('Session report not found');
    });

    it('should throw AuthorizationError if user is not the report author', async () => {
      const wrongTutorId = 'wrong-tutor';
      (prisma.sessionReport.findUnique as jest.Mock).mockResolvedValue(existingReport);

      await expect(updateSessionReport(sessionId, wrongTutorId, {})).rejects.toThrow(AuthorizationError);
      await expect(updateSessionReport(sessionId, wrongTutorId, {})).rejects.toThrow('Only the report author can update this report');
    });

    it('should validate performance ratings when updating', async () => {
      const invalidUpdate = {
        studentPerformance: {
          'student-1': { participation: 6, understanding: 5 },
        },
      };

      (prisma.sessionReport.findUnique as jest.Mock).mockResolvedValue(existingReport);

      await expect(updateSessionReport(sessionId, tutorId, invalidUpdate)).rejects.toThrow(ValidationError);
      await expect(updateSessionReport(sessionId, tutorId, invalidUpdate)).rejects.toThrow('Participation rating must be between 1 and 5');
    });
  });
});
