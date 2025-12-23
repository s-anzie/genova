import { Router, Request, Response, NextFunction } from 'express';
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
} from '../services/attendance.service';
import { authenticate } from '../middleware/auth.middleware';
import { ValidationError } from '@repo/utils';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/attendance/checkin
 * Check in a student to a session
 */
router.post('/checkin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { sessionId, method, code } = req.body;

    if (!sessionId || !method || !code) {
      throw new ValidationError('Session ID, check-in method, and code are required');
    }

    const checkInData: CheckInData = {
      sessionId,
      studentId: req.user.userId,
      method,
      code,
    };

    const result = await checkInStudent(checkInData);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Checked in successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/attendance/checkout
 * Check out tutor from a session
 */
router.post('/checkout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { sessionId } = req.body;

    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    const checkOutData: CheckOutData = {
      sessionId,
      tutorId: req.user.userId,
    };

    const result = await checkOutSession(checkOutData);

    res.status(200).json({
      success: true,
      data: result,
      message: result.flaggedForReview
        ? 'Checked out successfully. Session flagged for review due to duration discrepancy.'
        : 'Checked out successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/attendance/sessions/:sessionId/mark-absent
 * Mark absent students for a session (called after session ends)
 */
router.post('/sessions/:sessionId/mark-absent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    const result = await markAbsentStudents(sessionId as string);

    res.status(200).json({
      success: true,
      data: result,
      message: `Marked ${result.length} students as absent`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/attendance/sessions/:sessionId
 * Get attendance records for a session
 */
router.get('/sessions/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    const attendances = await getSessionAttendance(sessionId as string);

    res.status(200).json({
      success: true,
      data: attendances,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/attendance/dashboard
 * Get attendance dashboard for the authenticated student
 */
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { startDate, endDate, classId } = req.query;

    const filters: any = {};
    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }
    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }
    if (classId) {
      filters.classId = classId as string;
    }

    const dashboard = await getStudentAttendanceDashboard(req.user.userId, filters);

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/attendance/classes/:classId/statistics
 * Get attendance statistics for a class
 */
router.get('/classes/:classId/statistics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    const filters: any = {};
    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }
    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    const statistics = await getClassAttendanceStatistics(classId as string, filters);

    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/attendance/:attendanceId
 * Update attendance status (for manual corrections)
 */
router.put('/:attendanceId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { attendanceId } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      throw new ValidationError('Status is required');
    }

    const validStatuses = ['PRESENT', 'ABSENT', 'LATE'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const result = await updateAttendanceStatus(attendanceId as string, status, notes);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Attendance status updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/attendance/sessions/:sessionId/pin
 * Generate a PIN for session check-in
 */
router.get('/sessions/:sessionId/pin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { sessionId } = req.params;

    // TODO: Verify user is the tutor for this session
    // For now, generate PIN for any authenticated user

    const { pin, expiresIn } = generateSessionPIN(sessionId as string);

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        pin,
        expiresIn,
      },
      message: 'PIN generated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/attendance/sessions/:sessionId/qr
 * Generate a QR code for session check-in
 */
router.get('/sessions/:sessionId/qr', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { sessionId } = req.params;

    // TODO: Verify user is the tutor for this session
    // For now, generate QR code for any authenticated user

    const { qrCode, expiresIn } = generateSessionQRCode(sessionId as string);

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        qrCode,
        expiresIn,
      },
      message: 'QR code generated successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
