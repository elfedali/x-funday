import { Request, Response, NextFunction } from 'express';
import { AppError, createErrorResponse } from '@/utils/helpers.js';
import { logger } from '@/config/logger.js';
import { config } from '@/config/env.js';

export const errorHandler = (
  error: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: string[] | undefined;

  // Handle AppError
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    if (error.errors) {
      errors = error.errors.map(e => e.message);
    }
  }

  // Handle specific error types
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload error';
  }

  // Log error
  if (statusCode >= 500) {
    logger.error('Server Error:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  } else {
    logger.warn('Client Error:', {
      error: error.message,
      statusCode,
      url: req.url,
      method: req.method,
      ip: req.ip,
    });
  }

  // Send error response
  const response = createErrorResponse(message, errors);

  // Include stack trace in development
  if (config.NODE_ENV === 'development') {
    (response as any).stack = error.stack;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('Route not found', {
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).json(createErrorResponse('Route not found'));
};
