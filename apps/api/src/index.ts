import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { envConfig, logger, AppError } from '@repo/utils';

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
import profileRoutes from './routes/profile.routes';
import classRoutes from './routes/class.routes';
import classScheduleRoutes from './routes/class-schedule.routes';
import tutorRoutes from './routes/tutor.routes';
import consortiumRoutes from './routes/consortium.routes';
import sessionRoutes from './routes/session.routes';
import paymentRoutes from './routes/payment.routes';
import attendanceRoutes from './routes/attendance.routes';
import progressRoutes from './routes/progress.routes';
import badgeRoutes from './routes/badge.routes';
import subscriptionRoutes from './routes/subscription.routes';
import reviewRoutes from './routes/review.routes';
import schedulingRoutes from './routes/scheduling.routes';
import notificationRoutes from './routes/notification.routes';
import suggestionRoutes from './routes/suggestion.routes';

app.get('/api', (_req, res) => {
  res.json({ message: 'Genova API', version: '1.0.0' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/classes', classScheduleRoutes); // Schedule routes under /api/classes/:classId/schedule/*
app.use('/api/tutors', tutorRoutes);
app.use('/api/consortiums', consortiumRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', suggestionRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      timestamp: new Date().toISOString(),
    },
  });
});

// Error handler
app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json(err.toJSON());
    }

    logger.error('Unhandled error', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: envConfig.isProduction() ? 'An unexpected error occurred' : err.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${envConfig.get('NODE_ENV', 'development')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
