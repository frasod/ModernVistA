import { vistaBrokerSession } from '../session';

// Ensure experimental flag off for legacy mock path isolation
beforeAll(() => {
  process.env.VISTA_BROKER_EXPERIMENTAL = 'false';
});

describe('VistaBrokerSession (legacy mock mode)', () => {
  test('ORWPT LIST ALL returns mock lines', async () => {
    const res = await vistaBrokerSession.call('ORWPT LIST ALL', ['DOE']);
    expect(res.ok).toBe(true);
    expect(res.lines.some(l => l.includes('DOE'))).toBe(true);
  });

  test('Unknown RPC returns not implemented marker', async () => {
    const res = await vistaBrokerSession.call('XU UNKNOWN', []);
    expect(res.ok).toBe(false);
    expect(res.lines[0]).toBe('RPC_NOT_IMPLEMENTED');
  });
});
