import net from 'net';
import { startLoopbackBroker } from './loopbackServer';
import { vistaBrokerSession } from '../session';

/**
 * Integration test (synthetic): exercises session with experimental flag ON
 * and real SocketTransport targeting a loopback broker.
 */

describe('Broker SocketTransport integration', () => {
  const testPort = 19430; // ephemeral test port
  let server: net.Server;
  const originalFlag = process.env.VISTA_BROKER_EXPERIMENTAL;
  const originalHost = process.env.VISTA_HOST;
  const originalPort = process.env.VISTA_PORT;

  beforeAll(async () => {
    process.env.VISTA_BROKER_EXPERIMENTAL = 'true';
    process.env.VISTA_HOST = '127.0.0.1';
    process.env.VISTA_PORT = String(testPort);
    server = await startLoopbackBroker(testPort);
  });

  afterAll(async () => {
    server.close();
    process.env.VISTA_BROKER_EXPERIMENTAL = originalFlag;
    if (originalHost) process.env.VISTA_HOST = originalHost; else delete process.env.VISTA_HOST;
    if (originalPort) process.env.VISTA_PORT = originalPort; else delete process.env.VISTA_PORT;
  });

  test('ORWPT LIST ALL returns loopback lines (non-empty)', async () => {
    const res = await vistaBrokerSession.call('ORWPT LIST ALL', ['DOE']);
    expect(res.ok).toBe(true);
    expect(res.lines.length).toBeGreaterThan(0);
    expect(res.lines.some(l => l.includes('DOE'))).toBe(true);
  });
});
