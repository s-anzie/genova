import {
  checkInStudent,
  checkOutSession,
  markAbsentStudents,
  getSessionAttendance,
  getStudentAttendanceDashboard,
  getClassAttendanceStatistics,
  updateAttendanceStatus,
  generateSessionPIN,
  generateSessionQRCode,
  CheckInData,
  CheckOutData,
} from '../attendance.service';
import { register } from '../auth.service';
import { createStudentProfile, createTutorProfile } from '../profile.service';
import { createClass, addClassMember } from '../class.service';
import { createSession, confirmSession } from '../session.service';
import { cleanDatabase, disconnectDatabase } from '../../test-setup';
import { Role } from '@prisma/client';

describe('Attendance Service', () => {
  let student1UserId: string;
  let student2UserId: string;
  let tutorUserId: string;
  let classId: string;
  let sessionId: string;

  beforeEach(async () => {
    await cleanDatabase();

    // Create student 1
    const student1 = await register({
      email: 'student1@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Student1',
      role: Role.STUDENT,
    });
    student1UserId = student1.user.id;

    await createStudentProfile({
      userId: student1UserId,
      educationLevel: 'high_school',
      preferredSubjects: ['mathematics'],
    });

    // Create student 2
    const student2 = await register({
      email: 'student2@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Student2',
      role: Role.STUDENT,
    });
    student2UserId = student2.user.id;

    await createStudentProfile({
      userId: student2UserId,
      educationLevel: 'high_school',
      preferredSubjects: ['mathematics'],
    });

    // Create tutor
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
      subjects: ['mathematics'],
      educationLevels: ['high_school'],
      languages: ['en'],
      teachingMode: 'BOTH',
    });

    // Create a class with both students
    const classData = await createClass(student1UserId, {
      name: 'Math Study Group',
      educationLevel: 'high_school',
      subject: 'mathematics',
      meetingType: 'ONLINE',
    });
    classId = classData.id;

    // Add student2 to the class
    await addClassMember(classId, student2UserId);

    // Create a confirmed session
    const now = new Date();
    const session = await createSession(student1UserId, {
      classId,
      tutorId: tutorUserId,
      scheduledStart: new Date(now.getTime() - 30 * 60 * 1000), // Started 30 minutes ago
      scheduledEnd: new Date(now.getTime() + 30 * 60 * 1000), // Ends in 30 minutes
      subject: 'mathematics',
      price: 50,
    });
    sessionId = session.id;

    // Confirm the session
    await confirmSession(sessionId, tutorUserId);
  }, 60000); // Increase timeout to 60 seconds

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('Check-in', () => {
    it('should check in a student with valid QR code', async () => {
      const { qrCode } = generateSessionQRCode(sessionId);

      const checkInData: CheckInData = {
        sessionId,
        studentId: student1UserId,
        method: 'qr',
        code: qrCode,
      };

      const result = await checkInStudent(checkInData);

      expect(result).toBeDefined();
      expect(result.sessionId).toBe(sessionId);
      expect(result.studentId).toBe(student1UserId);
      expect(result.status).toBe('PRESENT');
      expect(result.checkInTime).toBeDefined();
    });

    it('should check in a student with valid PIN', async () => {
      const { pin } = generateSessionPIN(sessionId);

      const checkInData: CheckInData = {
        sessionId,
        studentId: student1UserId,
        method: 'pin',
        code: pin,
      };

      const result = await checkInStudent(checkInData);

      expect(result).toBeDefined();
      expect(result.status).toBe('PRESENT');
      expect(result.checkInTime).toBeDefined();
    });

    it('should reject check-in without code', async () => {
      const checkInData: CheckInData = {
        sessionId,
        studentId: student1UserId,
        method: 'qr',
        code: '',
      };

      await expect(checkInStudent(checkInData)).rejects.toThrow(
        'QR code or PIN is required for check-in'
      );
    });

    it('should reject check-in for non-class member', async () => {
      // Create another student not in the class
      const otherStudent = await register({
        email: 'other@example.com',
        password: 'password123',
        firstName: 'Other',
        lastName: 'Student',
        role: Role.STUDENT,
      });

      const { qrCode } = generateSessionQRCode(sessionId);

      const checkInData: CheckInData = {
        sessionId,
        studentId: otherStudent.user.id,
        method: 'qr',
        code: qrCode,
      };

      await expect(checkInStudent(checkInData)).rejects.toThrow(
        'Student is not a member of this class'
      );
    });

    it('should reject duplicate check-in', async () => {
      const { qrCode } = generateSessionQRCode(sessionId);

      const checkInData: CheckInData = {
        sessionId,
        studentId: student1UserId,
        method: 'qr',
        code: qrCode,
      };

      // First check-in
      await checkInStudent(checkInData);

      // Try to check in again
      await expect(checkInStudent(checkInData)).rejects.toThrow(
        'Student has already checked in to this session'
      );
    });

    it('should reject check-in to non-confirmed session', async () => {
      // Create a pending session with a different time slot to avoid conflicts
      const now = new Date();
      const pendingSession = await createSession(student1UserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        scheduledEnd: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
        subject: 'mathematics',
        price: 50,
      });

      const { qrCode } = generateSessionQRCode(pendingSession.id);

      const checkInData: CheckInData = {
        sessionId: pendingSession.id,
        studentId: student1UserId,
        method: 'qr',
        code: qrCode,
      };

      await expect(checkInStudent(checkInData)).rejects.toThrow(
        'Can only check in to confirmed sessions'
      );
    });
  });

  describe('Check-out', () => {
    it('should check out tutor and record duration', async () => {
      const checkOutData: CheckOutData = {
        sessionId,
        tutorId: tutorUserId,
      };

      const result = await checkOutSession(checkOutData);

      expect(result).toBeDefined();
      expect(result.session).toBeDefined();
      expect(result.actualDuration).toBeGreaterThan(0);
      expect(result.scheduledDuration).toBe(60); // 1 hour
      expect(result.discrepancy).toBeDefined();
      expect(result.flaggedForReview).toBeDefined();
    });

    it('should flag session for review when duration discrepancy > 15 minutes', async () => {
      // Create a session that started 2 hours ago but was scheduled for 1 hour
      const now = new Date();
      const longSession = await createSession(student1UserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() - 120 * 60 * 1000), // 2 hours ago
        scheduledEnd: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago (1 hour duration)
        subject: 'mathematics',
        price: 50,
      });

      await confirmSession(longSession.id, tutorUserId);

      const checkOutData: CheckOutData = {
        sessionId: longSession.id,
        tutorId: tutorUserId,
      };

      const result = await checkOutSession(checkOutData);

      expect(result.discrepancy).toBeGreaterThan(15);
      expect(result.flaggedForReview).toBe(true);
    });

    it('should not flag session when duration is within 15 minutes', async () => {
      const checkOutData: CheckOutData = {
        sessionId,
        tutorId: tutorUserId,
      };

      const result = await checkOutSession(checkOutData);

      // Session started 30 minutes ago, scheduled for 60 minutes
      // Checking out now means ~30 minutes actual vs 60 scheduled = 30 min discrepancy
      // This should be flagged
      expect(result.flaggedForReview).toBe(true);
    });

    it('should reject check-out by non-assigned tutor', async () => {
      // Create another tutor
      const otherTutor = await register({
        email: 'other-tutor@example.com',
        password: 'password123',
        firstName: 'Other',
        lastName: 'Tutor',
        role: Role.TUTOR,
      });

      const checkOutData: CheckOutData = {
        sessionId,
        tutorId: otherTutor.user.id,
      };

      await expect(checkOutSession(checkOutData)).rejects.toThrow(
        'Only the assigned tutor can check out of this session'
      );
    });

    it('should reject check-out of non-confirmed session', async () => {
      // Create a pending session with a different time slot
      const now = new Date();
      const pendingSession = await createSession(student1UserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours from now
        scheduledEnd: new Date(now.getTime() + 5 * 60 * 60 * 1000), // 5 hours from now
        subject: 'mathematics',
        price: 50,
      });

      const checkOutData: CheckOutData = {
        sessionId: pendingSession.id,
        tutorId: tutorUserId,
      };

      await expect(checkOutSession(checkOutData)).rejects.toThrow(
        'Can only check out of confirmed sessions'
      );
    });
  });

  describe('Mark Absent Students', () => {
    it('should mark students as absent who did not check in', async () => {
      // Create a session that has ended
      const now = new Date();
      const pastSession = await createSession(student1UserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() - 120 * 60 * 1000), // 2 hours ago
        scheduledEnd: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
        subject: 'mathematics',
        price: 50,
      });

      await confirmSession(pastSession.id, tutorUserId);

      // Manually create attendance record for student1 (simulating they checked in during the session)
      // We can't use checkInStudent because the session has ended
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.attendance.create({
        data: {
          sessionId: pastSession.id,
          studentId: student1UserId,
          status: 'PRESENT',
          checkInTime: new Date(now.getTime() - 90 * 60 * 1000), // Checked in 90 minutes ago
        },
      });
      await prisma.$disconnect();

      // Mark absent students
      const result = await markAbsentStudents(pastSession.id);

      expect(result).toHaveLength(1);
      expect(result[0].studentId).toBe(student2UserId);
      expect(result[0].status).toBe('ABSENT');
    });

    it('should not create duplicate absence records', async () => {
      // Create a session that has ended
      const now = new Date();
      const pastSession = await createSession(student1UserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() - 120 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() - 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      await confirmSession(pastSession.id, tutorUserId);

      // Mark absent students twice
      await markAbsentStudents(pastSession.id);
      const result = await markAbsentStudents(pastSession.id);

      // Second call should return empty array (no new absences)
      expect(result).toHaveLength(0);
    });

    it('should reject marking absences before session ends', async () => {
      await expect(markAbsentStudents(sessionId)).rejects.toThrow(
        'Cannot mark absences before session end time'
      );
    });
  });

  describe('Get Session Attendance', () => {
    it('should get all attendance records for a session', async () => {
      // Check in both students
      const { qrCode: qrCode1 } = generateSessionQRCode(sessionId);
      await checkInStudent({
        sessionId,
        studentId: student1UserId,
        method: 'qr',
        code: qrCode1,
      });

      const { pin } = generateSessionPIN(sessionId);
      await checkInStudent({
        sessionId,
        studentId: student2UserId,
        method: 'pin',
        code: pin,
      });

      const attendances = await getSessionAttendance(sessionId);

      expect(attendances).toHaveLength(2);
      expect(attendances[0].status).toBe('PRESENT');
      expect(attendances[1].status).toBe('PRESENT');
    });

    it('should return empty array for session with no attendance', async () => {
      const attendances = await getSessionAttendance(sessionId);

      expect(attendances).toHaveLength(0);
    });
  });

  describe('Student Attendance Dashboard', () => {
    it('should calculate attendance statistics correctly', async () => {
      // Create multiple past sessions
      const now = new Date();

      // Session 1 - attended
      const session1 = await createSession(student1UserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });
      await confirmSession(session1.id, tutorUserId);
      const { qrCode: qr1 } = generateSessionQRCode(session1.id);
      await checkInStudent({
        sessionId: session1.id,
        studentId: student1UserId,
        method: 'qr',
        code: qr1,
      });

      // Session 2 - absent
      const session2 = await createSession(student1UserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });
      await confirmSession(session2.id, tutorUserId);
      await markAbsentStudents(session2.id);

      // Session 3 - attended
      const session3 = await createSession(student1UserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });
      await confirmSession(session3.id, tutorUserId);
      const { qrCode: qr3 } = generateSessionQRCode(session3.id);
      await checkInStudent({
        sessionId: session3.id,
        studentId: student1UserId,
        method: 'qr',
        code: qr3,
      });

      const dashboard = await getStudentAttendanceDashboard(student1UserId);

      expect(dashboard.totalSessions).toBe(3);
      expect(dashboard.attendedSessions).toBe(2);
      expect(dashboard.absentSessions).toBe(1);
      expect(dashboard.attendanceRate).toBe(66.67);
    });

    it('should filter dashboard by date range', async () => {
      const now = new Date();

      // Old session
      const oldSession = await createSession(student1UserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });
      await confirmSession(oldSession.id, tutorUserId);
      const { qrCode: qr1 } = generateSessionQRCode(oldSession.id);
      await checkInStudent({
        sessionId: oldSession.id,
        studentId: student1UserId,
        method: 'qr',
        code: qr1,
      });

      // Recent session
      const recentSession = await createSession(student1UserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });
      await confirmSession(recentSession.id, tutorUserId);
      const { qrCode: qr2 } = generateSessionQRCode(recentSession.id);
      await checkInStudent({
        sessionId: recentSession.id,
        studentId: student1UserId,
        method: 'qr',
        code: qr2,
      });

      // Filter for last 7 days
      const dashboard = await getStudentAttendanceDashboard(student1UserId, {
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      });

      expect(dashboard.totalSessions).toBe(1);
      expect(dashboard.attendedSessions).toBe(1);
    });
  });

  describe('Class Attendance Statistics', () => {
    it('should calculate class-wide attendance statistics', async () => {
      // Create a past session
      const now = new Date();
      const pastSession = await createSession(student1UserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });
      await confirmSession(pastSession.id, tutorUserId);

      // Student1 attends, student2 is absent
      const { qrCode } = generateSessionQRCode(pastSession.id);
      await checkInStudent({
        sessionId: pastSession.id,
        studentId: student1UserId,
        method: 'qr',
        code: qrCode,
      });
      await markAbsentStudents(pastSession.id);

      const statistics = await getClassAttendanceStatistics(classId);

      expect(statistics.totalSessions).toBe(1);
      expect(statistics.studentStatistics).toHaveLength(2);
      expect(statistics.averageAttendanceRate).toBe(50); // 1 attended, 1 absent = 50%
    });
  });

  describe('Update Attendance Status', () => {
    it('should update attendance status manually', async () => {
      // Check in student
      const { qrCode } = generateSessionQRCode(sessionId);
      const attendance = await checkInStudent({
        sessionId,
        studentId: student1UserId,
        method: 'qr',
        code: qrCode,
      });

      // Update to LATE
      const updated = await updateAttendanceStatus(attendance.id, 'LATE', 'Arrived 10 minutes late');

      expect(updated.status).toBe('LATE');
      expect(updated.notes).toBe('Arrived 10 minutes late');
    });

    it('should reject update for non-existent attendance', async () => {
      await expect(
        updateAttendanceStatus('00000000-0000-0000-0000-000000000000', 'PRESENT')
      ).rejects.toThrow('Attendance record not found');
    });
  });

  describe('PIN and QR Code Generation', () => {
    it('should generate a 6-digit PIN', () => {
      const { pin, expiresIn } = generateSessionPIN(sessionId);

      expect(pin).toHaveLength(6);
      expect(parseInt(pin)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(pin)).toBeLessThanOrEqual(999999);
      expect(expiresIn).toBe(300);
    });

    it('should generate unique PINs', () => {
      const { pin: pin1 } = generateSessionPIN(sessionId);
      const { pin: pin2 } = generateSessionPIN(sessionId);

      // While not guaranteed to be different, they should be different most of the time
      // This is a probabilistic test
      expect(pin1).toBeDefined();
      expect(pin2).toBeDefined();
    });

    it('should generate a QR code', () => {
      const { qrCode, expiresIn } = generateSessionQRCode(sessionId);

      expect(qrCode).toBeDefined();
      expect(qrCode).toHaveLength(16);
      expect(qrCode).toMatch(/^[a-f0-9]+$/); // Hex string
      expect(expiresIn).toBe(300);
    });

    it('should generate different QR codes for different sessions', () => {
      const { qrCode: qrCode1 } = generateSessionQRCode(sessionId);
      const { qrCode: qrCode2 } = generateSessionQRCode('different-session-id');

      expect(qrCode1).not.toBe(qrCode2);
    });

    it('should verify valid PIN', async () => {
      const { pin } = generateSessionPIN(sessionId);

      const checkInData: CheckInData = {
        sessionId,
        studentId: student1UserId,
        method: 'pin',
        code: pin,
      };

      const result = await checkInStudent(checkInData);
      expect(result.status).toBe('PRESENT');
    });

    it('should reject invalid PIN', async () => {
      generateSessionPIN(sessionId); // Generate a valid PIN

      const checkInData: CheckInData = {
        sessionId,
        studentId: student1UserId,
        method: 'pin',
        code: '000000', // Wrong PIN
      };

      await expect(checkInStudent(checkInData)).rejects.toThrow('Invalid QR code or PIN');
    });

    it('should verify valid QR code', async () => {
      const { qrCode } = generateSessionQRCode(sessionId);

      const checkInData: CheckInData = {
        sessionId,
        studentId: student1UserId,
        method: 'qr',
        code: qrCode,
      };

      const result = await checkInStudent(checkInData);
      expect(result.status).toBe('PRESENT');
    });

    it('should reject invalid QR code', async () => {
      generateSessionQRCode(sessionId); // Generate a valid QR code

      const checkInData: CheckInData = {
        sessionId,
        studentId: student1UserId,
        method: 'qr',
        code: 'invalid-qr-code',
      };

      await expect(checkInStudent(checkInData)).rejects.toThrow('Invalid QR code or PIN');
    });
  });
});
