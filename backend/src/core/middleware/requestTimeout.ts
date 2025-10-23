import { Request, Response, NextFunction } from 'express';
import { logger } from '../../config/logger';

/**
 * Request Timeout Middleware for ModernVista
 * 
 * Prevents requests from hanging indefinitely by setting timeouts
 * and providing graceful error responses.
 */

export interface TimeoutOptions {
  timeout?: number;        // Timeout in milliseconds (default: 30000)
  message?: string;       // Custom timeout message
  status?: number;        // HTTP status code (default: 408)
}

/**
 * Create request timeout middleware
 */
export function requestTimeout(options: TimeoutOptions = {}) {
  const {
    timeout = 30000,
    message = 'Request timeout',
    status = 408
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip if response already sent
    if (res.headersSent) {
      return next();
    }

    // Set timeout
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout', {
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timeout
        });

        res.status(status).json({
          error: {
            message,
            code: 'REQUEST_TIMEOUT',
            timeout,
            path: req.originalUrl,
            method: req.method
          },
          timestamp: new Date().toISOString()
        });
      }
    }, timeout);

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    // Clear timeout when response closes
    res.on('close', () => {
      clearTimeout(timeoutId);
    });

    next();
  };
}

/**
 * Specific timeout middleware for different route types
 */
export const apiTimeout = requestTimeout({ timeout: 30000 });           // 30s for API calls
export const rpcTimeout = requestTimeout({ timeout: 10000 });           // 10s for RPC calls  
export const healthTimeout = requestTimeout({ timeout: 5000 });         // 5s for health checks
export const authTimeout = requestTimeout({ timeout: 15000 });          // 15s for auth calls