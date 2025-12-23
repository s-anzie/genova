import {
  createSession,
  getSessionById,
  getUserSessions,
  confirmSession,
  updateSessionStatus,
  cancelSession,
  rescheduleSession,
  updateSession,
  getClassSessions,
  checkTutorAvailability,
  calculateRefundAmount,
  CreateSessionData,
} from '../session.service';
import { register } from '../auth.service';
import { createStudentProfile, createTutorProfile } from '../profile.service';
import { createClass } from '../class.service';
import { cleanDatabase, disconnectDatabase } from '../../test-setup';
import { Role } from '@prisma/client';

describe('Session Service', () => {
  let studentUserId: string;
  let tutorUserId: string;
  let classId: string;

  beforeEach(async () => {
    await cleanDatabase();

    // Create student user
    const student = await register({
      email: 'student@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Student',
      role: Role.STUDENT,
    });
    studentUserId = student.user.id;

    await createStudentProfile({
      userId: studentUserId,
      educationLevel: 'high_school',
      preferredSubjects: ['mathematics'],
    });

    // Create tutor user
    const tutor = await register({
      email: 'tutor@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Tutor',
      role: Role.TUTOR,
    });
    tutorUserId = tutor.user.id;

    await createTutorProfile({
      userId: tutorUserId,
      hourlyRate: 50,
      subjects: ['mathematics', 'physics'],
      educationLevels: ['high_school', 'university'],
      languages: ['en', 'fr'],
      teachingMode: 'BOTH',
    });

    // Create a class
    const classData = await createClass(studentUserId, {
      name: 'Math Study Group',
      educationLevel: 'high_school',
      subject: 'mathematics',
      meetingType: 'ONLINE',
    });
    classId = classData.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('Session Creation', () => {
    it('should create a session with valid data', async () => {
      const now = new Date();
      const sessionData: CreateSessionData = {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000), // Tomorrow + 1 hour
        subject: 'mathematics',
        description: 'Algebra review session',
        price: 50,
        onlineMeetingLink: 'https://meet.example.com/session1',
      };

      const result = await createSession(studentUserId, sessionData);

      expect(result).toBeDefined();
      expect(result.classId).toBe(classId);
      expect(result.tutorId).toBe(tutorUserId);
      expect(result.subject).toBe('mathematics');
      expect(result.price.toString()).toBe('50');
      expect(result.status).toBe('PENDING');
      expect(result.onlineMeetingLink).toBe('https://meet.example.com/session1');
    });

    it('should reject session creation without required fields', async () => {
      const sessionData: any = {
        classId,
        tutorId: tutorUserId,
        // Missing scheduledStart, scheduledEnd, subject, price
      };

      await expect(createSession(studentUserId, sessionData)).rejects.toThrow(
        'Class ID, scheduled times, subject, and price are required'
      );
    });

    it('should reject session with end time before start time', async () => {
      const now = new Date();
      const sessionData: CreateSessionData = {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Before start
        subject: 'mathematics',
        price: 50,
      };

      await expect(createSession(studentUserId, sessionData)).rejects.toThrow(
        'Session end time must be after start time'
      );
    });

    it('should reject session without tutor or consortium', async () => {
      const now = new Date();
      const sessionData: CreateSessionData = {
        classId,
        // No tutorId or consortiumId
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      };

      await expect(createSession(studentUserId, sessionData)).rejects.toThrow(
        'Either tutor ID or consortium ID must be provided'
      );
    });

    it('should reject session with negative price', async () => {
      const now = new Date();
      const sessionData: CreateSessionData = {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: -10,
      };

      await expect(createSession(studentUserId, sessionData)).rejects.toThrow(
        'Price cannot be negative'
      );
    });

    it('should reject session for non-existent class', async () => {
      const now = new Date();
      const sessionData: CreateSessionData = {
        classId: '00000000-0000-0000-0000-000000000000',
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      };

      await expect(createSession(studentUserId, sessionData)).rejects.toThrow('Class not found');
    });
  });

  describe('Tutor Availability', () => {
    it('should return true when tutor has no conflicting sessions', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const endTime = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      const isAvailable = await checkTutorAvailability(tutorUserId, startTime, endTime);

      expect(isAvailable).toBe(true);
    });

    it('should return false when tutor has conflicting session', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const endTime = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      // Create first session
      await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: startTime,
        scheduledEnd: endTime,
        subject: 'mathematics',
        price: 50,
      });

      // Check availability for overlapping time
      const conflictStart = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);
      const conflictEnd = new Date(now.getTime() + 25.5 * 60 * 60 * 1000);

      const isAvailable = await checkTutorAvailability(tutorUserId, conflictStart, conflictEnd);

      expect(isAvailable).toBe(false);
    });

    it('should detect conflict when new session starts during existing session', async () => {
      const now = new Date();
      const existingStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const existingEnd = new Date(now.getTime() + 26 * 60 * 60 * 1000);

      // Create existing session
      await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: existingStart,
        scheduledEnd: existingEnd,
        subject: 'mathematics',
        price: 50,
      });

      // Try to book session that starts during existing session
      const newStart = new Date(now.getTime() + 25 * 60 * 60 * 1000);
      const newEnd = new Date(now.getTime() + 27 * 60 * 60 * 1000);

      const isAvailable = await checkTutorAvailability(tutorUserId, newStart, newEnd);

      expect(isAvailable).toBe(false);
    });

    it('should allow back-to-back sessions', async () => {
      const now = new Date();
      const firstStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const firstEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      // Create first session
      await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: firstStart,
        scheduledEnd: firstEnd,
        subject: 'mathematics',
        price: 50,
      });

      // Check availability for session starting exactly when first ends
      const secondStart = firstEnd;
      const secondEnd = new Date(now.getTime() + 26 * 60 * 60 * 1000);

      const isAvailable = await checkTutorAvailability(tutorUserId, secondStart, secondEnd);

      expect(isAvailable).toBe(true);
    });
  });

  describe('Session Confirmation', () => {
    it('should confirm a pending session', async () => {
      const now = new Date();
      const session = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      const confirmed = await confirmSession(session.id, tutorUserId);

      expect(confirmed.status).toBe('CONFIRMED');
    });

    it('should reject confirmation by non-assigned tutor', async () => {
      const now = new Date();
      const session = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      await expect(confirmSession(session.id, studentUserId)).rejects.toThrow(
        'Only the assigned tutor can confirm this session'
      );
    });

    it('should reject confirmation of non-pending session', async () => {
      const now = new Date();
      const session = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      // Confirm once
      await confirmSession(session.id, tutorUserId);

      // Try to confirm again
      await expect(confirmSession(session.id, tutorUserId)).rejects.toThrow(
        'Cannot confirm session with status: CONFIRMED'
      );
    });
  });

  describe('Session Status Management', () => {
    it('should update session status to cancelled', async () => {
      const now = new Date();
      const session = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      const result = await cancelSession(session.id, studentUserId, 'Student unavailable');

      expect(result.session.status).toBe('CANCELLED');
      expect(result.session.cancellationReason).toBe('Student unavailable');
    });

    it('should update session status to completed', async () => {
      const now = new Date();
      const session = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      // First confirm
      await confirmSession(session.id, tutorUserId);

      // Then complete
      const completed = await updateSessionStatus(session.id, 'COMPLETED', tutorUserId);

      expect(completed.status).toBe('COMPLETED');
    });

    it('should reject completing non-confirmed session', async () => {
      const now = new Date();
      const session = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      await expect(updateSessionStatus(session.id, 'COMPLETED', tutorUserId)).rejects.toThrow(
        'Can only complete confirmed sessions'
      );
    });
  });

  describe('Session Cancellation and Refunds', () => {
    it('should calculate full refund for cancellation more than 24 hours before', () => {
      const now = new Date();
      const scheduledStart = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now
      const cancellationTime = now;

      const { refundAmount, refundPercentage } = calculateRefundAmount(100, scheduledStart, cancellationTime);

      expect(refundPercentage).toBe(1.0);
      expect(refundAmount).toBe(100);
    });

    it('should calculate 50% refund for cancellation between 2-24 hours before', () => {
      const now = new Date();
      const scheduledStart = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours from now
      const cancellationTime = now;

      const { refundAmount, refundPercentage } = calculateRefundAmount(100, scheduledStart, cancellationTime);

      expect(refundPercentage).toBe(0.5);
      expect(refundAmount).toBe(50);
    });

    it('should calculate no refund for cancellation less than 2 hours before', () => {
      const now = new Date();
      const scheduledStart = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour from now
      const cancellationTime = now;

      const { refundAmount, refundPercentage } = calculateRefundAmount(100, scheduledStart, cancellationTime);

      expect(refundPercentage).toBe(0);
      expect(refundAmount).toBe(0);
    });

    it('should cancel session and return refund information', async () => {
      const now = new Date();
      const session = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48 hours from now
        scheduledEnd: new Date(now.getTime() + 49 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 100,
      });

      const result = await cancelSession(session.id, studentUserId, 'Change of plans');

      expect(result.session.status).toBe('CANCELLED');
      expect(result.session.cancellationReason).toBe('Change of plans');
      expect(result.refundPercentage).toBe(1.0);
      expect(result.refundAmount).toBe(100);
    });

    it('should reject cancelling already completed session', async () => {
      const now = new Date();
      const session = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      // Confirm and complete
      await confirmSession(session.id, tutorUserId);
      await updateSessionStatus(session.id, 'COMPLETED', tutorUserId);

      // Try to cancel
      await expect(cancelSession(session.id, studentUserId)).rejects.toThrow(
        'Cannot cancel a completed session'
      );
    });

    it('should reject cancelling already cancelled session', async () => {
      const now = new Date();
      const session = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      // Cancel once
      await cancelSession(session.id, studentUserId);

      // Try to cancel again
      await expect(cancelSession(session.id, studentUserId)).rejects.toThrow(
        'Session is already cancelled'
      );
    });
  });

  describe('Session Rescheduling', () => {
    it('should reschedule session to new time slot', async () => {
      const now = new Date();
      const session = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      const newStart = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const newEnd = new Date(now.getTime() + 49 * 60 * 60 * 1000);

      const rescheduled = await rescheduleSession(session.id, studentUserId, newStart, newEnd);

      expect(rescheduled.scheduledStart.getTime()).toBe(newStart.getTime());
      expect(rescheduled.scheduledEnd.getTime()).toBe(newEnd.getTime());
    });

    it('should reset status to PENDING when rescheduling confirmed session', async () => {
      const now = new Date();
      const session = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      // Confirm session
      await confirmSession(session.id, tutorUserId);

      // Reschedule
      const newStart = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const newEnd = new Date(now.getTime() + 49 * 60 * 60 * 1000);

      const rescheduled = await rescheduleSession(session.id, studentUserId, newStart, newEnd);

      expect(rescheduled.status).toBe('PENDING');
    });

    it('should reject rescheduling to conflicting time slot', async () => {
      const now = new Date();
      
      // Create first session
      await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 49 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      // Create second session
      const session2 = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      // Try to reschedule second session to overlap with first
      const conflictStart = new Date(now.getTime() + 48.5 * 60 * 60 * 1000);
      const conflictEnd = new Date(now.getTime() + 49.5 * 60 * 60 * 1000);

      await expect(
        rescheduleSession(session2.id, studentUserId, conflictStart, conflictEnd)
      ).rejects.toThrow('Tutor is not available during the new time slot');
    });

    it('should reject rescheduling completed session', async () => {
      const now = new Date();
      const session = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      // Confirm and complete
      await confirmSession(session.id, tutorUserId);
      await updateSessionStatus(session.id, 'COMPLETED', tutorUserId);

      // Try to reschedule
      const newStart = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const newEnd = new Date(now.getTime() + 49 * 60 * 60 * 1000);

      await expect(rescheduleSession(session.id, studentUserId, newStart, newEnd)).rejects.toThrow(
        'Cannot reschedule a completed session'
      );
    });

    it('should reject rescheduling cancelled session', async () => {
      const now = new Date();
      const session = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      // Cancel session
      await cancelSession(session.id, studentUserId);

      // Try to reschedule
      const newStart = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const newEnd = new Date(now.getTime() + 49 * 60 * 60 * 1000);

      await expect(rescheduleSession(session.id, studentUserId, newStart, newEnd)).rejects.toThrow(
        'Cannot reschedule a cancelled session'
      );
    });

    it('should reject rescheduling with invalid time range', async () => {
      const now = new Date();
      const session = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      // Try to reschedule with end before start
      const newStart = new Date(now.getTime() + 49 * 60 * 60 * 1000);
      const newEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      await expect(rescheduleSession(session.id, studentUserId, newStart, newEnd)).rejects.toThrow(
        'Session end time must be after start time'
      );
    });
  });

  describe('Session Updates', () => {
    it('should update session details', async () => {
      const now = new Date();
      const session = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      const updated = await updateSession(session.id, studentUserId, {
        description: 'Updated description',
        price: 60,
      });

      expect(updated.description).toBe('Updated description');
      expect(updated.price.toString()).toBe('60');
    });

    it('should reject updating completed session', async () => {
      const now = new Date();
      const session = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      // Confirm and complete
      await confirmSession(session.id, tutorUserId);
      await updateSessionStatus(session.id, 'COMPLETED', tutorUserId);

      // Try to update
      await expect(
        updateSession(session.id, studentUserId, { description: 'New description' })
      ).rejects.toThrow('Cannot update completed sessions');
    });

    it('should validate time changes for availability', async () => {
      const now = new Date();
      const session1 = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      const session2 = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 26 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 27 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      // Try to move session2 to overlap with session1
      await expect(
        updateSession(session2.id, studentUserId, {
          scheduledStart: new Date(now.getTime() + 24.5 * 60 * 60 * 1000),
        })
      ).rejects.toThrow('Tutor is not available during the new time slot');
    });
  });

  describe('Session Retrieval', () => {
    it('should get session by ID', async () => {
      const now = new Date();
      const session = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      const retrieved = await getSessionById(session.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(session.id);
      expect(retrieved.classId).toBe(classId);
    });

    it('should get user sessions as student', async () => {
      const now = new Date();
      await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      const sessions = await getUserSessions(studentUserId);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].classId).toBe(classId);
    });

    it('should get user sessions as tutor', async () => {
      const now = new Date();
      await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      const sessions = await getUserSessions(tutorUserId);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].tutorId).toBe(tutorUserId);
    });

    it('should filter sessions by status', async () => {
      const now = new Date();
      const session1 = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      const session2 = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 26 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 27 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      // Confirm one session
      await confirmSession(session1.id, tutorUserId);

      // Get only confirmed sessions
      const confirmedSessions = await getUserSessions(studentUserId, { status: 'CONFIRMED' });

      expect(confirmedSessions).toHaveLength(1);
      expect(confirmedSessions[0].id).toBe(session1.id);
    });

    it('should get class sessions', async () => {
      const now = new Date();
      await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 26 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 27 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      const sessions = await getClassSessions(classId);

      expect(sessions).toHaveLength(2);
      expect(sessions[0].classId).toBe(classId);
      expect(sessions[1].classId).toBe(classId);
    });
  });
});
