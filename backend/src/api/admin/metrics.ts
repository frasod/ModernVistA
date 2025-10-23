import { Router } from 'express';
// Converted from path aliases to relative imports for production build compatibility
import { brokerMetrics } from '../../vista/broker/metrics';
import { brokerCapture } from '../../vista/broker/capture';
import { logger } from '../../config/logger';

// Simple admin metrics router (no auth yet). In production, protect this.
export const adminMetricsRouter = Router();

adminMetricsRouter.get('/broker/metrics', (req, res) => {
  const snap = brokerMetrics.snapshot();
  logger.debug('[AdminMetrics] snapshot served');
  res.json(snap);
});

adminMetricsRouter.get('/broker/capture', (req, res) => {
  const snap = brokerCapture.snapshot();
  res.json(snap);
});

adminMetricsRouter.get('/broker/frames', (req, res) => {
  const snap = brokerCapture.snapshot();
  if (!snap.frameCaptureEnabled) return res.status(400).json({ enabled: false });
  res.json(snap.frames || { enabled: false });
});

adminMetricsRouter.post('/broker/capture/reset', (req, res) => {
  brokerCapture.reset();
  res.json({ reset: true });
});
