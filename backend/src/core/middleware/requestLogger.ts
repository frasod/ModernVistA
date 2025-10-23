import { Request, Response, NextFunction } from 'express';
import { logger } from '../../config/logger';

/**
 * Request Logger Middleware for ModernVista
 * 
 * Logs all HTTP requests in a clean, structured format.
 * Follows Braun design principles: essential information only.
 */

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  // Log the incoming request
  logger.info('Incoming Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    timestamp: new Date().toISOString()
  });

  // Override the response end method to log completion
  const originalEnd = res.end.bind(res);
  // Use function overload signature alignment
  (res as any).end = function(chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - start;
    
    // Log the response
    logger.info('Request Completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      timestamp: new Date().toISOString()
    });
    
    // Call the original end method
    return originalEnd(chunk as any, encoding as any, cb);
  };

  next();
}