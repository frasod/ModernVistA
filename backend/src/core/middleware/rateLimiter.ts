import { Request, Response, NextFunction } from 'express';
import { config } from '../../config/config';
import { logger } from '../../config/logger';

/**
 * Simple Rate Limiting Middleware for ModernVista
 * 
 * Basic in-memory rate limiter to protect API endpoints.
 * Clean implementation following security best practices.
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key]!.resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip;
  const now = Date.now();
  const windowMs = config.security.rateLimitWindowMs;
  const maxRequests = config.security.rateLimitMaxRequests;

  // Initialize or reset if window has passed
  if (!store[key] || store[key]!.resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs
    };
    return next();
  }

  // Increment count
  store[key]!.count++;

  // Check if limit exceeded
  if (store[key]!.count > maxRequests) {
    const retryAfter = Math.ceil((store[key]!.resetTime - now) / 1000);
    
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      count: store[key]!.count,
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      error: {
        message: 'Too many requests from this IP, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      timestamp: new Date().toISOString(),
      retryAfter
    });
    return;
  }

  next();
}