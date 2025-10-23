import { VistaBrokerSession } from '../session';
import { MockTransport } from '../transport';

class SilentMockTransport extends MockTransport {
  async send(_f: Buffer) { /* do nothing, override to skip queueing */ }
  async read(_t?: number) { return null; }
}

describe('VistaBrokerSession timeout fallback', () => {
  const prev = { ...process.env };
  beforeAll(() => {
    process.env.VISTA_BROKER_EXPERIMENTAL = 'true';
    process.env.VISTA_BROKER_PHASE3_ENABLE = 'true';
  });
  afterAll(() => { process.env = prev; });

  test('fallback mock data when transport returns null buffer', async () => {
    const session = new VistaBrokerSession();
    // Monkey patch transport to silent variant
    (session as any).transport = new SilentMockTransport();
    const res = await session.call('ORWPT LIST ALL', []);
    expect(res.ok).toBe(true);
    expect(res.lines.length).toBeGreaterThan(0);
    expect(res.mock).toBe(true);
    session.destroy();
  });
});
