import fs from 'fs';
import path from 'path';
import { VistaBrokerSession } from '../session';
import { brokerCapture } from '../capture';

describe('raw capture', () => {
  const prevEnv = { ...process.env } as any;
  const tmpDir = path.join(__dirname, 'tmp-captures');
  beforeAll(() => {
    process.env.VISTA_BROKER_EXPERIMENTAL = 'true';
    process.env.VISTA_BROKER_PHASE3_ENABLE = 'true';
    process.env.VISTA_BROKER_CAPTURE_RAW = 'true';
    process.env.VISTA_BROKER_CAPTURE_DIR = tmpDir;
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });
  afterAll(() => {
    process.env = prevEnv;
    brokerCapture.reset();
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('creates capture files for sign-on and RPC', async () => {
    const session = new VistaBrokerSession();
    await session.ensure();
    await session.call('ORWPT LIST ALL', []);
    session.destroy();
    // Allow sync writes to complete (they are synchronous, but brief delay just in case)
    const files = fs.existsSync(tmpDir) ? fs.readdirSync(tmpDir) : [];
    // Expect at least: SIGNON_SETUP send/recv, AV_CODE send/recv, SET_CONTEXT send/recv, RPC send/recv
    expect(files.length).toBeGreaterThanOrEqual(6);
    const sampleFile = path.join(tmpDir, files[0]);
    const content = JSON.parse(fs.readFileSync(sampleFile, 'utf8'));
    expect(content).toHaveProperty('direction');
    expect(content).toHaveProperty('hex');
  });
});
