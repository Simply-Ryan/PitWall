import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export class ValidationError extends Error {
  status = 400;
  code = 'VALIDATION_ERROR';
}

export class NotFoundError extends Error {
  status = 404;
  code = 'NOT_FOUND';
}

export class ConflictError extends Error {
  status = 409;
  code = 'CONFLICT';
}

export class InternalServerError extends Error {
  status = 500;
  code = 'INTERNAL_SERVER_ERROR';
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = error.status || 500;
  const code = error.code || 'ERROR';
  const message = error.message || 'An unexpected error occurred';

  logger.error(`Error [${status}] ${code}: ${message}`, { error });

  res.status(status).json({
    error: code,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
