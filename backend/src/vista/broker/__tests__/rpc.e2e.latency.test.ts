import { vistaBrokerSession } from '../session';
import { brokerMetrics } from '../metrics';

describe('RPC end-to-end latency histogram', () => {
  const prev = process.env.VISTA_BROKER_EXPERIMENTAL;
  const prevPhase3 = process.env.VISTA_BROKER_PHASE3_ENABLE;
  beforeAll(() => {
    process.env.VISTA_BROKER_EXPERIMENTAL = 'false'; // use mock path for deterministic test
    process.env.VISTA_BROKER_PHASE3_ENABLE = 'false';
    brokerMetrics.reset();
  });
  afterAll(() => {
    if (prev === undefined) delete process.env.VISTA_BROKER_EXPERIMENTAL; else process.env.VISTA_BROKER_EXPERIMENTAL = prev;
    if (prevPhase3 === undefined) delete process.env.VISTA_BROKER_PHASE3_ENABLE; else process.env.VISTA_BROKER_PHASE3_ENABLE = prevPhase3;
  });

  it('increments e2e latency histogram on mock RPC', async () => {
    const res = await vistaBrokerSession.call('ORWPT LIST', ['DOE']);
    expect(res.ok).toBe(true);
    const snap = brokerMetrics.snapshot();
    expect(snap.rpcE2E.count).toBe(1);
    const totalBuckets = snap.rpcE2E.counts.reduce((a:number,b:number)=>a+b,0);
    expect(totalBuckets).toBeGreaterThanOrEqual(1);
  });
});
