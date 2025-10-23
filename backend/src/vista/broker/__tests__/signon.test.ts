import { VistaBrokerSession } from '../session';

describe('VistaBrokerSession sign-on & context (phase3 synthetic)', () => {
  const prevEnv = { ...process.env };
  beforeAll(() => {
    process.env.VISTA_BROKER_EXPERIMENTAL = 'true';
    process.env.VISTA_BROKER_PHASE3_ENABLE = 'true';
    process.env.VISTA_CONTEXT = 'OR CPRS GUI CHART';
  });
  afterAll(() => { process.env = prevEnv; });

  test('performSignOn + setContext transitions to ready', async () => {
    const session = new VistaBrokerSession();
    await session.ensure();
    const res = await session.call('ORWPT LIST ALL', []);
    expect(res.ok).toBe(true);
    expect(Array.isArray(res.lines)).toBe(true);
    expect(res.lines.length).toBeGreaterThan(0);
    session.destroy();
  });
});
