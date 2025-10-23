import { brokerMetrics } from '../../broker/metrics';

describe('brokerMetrics', () => {
  beforeEach(() => brokerMetrics.reset());

  it('aggregates RPC timings and errors', () => {
    brokerMetrics.record('ORWPT LIST', 10, true);
    brokerMetrics.record('ORWPT LIST', 30, false);
    brokerMetrics.record('ORWPT LIST', 20, true);
    const snap = brokerMetrics.snapshot();
    const rpc = snap.rpc['ORWPT LIST'];
    expect(rpc.count).toBe(3);
    expect(rpc.errors).toBe(1);
    expect(rpc.maxMs).toBe(30);
    expect(rpc.avgMs).toBeGreaterThanOrEqual(19.9);
    expect(rpc.avgMs).toBeLessThanOrEqual(20.1);
  });

  it('tracks sign-on attempts', () => {
    brokerMetrics.recordSignOn(true, 15);
    brokerMetrics.recordSignOn(false, 0);
    const snap = brokerMetrics.snapshot();
    expect(snap.signOn.attempts).toBe(2);
    expect(snap.signOn.errors).toBe(1);
  });

  it('tracks frame assembly stats', () => {
    brokerMetrics.recordFrameChunk();
    brokerMetrics.recordFrameChunk();
    brokerMetrics.recordFrameError('SHORT_FRAME');
    brokerMetrics.recordFrameComplete();
    const snap = brokerMetrics.snapshot();
    expect(snap.frames.seen).toBe(2);
    expect(snap.frames.complete).toBe(1);
    expect(snap.frames.errors).toBe(1);
    expect(snap.frames.lastError).toBe('SHORT_FRAME');
  });
});
