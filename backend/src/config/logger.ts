import winston from 'winston';
import { config } from './config';

/**
 * Winston Logger Configuration for ModernVista
 * 
 * Clean, structured logging following Braun principles:
 * - Minimal but essential information
 * - Clean, readable format
 * - Appropriate for both development and production
 */

// Custom log format for clean, readable output
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    const logMessage = stack || message;
    return `${timestamp} [${level}]: ${logMessage}`;
  })
);

// Production format (structured JSON)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create logger instance with appropriate configuration
 */
function createLogger() {
  const isProduction = config.server.nodeEnv === 'production';
  
  const logger = winston.createLogger({
    level: config.logging.level,
    format: isProduction ? productionFormat : logFormat,
    defaultMeta: { 
      service: 'modernvista-backend',
      version: '0.1.0'
    },
    transports: [
      // Console output
      new winston.transports.Console({
        silent: false
      }),
      
      // File output for all logs
      new winston.transports.File({
        filename: config.logging.filePath,
        maxsize: 10485760, // 10MB
        maxFiles: 5,
        tailable: true
      }),
      
      // Separate error log file
      new winston.transports.File({
        filename: config.logging.filePath.replace('.log', '-error.log'),
        level: 'error',
        maxsize: 10485760,
        maxFiles: 3,
        tailable: true
      })
    ],
    
    // Handle exceptions
    exceptionHandlers: [
      new winston.transports.File({ 
        filename: config.logging.filePath.replace('.log', '-exceptions.log') 
      })
    ],
    
    // Handle rejections
    rejectionHandlers: [
      new winston.transports.File({ 
        filename: config.logging.filePath.replace('.log', '-rejections.log') 
      })
    ]
  });

  // Don't exit on handled exceptions
  logger.exitOnError = false;

  return logger;
}

export const logger = createLogger();

// Export helpful logging utilities
export const loggers = {
  /**
   * Log VistA RPC communication
   */
  rpc: (method: string, params: any, result?: any, error?: any) => {
    const logData = {
      type: 'rpc',
      method,
      params: typeof params === 'string' ? params : JSON.stringify(params),
      success: !error,
      ...(result && { result: typeof result === 'string' ? result : JSON.stringify(result) }),
      ...(error && { error: error.message || error })
    };
    
    if (error) {
      logger.error('VistA RPC Error', logData);
    } else {
      logger.debug('VistA RPC Call', logData);
    }
  },

  /**
   * Log NLP processing
   */
  nlp: (input: string, output?: any, model?: string, error?: any) => {
    const logData = {
      type: 'nlp',
      input: input.substring(0, 200), // Truncate for privacy
      model,
      success: !error,
      ...(output && { output: typeof output === 'string' ? output : JSON.stringify(output) }),
      ...(error && { error: error.message || error })
    };
    
    if (error) {
      logger.error('NLP Processing Error', logData);
    } else {
      logger.info('NLP Processing', logData);
    }
  },

  /**
   * Log user authentication events
   */
  auth: (userId: string, action: string, success: boolean, details?: any) => {
    const logData = {
      type: 'auth',
      userId,
      action,
      success,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    };
    
    logger.info('Authentication Event', logData);
  }
};