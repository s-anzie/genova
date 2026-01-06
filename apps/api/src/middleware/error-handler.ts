import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError, logger, envConfig } from '@repo/utils';

/**
 * Transform Prisma errors into user-friendly messages
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case 'P2002': {
      // Unique constraint violation
      const target = error.meta?.target as string[] | undefined;
      const fields = target?.join(', ') || 'champs';
      return new AppError(
        `Un enregistrement avec ${fields} existe déjà`,
        'DUPLICATE_ENTRY',
        400
      );
    }
    case 'P2025': {
      // Record not found
      return new AppError(
        'Enregistrement non trouvé',
        'NOT_FOUND',
        404
      );
    }
    case 'P2003': {
      // Foreign key constraint violation
      return new AppError(
        'Impossible de supprimer cet enregistrement car il est référencé par d\'autres données',
        'FOREIGN_KEY_CONSTRAINT',
        400
      );
    }
    case 'P2014': {
      // Required relation violation
      return new AppError(
        'Une relation requise est manquante',
        'REQUIRED_RELATION_VIOLATION',
        400
      );
    }
    default: {
      return new AppError(
        'Une erreur de base de données est survenue',
        'DATABASE_ERROR',
        500
      );
    }
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.log(`🔴 [errorHandler] Error caught:`, {
    name: err.name,
    message: err.message,
    isAppError: err instanceof AppError,
    statusCode: err instanceof AppError ? err.statusCode : 'N/A',
  });

  // Handle AppError instances
  if (err instanceof AppError) {
    console.log(`📤 [errorHandler] Sending AppError response with status ${err.statusCode}`);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const appError = handlePrismaError(err);
    console.log(`📤 [errorHandler] Sending Prisma error response with status ${appError.statusCode}`);
    return res.status(appError.statusCode).json({
      success: false,
      message: appError.message,
      code: appError.code,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    console.log(`📤 [errorHandler] Sending Prisma validation error response`);
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
    });
  }

  // Log unhandled errors
  logger.error('Unhandled error', err);

  // Generic error response
  console.log(`📤 [errorHandler] Sending generic error response`);
  res.status(500).json({
    success: false,
    message: envConfig.isProduction() 
      ? 'Une erreur inattendue est survenue' 
      : err.message,
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
  });
}
