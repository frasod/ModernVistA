import { VistaBrokerSession } from '../session';
import { brokerMetrics } from '../metrics';

describe('sign-on metrics', () => {
  const prev = { ...process.env };
  beforeAll(() => {
    process.env.VISTA_BROKER_EXPERIMENTAL = 'true';
    process.env.VISTA_BROKER_PHASE3_ENABLE = 'true';
    brokerMetrics.reset();
  });
  afterAll(() => { process.env = prev; });

  test('sign-on counted once for multiple ensures before idle expiry', async () => {
    const session = new VistaBrokerSession();
    await session.ensure();
    await session.ensure();
    const snap = brokerMetrics.snapshot();
    expect(snap.signOn.attempts).toBe(1);
    session.destroy();
  });
});
