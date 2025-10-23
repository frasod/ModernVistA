import { brokerCapture } from '../capture';
import { brokerMetrics } from '../metrics';
import * as fs from 'fs';
import * as path from 'path';

describe('Redaction metrics integration', () => {
  const prevRaw = process.env.VISTA_BROKER_CAPTURE_RAW;
  const prevDir = process.env.VISTA_BROKER_CAPTURE_DIR;
  const prevRedact = process.env.VISTA_BROKER_CAPTURE_REDACT;
  const tempDir = path.join(__dirname, 'tmp-redaction-metrics');

  beforeAll(() => {
    brokerMetrics.reset();
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    process.env.VISTA_BROKER_CAPTURE_RAW = 'true';
    process.env.VISTA_BROKER_CAPTURE_DIR = tempDir;
    process.env.VISTA_BROKER_CAPTURE_REDACT = 'true';
  });

  afterAll(() => {
    if (prevRaw === undefined) delete process.env.VISTA_BROKER_CAPTURE_RAW; else process.env.VISTA_BROKER_CAPTURE_RAW = prevRaw;
    if (prevDir === undefined) delete process.env.VISTA_BROKER_CAPTURE_DIR; else process.env.VISTA_BROKER_CAPTURE_DIR = prevDir;
    if (prevRedact === undefined) delete process.env.VISTA_BROKER_CAPTURE_REDACT; else process.env.VISTA_BROKER_CAPTURE_REDACT = prevRedact;
  });

  it('increments redaction metrics when patterns found', () => {
    const sample = Buffer.from('Name: Smith, John SSN 123-45-6789 DOB 1975-01-02', 'utf8');
    // Access internal writeRaw method via index signature (test-only)
    (brokerCapture as any).writeRaw('recv', sample, { test: true });
    const snap = brokerMetrics.snapshot();
    expect(snap.redaction.applied).toBeGreaterThanOrEqual(1);
    expect(Object.keys(snap.redaction.rules).length).toBeGreaterThanOrEqual(1);
  });
});
