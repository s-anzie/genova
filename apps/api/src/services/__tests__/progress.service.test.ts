import { PrismaClient } from '@prisma/client';
import {
  createAcademicResult,
  getStudentResults,
  calculateImprovement,
  getSubjectProgress,
  getProgressDashboard,
  getProgressVisualizationData,
  updateAcademicResult,
  deleteAcademicResult,
  getStudentSubjects,
  CreateAcademicResultData,
} from '../progress.service';
import { ValidationError, NotFoundError, AuthorizationError } from '@repo/utils';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    academicResult: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tutoringSession: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    badge: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    userBadge: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

const prisma = new PrismaClient();

describe('Progress Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAcademicResult', () => {
    const studentId = 'student-123';

    const validResultData: CreateAcademicResultData = {
      subject: 'Mathematics',
      examName: 'Midterm Exam',
      score: 85,
      maxScore: 100,
      examDate: new Date('2025-01-15'),
    };

    const mockStudent = {
      id: studentId,
      role: 'STUDENT',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    it('should create an academic result successfully', async () => {
      const mockResult = {
        id: 'result-123',
        studentId,
        ...validResultData,
        createdAt: new Date(),
        student: mockStudent,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockStudent);
      (prisma.academicResult.create as jest.Mock).mockResolvedValue(mockResult);
      (prisma.academicResult.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.badge.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await createAcademicResult(studentId, validResultData);

      expect(result).toEqual(mockResult);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: studentId },
        select: {
          id: true,
          role: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });
      expect(prisma.academicResult.create).toHaveBeenCalled();
    });

    it('should throw ValidationError if subject is empty', async () => {
      const invalidData = { ...validResultData, subject: '' };

      await expect(createAcademicResult(studentId, invalidData)).rejects.toThrow(ValidationError);
      await expect(createAcademicResult(studentId, invalidData)).rejects.toThrow('Subject is required');
    });

    it('should throw ValidationError if exam name is empty', async () => {
      const invalidData = { ...validResultData, examName: '' };

      await expect(createAcademicResult(studentId, invalidData)).rejects.toThrow(ValidationError);
      await expect(createAcademicResult(studentId, invalidData)).rejects.toThrow('Exam name is required');
    });

    it('should throw ValidationError if score is negative', async () => {
      const invalidData = { ...validResultData, score: -10 };

      await expect(createAcademicResult(studentId, invalidData)).rejects.toThrow(ValidationError);
      await expect(createAcademicResult(studentId, invalidData)).rejects.toThrow('Score cannot be negative');
    });

    it('should throw ValidationError if max score is zero or negative', async () => {
      const invalidData = { ...validResultData, maxScore: 0 };

      await expect(createAcademicResult(studentId, invalidData)).rejects.toThrow(ValidationError);
      await expect(createAcademicResult(studentId, invalidData)).rejects.toThrow('Max score must be greater than zero');
    });

    it('should throw ValidationError if score exceeds max score', async () => {
      const invalidData = { ...validResultData, score: 110, maxScore: 100 };

      await expect(createAcademicResult(studentId, invalidData)).rejects.toThrow(ValidationError);
      await expect(createAcademicResult(studentId, invalidData)).rejects.toThrow('Score cannot exceed max score');
    });

    it('should throw ValidationError if exam date is in the future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const invalidData = { ...validResultData, examDate: futureDate };

      await expect(createAcademicResult(studentId, invalidData)).rejects.toThrow(ValidationError);
      await expect(createAcademicResult(studentId, invalidData)).rejects.toThrow('Exam date cannot be in the future');
    });

    it('should throw NotFoundError if student does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(createAcademicResult(studentId, validResultData)).rejects.toThrow(NotFoundError);
      await expect(createAcademicResult(studentId, validResultData)).rejects.toThrow('Student not found');
    });

    it('should throw ValidationError if user is not a student', async () => {
      const tutorUser = { ...mockStudent, role: 'TUTOR' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(tutorUser);

      await expect(createAcademicResult(studentId, validResultData)).rejects.toThrow(ValidationError);
      await expect(createAcademicResult(studentId, validResultData)).rejects.toThrow('Only students can add academic results');
    });
  });

  describe('getStudentResults', () => {
    const studentId = 'student-123';

    it('should return all results for a student', async () => {
      const mockResults = [
        {
          id: 'result-1',
          studentId,
          subject: 'Math',
          examName: 'Test 1',
          score: 85,
          maxScore: 100,
          examDate: new Date('2025-01-15'),
          createdAt: new Date(),
        },
        {
          id: 'result-2',
          studentId,
          subject: 'Physics',
          examName: 'Test 1',
          score: 90,
          maxScore: 100,
          examDate: new Date('2025-01-20'),
          createdAt: new Date(),
        },
      ];

      (prisma.academicResult.findMany as jest.Mock).mockResolvedValue(mockResults);

      const result = await getStudentResults(studentId);

      expect(result).toEqual(mockResults);
      expect(prisma.academicResult.findMany).toHaveBeenCalledWith({
        where: { studentId },
        orderBy: { examDate: 'desc' },
      });
    });

    it('should filter results by subject', async () => {
      const mockResults = [
        {
          id: 'result-1',
          studentId,
          subject: 'Math',
          examName: 'Test 1',
          score: 85,
          maxScore: 100,
          examDate: new Date('2025-01-15'),
          createdAt: new Date(),
        },
      ];

      (prisma.academicResult.findMany as jest.Mock).mockResolvedValue(mockResults);

      await getStudentResults(studentId, { subject: 'Math' });

      expect(prisma.academicResult.findMany).toHaveBeenCalledWith({
        where: { studentId, subject: 'Math' },
        orderBy: { examDate: 'desc' },
      });
    });

    it('should filter results by date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      (prisma.academicResult.findMany as jest.Mock).mockResolvedValue([]);

      await getStudentResults(studentId, { startDate, endDate });

      expect(prisma.academicResult.findMany).toHaveBeenCalledWith({
        where: {
          studentId,
          examDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { examDate: 'desc' },
      });
    });
  });

  describe('calculateImprovement', () => {
    const studentId = 'student-123';
    const subject = 'Math';

    it('should return null if less than 2 results', async () => {
      (prisma.academicResult.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'result-1',
          studentId,
          subject,
          score: 80,
          maxScore: 100,
          examDate: new Date('2025-01-15'),
        },
      ]);

      const result = await calculateImprovement(studentId, subject);

      expect(result).toBeNull();
    });

    it('should calculate positive improvement correctly', async () => {
      (prisma.academicResult.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'result-1',
          studentId,
          subject,
          score: 60,
          maxScore: 100,
          examDate: new Date('2025-01-01'),
        },
        {
          id: 'result-2',
          studentId,
          subject,
          score: 70,
          maxScore: 100,
          examDate: new Date('2025-01-15'),
        },
        {
          id: 'result-3',
          studentId,
          subject,
          score: 80,
          maxScore: 100,
          examDate: new Date('2025-02-01'),
        },
        {
          id: 'result-4',
          studentId,
          subject,
          score: 90,
          maxScore: 100,
          examDate: new Date('2025-02-15'),
        },
      ]);

      const result = await calculateImprovement(studentId, subject);

      // First half average: (60 + 70) / 2 = 65
      // Second half average: (80 + 90) / 2 = 85
      // Improvement: ((85 - 65) / 65) * 100 = 30.77%
      expect(result).toBeCloseTo(30.77, 1);
    });

    it('should calculate negative improvement correctly', async () => {
      (prisma.academicResult.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'result-1',
          studentId,
          subject,
          score: 90,
          maxScore: 100,
          examDate: new Date('2025-01-01'),
        },
        {
          id: 'result-2',
          studentId,
          subject,
          score: 80,
          maxScore: 100,
          examDate: new Date('2025-01-15'),
        },
        {
          id: 'result-3',
          studentId,
          subject,
          score: 70,
          maxScore: 100,
          examDate: new Date('2025-02-01'),
        },
        {
          id: 'result-4',
          studentId,
          subject,
          score: 60,
          maxScore: 100,
          examDate: new Date('2025-02-15'),
        },
      ]);

      const result = await calculateImprovement(studentId, subject);

      // First half average: (90 + 80) / 2 = 85
      // Second half average: (70 + 60) / 2 = 65
      // Improvement: ((65 - 85) / 85) * 100 = -23.53%
      expect(result).toBeCloseTo(-23.53, 1);
    });
  });

  describe('getSubjectProgress', () => {
    const studentId = 'student-123';
    const subject = 'Math';

    it('should return empty progress for subject with no results', async () => {
      (prisma.academicResult.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getSubjectProgress(studentId, subject);

      expect(result).toEqual({
        subject,
        results: [],
        averageScore: 0,
        improvement: null,
        trend: 'stable',
      });
    });

    it('should calculate progress with improving trend', async () => {
      const mockResults = [
        {
          id: 'result-1',
          studentId,
          subject,
          score: 60,
          maxScore: 100,
          examDate: new Date('2025-01-01'),
        },
        {
          id: 'result-2',
          studentId,
          subject,
          score: 80,
          maxScore: 100,
          examDate: new Date('2025-02-01'),
        },
      ];

      (prisma.academicResult.findMany as jest.Mock).mockResolvedValue(mockResults);

      const result = await getSubjectProgress(studentId, subject);

      expect(result.subject).toBe(subject);
      expect(result.results).toEqual(mockResults);
      expect(result.averageScore).toBe(70); // (60 + 80) / 2
      expect(result.improvement).toBeCloseTo(33.33, 1);
      expect(result.trend).toBe('improving');
    });

    it('should calculate progress with declining trend', async () => {
      const mockResults = [
        {
          id: 'result-1',
          studentId,
          subject,
          score: 80,
          maxScore: 100,
          examDate: new Date('2025-01-01'),
        },
        {
          id: 'result-2',
          studentId,
          subject,
          score: 60,
          maxScore: 100,
          examDate: new Date('2025-02-01'),
        },
      ];

      (prisma.academicResult.findMany as jest.Mock).mockResolvedValue(mockResults);

      const result = await getSubjectProgress(studentId, subject);

      expect(result.trend).toBe('declining');
    });
  });

  describe('getProgressDashboard', () => {
    const studentId = 'student-123';

    it('should return complete dashboard data', async () => {
      const mockSessions = [
        {
          scheduledStart: new Date('2025-01-01T10:00:00'),
          scheduledEnd: new Date('2025-01-01T12:00:00'),
          actualStart: new Date('2025-01-01T10:00:00'),
          actualEnd: new Date('2025-01-01T12:00:00'),
        },
      ];

      const mockResults = [
        {
          id: 'result-1',
          studentId,
          subject: 'Math',
          examName: 'Test 1',
          score: 80,
          maxScore: 100,
          examDate: new Date('2025-01-15'),
          createdAt: new Date(),
        },
      ];

      (prisma.tutoringSession.findMany as jest.Mock).mockResolvedValue(mockSessions);
      (prisma.tutoringSession.count as jest.Mock).mockResolvedValue(3);
      (prisma.academicResult.findMany as jest.Mock).mockResolvedValue(mockResults);

      const result = await getProgressDashboard(studentId);

      expect(result.totalHoursTutored).toBe(2); // 2 hours
      expect(result.upcomingSessions).toBe(3);
      expect(result.progressBySubject).toHaveLength(1);
      expect(result.recentResults).toEqual(mockResults);
    });
  });

  describe('updateAcademicResult', () => {
    const resultId = 'result-123';
    const studentId = 'student-123';

    const existingResult = {
      id: resultId,
      studentId,
      subject: 'Math',
      examName: 'Test 1',
      score: 80,
      maxScore: 100,
      examDate: new Date('2025-01-15'),
    };

    it('should update an academic result successfully', async () => {
      const updateData = {
        score: 90,
      };

      const updatedResult = {
        ...existingResult,
        ...updateData,
        student: {
          id: studentId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      };

      (prisma.academicResult.findUnique as jest.Mock).mockResolvedValue(existingResult);
      (prisma.academicResult.update as jest.Mock).mockResolvedValue(updatedResult);
      (prisma.academicResult.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.badge.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await updateAcademicResult(resultId, studentId, updateData);

      expect(result).toEqual(updatedResult);
      expect(prisma.academicResult.update).toHaveBeenCalled();
    });

    it('should throw NotFoundError if result does not exist', async () => {
      (prisma.academicResult.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(updateAcademicResult(resultId, studentId, {})).rejects.toThrow(NotFoundError);
      await expect(updateAcademicResult(resultId, studentId, {})).rejects.toThrow('Academic result not found');
    });

    it('should throw AuthorizationError if user is not the owner', async () => {
      const wrongStudentId = 'wrong-student';
      (prisma.academicResult.findUnique as jest.Mock).mockResolvedValue(existingResult);

      await expect(updateAcademicResult(resultId, wrongStudentId, {})).rejects.toThrow(AuthorizationError);
      await expect(updateAcademicResult(resultId, wrongStudentId, {})).rejects.toThrow('You can only update your own academic results');
    });

    it('should throw ValidationError if updated score exceeds max score', async () => {
      const updateData = { score: 110 };

      (prisma.academicResult.findUnique as jest.Mock).mockResolvedValue(existingResult);

      await expect(updateAcademicResult(resultId, studentId, updateData)).rejects.toThrow(ValidationError);
      await expect(updateAcademicResult(resultId, studentId, updateData)).rejects.toThrow('Score cannot exceed max score');
    });
  });

  describe('deleteAcademicResult', () => {
    const resultId = 'result-123';
    const studentId = 'student-123';

    const existingResult = {
      id: resultId,
      studentId,
      subject: 'Math',
      examName: 'Test 1',
      score: 80,
      maxScore: 100,
      examDate: new Date('2025-01-15'),
    };

    it('should delete an academic result successfully', async () => {
      (prisma.academicResult.findUnique as jest.Mock).mockResolvedValue(existingResult);
      (prisma.academicResult.delete as jest.Mock).mockResolvedValue(existingResult);

      await deleteAcademicResult(resultId, studentId);

      expect(prisma.academicResult.delete).toHaveBeenCalledWith({
        where: { id: resultId },
      });
    });

    it('should throw NotFoundError if result does not exist', async () => {
      (prisma.academicResult.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(deleteAcademicResult(resultId, studentId)).rejects.toThrow(NotFoundError);
      await expect(deleteAcademicResult(resultId, studentId)).rejects.toThrow('Academic result not found');
    });

    it('should throw AuthorizationError if user is not the owner', async () => {
      const wrongStudentId = 'wrong-student';
      (prisma.academicResult.findUnique as jest.Mock).mockResolvedValue(existingResult);

      await expect(deleteAcademicResult(resultId, wrongStudentId)).rejects.toThrow(AuthorizationError);
      await expect(deleteAcademicResult(resultId, wrongStudentId)).rejects.toThrow('You can only delete your own academic results');
    });
  });

  describe('getStudentSubjects', () => {
    const studentId = 'student-123';

    it('should return all unique subjects for a student', async () => {
      const mockResults = [
        { subject: 'Math' },
        { subject: 'Physics' },
        { subject: 'Chemistry' },
      ];

      (prisma.academicResult.findMany as jest.Mock).mockResolvedValue(mockResults);

      const result = await getStudentSubjects(studentId);

      expect(result).toEqual(['Math', 'Physics', 'Chemistry']);
      expect(prisma.academicResult.findMany).toHaveBeenCalledWith({
        where: { studentId },
        select: { subject: true },
        distinct: ['subject'],
      });
    });

    it('should return empty array if no results', async () => {
      (prisma.academicResult.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getStudentSubjects(studentId);

      expect(result).toEqual([]);
    });
  });

  describe('getProgressVisualizationData', () => {
    const studentId = 'student-123';

    it('should return visualization data for all subjects', async () => {
      const mockResults = [
        {
          id: 'result-1',
          studentId,
          subject: 'Math',
          examName: 'Test 1',
          score: 80,
          maxScore: 100,
          examDate: new Date('2025-01-15'),
        },
        {
          id: 'result-2',
          studentId,
          subject: 'Math',
          examName: 'Test 2',
          score: 90,
          maxScore: 100,
          examDate: new Date('2025-02-15'),
        },
      ];

      (prisma.academicResult.findMany as jest.Mock).mockResolvedValue(mockResults);

      const result = await getProgressVisualizationData(studentId);

      expect(result.labels).toHaveLength(2);
      expect(result.scores).toEqual([80, 90]);
      expect(result.averages).toEqual([80, 85]); // Running average
    });

    it('should return empty data if no results', async () => {
      (prisma.academicResult.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getProgressVisualizationData(studentId);

      expect(result).toEqual({
        labels: [],
        scores: [],
        averages: [],
      });
    });
  });
});
