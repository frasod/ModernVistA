import { Request, Response, NextFunction } from 'express';
import { logger } from '../../config/logger';

/**
 * Error Handler Middleware for ModernVista
 * 
 * Centralized error handling following clean architecture principles.
 * Provides consistent error responses and proper logging.
 */

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

/**
 * Create a standardized API error
 */
export function createApiError(
  message: string, 
  statusCode: number = 500, 
  code?: string, 
  details?: any
): ApiError {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

/**
 * Express error handler middleware
 */
export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const code = error.code || 'UNKNOWN_ERROR';

  // Log the error
  logger.error('API Error', {
    error: {
      message,
      code,
      statusCode,
      stack: error.stack,
      details: error.details
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse = {
    error: {
      message,
      code,
      ...(isDevelopment && { 
        stack: error.stack,
        details: error.details 
      })
    },
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  };

  res.status(statusCode).json(errorResponse);
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  const error = createApiError(
    `Route ${req.method} ${req.url} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  
  res.status(404).json({
    error: {
      message: error.message,
      code: error.code
    },
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  });
}