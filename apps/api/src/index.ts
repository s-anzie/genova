import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { envConfig, logger } from '@repo/utils';
import { initializeCronJobs, stopCronJobs } from './services/cron.service';
import { errorHandler } from './middleware/error-handler';

const app = express();
const PORT = envConfig.getNumber('PORT', 5001);

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: envConfig.getNumber('RATE_LIMIT_WINDOW_MS', 60000),
  max: envConfig.getNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  message: 'Too many requests from this IP, please try again later',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import profileRoutes from './routes/profile.routes';
import classRoutes from './routes/class.routes';
import classScheduleRoutes from './routes/class-schedule.routes';
import tutorRoutes from './routes/tutor.routes';
import tutorAvailabilityRoutes from './routes/tutor-availability.routes';
import timeSlotManagementRoutes from './routes/time-slot-management.routes';
import studentAssignmentRequestRoutes from './routes/student-assignment-request.routes';
import consortiumRoutes from './routes/consortium.routes';
import sessionRoutes from './routes/session.routes';
import paymentRoutes from './routes/payment.routes';
import paymentMethodRoutes from './routes/payment-methods.routes';
import operatorRoutes from './routes/operators.routes';
import attendanceRoutes from './routes/attendance.routes';
import progressRoutes from './routes/progress.routes';
import goalRoutes from './routes/goal.routes';
import badgeRoutes from './routes/badge.routes';
import subscriptionRoutes from './routes/subscription.routes';
import reviewRoutes from './routes/review.routes';
import schedulingRoutes from './routes/scheduling.routes';
import notificationRoutes from './routes/notification.routes';
import suggestionRoutes from './routes/suggestion.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import regionsRoutes from './routes/regions.routes';
import educationRoutes from './routes/education.routes';
import statsRoutes from './routes/stats.routes';

app.get('/api', (_req, res) => {
  res.json({ message: 'Genova API', version: '1.0.0' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/classes', classScheduleRoutes); // Schedule routes under /api/classes/:classId/schedule/*
app.use('/api/classes', timeSlotManagementRoutes); // Time slot management routes under /api/classes/:classId/time-slots/*
app.use('/api/tutors', tutorRoutes);
app.use('/api/tutors', tutorAvailabilityRoutes); // Tutor availability routes under /api/tutors/*
app.use('/api', studentAssignmentRequestRoutes); // Assignment request routes under /api/sessions/* and /api/assignment-requests/*
app.use('/api/consortiums', consortiumRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', suggestionRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/regions', regionsRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/stats', statsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${envConfig.get('NODE_ENV', 'development')}`);
  
  // Initialize cron jobs after server starts
  await initializeCronJobs();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await stopCronJobs();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await stopCronJobs();
  process.exit(0);
});

export default app;
