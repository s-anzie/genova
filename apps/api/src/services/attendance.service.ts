import { PrismaClient, Attendance, AttendanceStatus } from '@prisma/client';
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError,
  ConflictError 
} from '@repo/utils';
import crypto from 'crypto';
import { checkAssiduBadge } from './badge.service';
import { createNotification, createBulkNotifications } from './notification.service';
import { creditWallet } from './payment.service';

const prisma = new PrismaClient();

// In-memory store for check-in codes (in production, use Redis)
interface CheckInCode {
  sessionId: string;
  code: string;
  type: 'qr' | 'pin';
  createdAt: Date;
  expiresAt: Date;
}

const checkInCodes = new Map<string, CheckInCode>();

// Clean up expired codes every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [key, value] of checkInCodes.entries()) {
    if (value.expiresAt < now) {
      checkInCodes.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Types
export interface CheckInData {
  sessionId: string;
  studentId: string;
  method: 'qr' | 'pin';
  code?: string; // QR code or PIN
}

export interface CheckOutData {
  sessionId: string;
  tutorId: string;
}

export interface AttendanceWithStudent extends Attendance {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface AttendanceDashboard {
  totalSessions: number;
  attendedSessions: number;
  absentSessions: number;
  lateSessions: number;
  attendanceRate: number;
  recentAttendances: AttendanceWithStudent[];
}

/**
 * Generate a unique PIN for session check-in and store it
 */
export function generateSessionPIN(sessionId: string): { pin: string; expiresIn: number } {
  // Generate a 6-digit PIN
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
  
  // Store the PIN
  const key = `${sessionId}:pin`;
  checkInCodes.set(key, {
    sessionId,
    code: pin,
    type: 'pin',
    createdAt: now,
    expiresAt,
  });
  
  return {
    pin,
    expiresIn: 300, // 5 minutes in seconds
  };
}

/**
 * Generate a unique QR code for session check-in and store it
 */
export function generateSessionQRCode(sessionId: string): { qrCode: string; expiresIn: number } {
  // Generate a unique QR code using session ID and timestamp
  const timestamp = Date.now();
  const data = `${sessionId}:${timestamp}`;
  const qrCode = crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
  
  // Store the QR code
  const key = `${sessionId}:qr`;
  checkInCodes.set(key, {
    sessionId,
    code: qrCode,
    type: 'qr',
    createdAt: now,
    expiresAt,
  });
  
  return {
    qrCode,
    expiresIn: 300, // 5 minutes in seconds
  };
}

/**
 * Verify QR code or PIN for session check-in
 */
async function verifyCheckInCode(
  sessionId: string,
  code: string,
  method: 'qr' | 'pin'
): Promise<boolean> {
  const key = `${sessionId}:${method}`;
  const storedCode = checkInCodes.get(key);
  
  if (!storedCode) {
    return false;
  }
  
  // Check if code has expired
  const now = new Date();
  if (storedCode.expiresAt < now) {
    checkInCodes.delete(key);
    return false;
  }
  
  // Verify the code matches
  if (storedCode.code !== code) {
    return false;
  }
  
  // Code is valid - optionally delete it to prevent reuse
  // For now, we'll keep it valid for the 5-minute window
  // checkInCodes.delete(key);
  
  return true;
}

/**
 * Check in a student to a session
 * Validates: Requirements 8.1, 8.2
 */
export async function checkInStudent(data: CheckInData): Promise<AttendanceWithStudent> {
  const { sessionId, studentId, method, code } = data;

  // Validate required fields
  if (!sessionId || !studentId || !method) {
    throw new ValidationError('Session ID, student ID, and check-in method are required');
  }

  if (!code) {
    throw new ValidationError('QR code or PIN is required for check-in');
  }

  // Get session
  const session = await prisma.tutoringSession.findUnique({
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

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  // Verify session is confirmed
  if (session.status !== 'CONFIRMED') {
    throw new ValidationError('Can only check in to confirmed sessions');
  }

  // Verify student is a member of the class
  const isMember = session.class.members.some(m => m.studentId === studentId);
  if (!isMember) {
    throw new AuthorizationError('Student is not a member of this class');
  }

  // Verify check-in is within valid time window (from session start to session end)
  const now = new Date();
  if (now < session.scheduledStart) {
    throw new ValidationError('Cannot check in before session start time');
  }

  if (now > session.scheduledEnd) {
    throw new ValidationError('Cannot check in after session end time');
  }

  // Verify QR code or PIN
  const isValidCode = await verifyCheckInCode(sessionId, code, method);
  if (!isValidCode) {
    throw new ValidationError('Invalid QR code or PIN');
  }

  // Check if attendance record already exists
  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      sessionId_studentId: {
        sessionId,
        studentId,
      },
    },
  });

  let attendance: Attendance;

  if (existingAttendance) {
    // Update existing attendance record
    if (existingAttendance.checkInTime) {
      throw new ConflictError('Student has already checked in to this session');
    }

    attendance = await prisma.attendance.update({
      where: { id: existingAttendance.id },
      data: {
        status: 'PRESENT',
        checkInTime: now,
      },
    });
  } else {
    // Create new attendance record
    attendance = await prisma.attendance.create({
      data: {
        sessionId,
        studentId,
        status: 'PRESENT',
        checkInTime: now,
      },
    });
  }

  // Fetch attendance with student details
  const attendanceWithStudent = await prisma.attendance.findUnique({
    where: { id: attendance.id },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  // Check for Assidu badge eligibility (Requirement 11.1)
  checkAssiduBadge(studentId).catch((err: Error) => {
    console.error('Error checking Assidu badge:', err);
  });

  return attendanceWithStudent as AttendanceWithStudent;
}

/**
 * Check out tutor from a session and record actual duration
 * Validates: Requirements 8.4, 8.5
 */
export async function checkOutSession(data: CheckOutData): Promise<{
  session: any;
  actualDuration: number;
  scheduledDuration: number;
  discrepancy: number;
  flaggedForReview: boolean;
}> {
  const { sessionId, tutorId } = data;

  // Validate required fields
  if (!sessionId || !tutorId) {
    throw new ValidationError('Session ID and tutor ID are required');
  }

  // Get session
  const session = await prisma.tutoringSession.findUnique({
    where: { id: sessionId },
    include: {
      class: {
        include: {
          members: {
            where: { isActive: true },
          },
        },
      },
    },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  // Verify tutor is the assigned tutor
  if (session.tutorId !== tutorId) {
    throw new AuthorizationError('Only the assigned tutor can check out of this session');
  }

  // Verify session is confirmed
  if (session.status !== 'CONFIRMED') {
    throw new ValidationError('Can only check out of confirmed sessions');
  }

  // Verify session has started
  const now = new Date();
  if (now < session.scheduledStart) {
    throw new ValidationError('Cannot check out before session start time');
  }

  // Mark absent students who didn't check in
  await markAbsentStudents(sessionId);

  // Record actual end time and mark as completed
  const updatedSession = await prisma.tutoringSession.update({
    where: { id: sessionId },
    data: {
      actualStart: session.actualStart || session.scheduledStart,
      actualEnd: now,
      status: 'COMPLETED',
    },
  });

  // Calculate durations in minutes
  const actualStart = updatedSession.actualStart || updatedSession.scheduledStart;
  const actualDuration = Math.round((now.getTime() - actualStart.getTime()) / (1000 * 60));
  const scheduledDuration = Math.round(
    (session.scheduledEnd.getTime() - session.scheduledStart.getTime()) / (1000 * 60)
  );
  const discrepancy = Math.abs(actualDuration - scheduledDuration);

  // Flag for review if discrepancy is more than 15 minutes (Requirement 8.5)
  const flaggedForReview = discrepancy > 15;

  if (flaggedForReview) {
    // Add a note to the session
    await prisma.tutoringSession.update({
      where: { id: sessionId },
      data: {
        description: session.description
          ? `${session.description}\n\n[FLAGGED] Duration discrepancy: ${discrepancy} minutes`
          : `[FLAGGED] Duration discrepancy: ${discrepancy} minutes`,
      },
    });
  }

  // Process payments based on attendance
  await processSessionPayments(sessionId);

  return {
    session: updatedSession,
    actualDuration,
    scheduledDuration,
    discrepancy,
    flaggedForReview,
  };
}

/**
 * Mark absent students who didn't check in
 * Validates: Requirements 8.3
 * This should be called automatically after session end time
 */
export async function markAbsentStudents(sessionId: string): Promise<Attendance[]> {
  // Get session
  const session = await prisma.tutoringSession.findUnique({
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
      attendances: true,
    },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  // Verify session has ended
  const now = new Date();
  if (now < session.scheduledEnd) {
    throw new ValidationError('Cannot mark absences before session end time');
  }

  // Get all class members
  const classMembers = session.class.members.map(m => m.studentId);

  // Get students who already have attendance records
  const existingAttendances = session.attendances;
  const studentsWithAttendance = existingAttendances.map(a => a.studentId);

  // Find students without attendance records
  const absentStudents = classMembers.filter(
    studentId => !studentsWithAttendance.includes(studentId)
  );

  // Create absence records for students who didn't check in
  const absenceRecords = await Promise.all(
    absentStudents.map(studentId =>
      prisma.attendance.create({
        data: {
          sessionId,
          studentId,
          status: 'ABSENT',
          notes: 'Automatically marked absent - no check-in recorded',
        },
      })
    )
  );

  return absenceRecords;
}

/**
 * Get attendance records for a session
 */
export async function getSessionAttendance(sessionId: string): Promise<AttendanceWithStudent[]> {
  const attendances = await prisma.attendance.findMany({
    where: { sessionId },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      checkInTime: 'asc',
    },
  });

  return attendances as AttendanceWithStudent[];
}

/**
 * Get attendance dashboard for a student
 * Validates: Requirements 8.1
 */
export async function getStudentAttendanceDashboard(
  studentId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    classId?: string;
  }
): Promise<AttendanceDashboard> {
  // Build where conditions
  const whereConditions: any = {
    studentId,
  };

  if (filters?.classId) {
    whereConditions.session = {
      classId: filters.classId,
    };
  }

  if (filters?.startDate || filters?.endDate) {
    whereConditions.session = {
      ...whereConditions.session,
      scheduledStart: {},
    };
    if (filters.startDate) {
      whereConditions.session.scheduledStart.gte = filters.startDate;
    }
    if (filters.endDate) {
      whereConditions.session.scheduledStart.lte = filters.endDate;
    }
  }

  // Get all attendance records
  const attendances = await prisma.attendance.findMany({
    where: whereConditions,
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      },
      session: {
        select: {
          id: true,
          scheduledStart: true,
          subject: true,
        },
      },
    },
    orderBy: {
      checkInTime: 'desc',
    },
  });

  // Calculate statistics
  const totalSessions = attendances.length;
  const attendedSessions = attendances.filter(a => a.status === 'PRESENT').length;
  const absentSessions = attendances.filter(a => a.status === 'ABSENT').length;
  const lateSessions = attendances.filter(a => a.status === 'LATE').length;
  const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

  return {
    totalSessions,
    attendedSessions,
    absentSessions,
    lateSessions,
    attendanceRate: Math.round(attendanceRate * 100) / 100,
    recentAttendances: attendances.slice(0, 10) as AttendanceWithStudent[],
  };
}

/**
 * Get attendance statistics for a class
 */
export async function getClassAttendanceStatistics(
  classId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{
  totalSessions: number;
  averageAttendanceRate: number;
  studentStatistics: Array<{
    studentId: string;
    studentName: string;
    attendedSessions: number;
    totalSessions: number;
    attendanceRate: number;
  }>;
}> {
  // Build where conditions for sessions
  const sessionWhereConditions: any = {
    classId,
    status: { in: ['CONFIRMED', 'COMPLETED'] },
  };

  if (filters?.startDate || filters?.endDate) {
    sessionWhereConditions.scheduledStart = {};
    if (filters.startDate) {
      sessionWhereConditions.scheduledStart.gte = filters.startDate;
    }
    if (filters.endDate) {
      sessionWhereConditions.scheduledStart.lte = filters.endDate;
    }
  }

  // Get all sessions for the class
  const sessions = await prisma.tutoringSession.findMany({
    where: sessionWhereConditions,
    include: {
      attendances: {
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  const totalSessions = sessions.length;

  if (totalSessions === 0) {
    return {
      totalSessions: 0,
      averageAttendanceRate: 0,
      studentStatistics: [],
    };
  }

  // Calculate per-student statistics
  const studentMap = new Map<string, {
    studentId: string;
    studentName: string;
    attendedSessions: number;
    totalSessions: number;
  }>();

  sessions.forEach(session => {
    session.attendances.forEach(attendance => {
      const studentId = attendance.studentId;
      const studentName = `${attendance.student.firstName} ${attendance.student.lastName}`;

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          studentId,
          studentName,
          attendedSessions: 0,
          totalSessions: 0,
        });
      }

      const stats = studentMap.get(studentId)!;
      stats.totalSessions++;
      if (attendance.status === 'PRESENT') {
        stats.attendedSessions++;
      }
    });
  });

  // Calculate attendance rates
  const studentStatistics = Array.from(studentMap.values()).map(stats => ({
    ...stats,
    attendanceRate: (stats.attendedSessions / stats.totalSessions) * 100,
  }));

  // Calculate average attendance rate
  const totalAttendanceRate = studentStatistics.reduce(
    (sum, stats) => sum + stats.attendanceRate,
    0
  );
  const averageAttendanceRate = studentStatistics.length > 0
    ? totalAttendanceRate / studentStatistics.length
    : 0;

  return {
    totalSessions,
    averageAttendanceRate: Math.round(averageAttendanceRate * 100) / 100,
    studentStatistics: studentStatistics.sort((a, b) => b.attendanceRate - a.attendanceRate),
  };
}

/**
 * Update attendance status manually (for corrections)
 */
export async function updateAttendanceStatus(
  attendanceId: string,
  status: AttendanceStatus,
  notes?: string
): Promise<Attendance> {
  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
  });

  if (!attendance) {
    throw new NotFoundError('Attendance record not found');
  }

  const updatedAttendance = await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      status,
      notes: notes || attendance.notes,
    },
  });

  return updatedAttendance;
}

/**
 * Process payments based on attendance after session completion
 * - Present students: payment goes to tutor (100%)
 * - Absent students: refund 85%, keep 15% as platform fee
 */
export async function processSessionPayments(sessionId: string): Promise<void> {
  try {
    const session = await prisma.tutoringSession.findUnique({
      where: { id: sessionId },
      include: {
        tutor: true,
        consortium: {
          include: {
            members: true,
          },
        },
        class: {
          include: {
            members: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return;
    }

    // Get all attendance records
    const attendances = await prisma.attendance.findMany({
      where: { sessionId: session.id },
      include: {
        student: true,
      },
    });

    const notifications = [];

    for (const attendance of attendances) {
      // Find the transaction for this student
      const transaction = await prisma.transaction.findFirst({
        where: {
          sessionId: session.id,
          payerId: attendance.studentId,
          status: 'PENDING',
        },
      });

      if (!transaction) {
        continue;
      }

      if (attendance.status === 'PRESENT') {
        // Student was present - complete payment to tutor or consortium
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
          },
        });

        const netAmount = transaction.netAmount.toNumber();

        // Distribute funds based on session type
        if (session.consortiumId && session.consortium) {
          // Distribute to consortium members
          for (const member of session.consortium.members) {
            const memberAmount = (netAmount * member.revenueShare.toNumber()) / 100;
            await creditWallet(member.tutorId, memberAmount);
            
            // Notify each consortium member
            notifications.push({
              userId: member.tutorId,
              title: 'Paiement reçu',
              message: `Vous avez reçu ${(memberAmount * 655.957).toFixed(0)} FCFA pour votre session de ${session.subject}.`,
              type: 'PAYMENT_RECEIVED',
              data: {
                transactionId: transaction.id,
                sessionId: session.id,
                amount: memberAmount,
              },
            });
          }
        } else if (session.tutorId) {
          // Credit single tutor wallet
          await creditWallet(session.tutorId, netAmount);

          // Notify tutor
          notifications.push({
            userId: session.tutorId,
            title: 'Paiement reçu',
            message: `Vous avez reçu ${(netAmount * 655.957).toFixed(0)} FCFA pour votre session de ${session.subject}.`,
            type: 'PAYMENT_RECEIVED',
            data: {
              transactionId: transaction.id,
              sessionId: session.id,
              amount: netAmount,
            },
          });
        }
      } else {
        // Student was absent - refund with policy (85% refund, 15% fee)
        const amount = transaction.amount.toNumber();
        const refundAmount = amount * 0.85;

        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'REFUNDED',
          },
        });

        // Refund to student's wallet using payment service
        await creditWallet(attendance.studentId, refundAmount);

        // Notify student
        notifications.push({
          userId: attendance.studentId,
          title: 'Remboursement effectué',
          message: `Vous avez été remboursé de ${(refundAmount * 655.957).toFixed(0)} FCFA car vous étiez absent à la session.`,
          type: 'PAYMENT_REFUNDED',
          data: {
            transactionId: transaction.id,
            sessionId: session.id,
            amount: refundAmount,
            reason: 'ABSENT',
          },
        });
      }
    }

    // Send all notifications
    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (error) {
    console.error('Failed to process session payments:', error);
    throw error;
  }
}

/**
 * Send notification to tutor when session starts
 */
export async function notifyTutorSessionStarted(sessionId: string): Promise<void> {
  try {
    const session = await prisma.tutoringSession.findUnique({
      where: { id: sessionId },
      include: {
        tutor: true,
      },
    });

    if (!session || !session.tutorId) {
      return;
    }

    await createNotification({
      userId: session.tutorId,
      title: 'Session commencée',
      message: `Votre session de ${session.subject} a commencé. Générez le code de présence pour vos étudiants.`,
      type: 'SESSION_STARTED',
      data: {
        sessionId: session.id,
        action: 'MANAGE_ATTENDANCE',
      },
    });
  } catch (error) {
    console.error('Failed to notify tutor:', error);
  }
}

/**
 * Send notification to students to check in
 * Called 5 minutes after session starts
 */
export async function notifyStudentsCheckIn(sessionId: string): Promise<void> {
  try {
    const session = await prisma.tutoringSession.findUnique({
      where: { id: sessionId },
      include: {
        class: {
          include: {
            members: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    if (!session || !session.class) {
      return;
    }

    // Get students who haven't checked in yet
    const attendance = await prisma.attendance.findMany({
      where: {
        sessionId: session.id,
        status: { not: 'PRESENT' },
      },
    });

    const notifications = attendance.map(att => ({
      userId: att.studentId,
      title: 'Confirmez votre présence',
      message: `Votre session de ${session.subject} a commencé ! Confirmez votre présence maintenant.`,
      type: 'CHECK_IN_REMINDER',
      data: {
        sessionId: session.id,
        action: 'CHECK_IN',
      },
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (error) {
    console.error('Failed to notify students:', error);
  }
}
