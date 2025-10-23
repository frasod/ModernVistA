import { decodeXwb } from '../framing';
import { brokerMetrics } from '../metrics';

describe('Decode latency histogram', () => {
  const prev = process.env.VISTA_BROKER_XWB_REAL_ENABLE;
  beforeAll(() => {
    process.env.VISTA_BROKER_XWB_REAL_ENABLE = 'true';
    brokerMetrics.reset();
  });
  afterAll(() => {
    if (prev === undefined) delete process.env.VISTA_BROKER_XWB_REAL_ENABLE; else process.env.VISTA_BROKER_XWB_REAL_ENABLE = prev;
  });

  it('records latency for a decode attempt', () => {
    const payload = Buffer.from('L1\n');
    const header = Buffer.from([0x01, 0x00, payload.length]);
    decodeXwb(Buffer.concat([header, payload]));
    const snap = brokerMetrics.snapshot();
    expect(snap.decodeLatency.count).toBe(1);
    // sum should be >= 0 and at least one bucket cumulative count should be >=1
    const totalBuckets = snap.decodeLatency.counts.reduce((a:number,b:number)=>a+b,0);
    expect(totalBuckets).toBeGreaterThanOrEqual(1);
  });
});
