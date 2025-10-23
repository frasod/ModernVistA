import { createApp } from './app';
import { config } from './config/config';
import { logger } from './config/logger';

const app = createApp();
const startTime = Date.now();
const port = config.server.port;

const startupTimeout = setTimeout(() => {
  logger.error('[ModernVista][FATAL] Server startup timeout after 10 seconds');
  // eslint-disable-next-line no-console
  console.error('[ModernVista] Server failed to start - check port availability and configuration');
  process.exit(1);
}, 10000);

const server = app.listen(port, () => {
  clearTimeout(startupTimeout);
  logger.info('🚀 ModernVista Backend started');
  logger.info(`Port: ${port}`);
  logger.info(`Env: ${config.server.nodeEnv}`);
  logger.info(`Health: http://localhost:${port}/health`);
  logger.info(`API Root: http://localhost:${port}${config.server.apiPrefix}`);
  // eslint-disable-next-line no-console
  console.log('[ModernVista] Startup complete in', Date.now() - startTime, 'ms');
});

server.on('error', (err: any) => {
  clearTimeout(startupTimeout);
  if (err.code === 'EADDRINUSE') {
    logger.error(`[ModernVista][FATAL] Port ${port} is already in use`);
    // eslint-disable-next-line no-console
    console.error(`Port ${port} is busy. Kill existing process or change PORT in .env`);
  } else {
    logger.error('[ModernVista][FATAL] Server error:', err.message);
    // eslint-disable-next-line no-console
    console.error('[ModernVista] Server error:', err.message);
  }
  process.exit(1);
});

function gracefulShutdown() {
  logger.info('[ModernVista] Received shutdown signal, closing server...');
  server.close(() => {
    logger.info('[ModernVista] Server closed gracefully');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('[ModernVista] Forced shutdown after timeout');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;