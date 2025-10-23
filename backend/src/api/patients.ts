import { Router } from 'express';
import { asyncHandler, createApiError } from '../core/middleware/errorHandler';
import { vistaRPCClient } from '../vista/rpcClient';

export const patientsRouter = Router();

// Simple connectivity check to VistA RPC port
patientsRouter.get('/ping', asyncHandler(async (_req, res) => {
  const reachable = await vistaRPCClient.ping();
  res.json({ ok: reachable });
}));

// Patient search (mocked via RPC client stub)
patientsRouter.get('/search', asyncHandler(async (req, res) => {
  const q = (req.query.q as string || '').trim();
  if (!q) throw createApiError('Query parameter q required', 400, 'VALIDATION_ERROR');
  const rpc = await vistaRPCClient.call('ORWPT LIST ALL', [q]);
  if (!rpc.ok) throw createApiError(rpc.error || 'RPC failed', 502, 'RPC_ERROR');
  res.json({ patients: rpc.data, timingMs: rpc.timingMs });
}));
