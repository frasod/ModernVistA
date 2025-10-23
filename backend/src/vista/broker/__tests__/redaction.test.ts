/**
 * Redaction tests ensure PHI patterns are masked when VISTA_BROKER_CAPTURE_REDACT is true.
 */
import { brokerCapture } from '../capture';
import * as fs from 'fs';
import * as path from 'path';

// Helper to read last written raw capture file
function getLastCapture(dir: string) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
  if (!files.length) return null;
  const data = JSON.parse(fs.readFileSync(path.join(dir, files[files.length - 1]), 'utf8'));
  return data;
}

describe('Broker Capture Redaction', () => {
  const prevRaw = process.env.VISTA_BROKER_CAPTURE_RAW;
  const prevDir = process.env.VISTA_BROKER_CAPTURE_DIR;
  const prevRedact = process.env.VISTA_BROKER_CAPTURE_REDACT;
  const tempDir = path.join(__dirname, 'tmp-redaction');

  beforeAll(() => {
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

  it('redacts SSN, DOB, and NAME patterns in raw capture', () => {
    const sample = Buffer.from('Patient: Smith, John SSN: 123-45-6789 DOB: 1980-07-14', 'utf8');
    brokerCapture['writeRaw']?.('recv' as any, sample, { test: true }); // direct call (internal) for test
    const last = getLastCapture(tempDir);
    expect(last).toBeTruthy();
    expect(last.redaction.enabled).toBe(true);
    expect(last.hex).not.toContain('123456789');
    expect(last.asciiPreview).not.toContain('123-45-6789');
    expect(last.asciiPreview).not.toContain('1980-07-14');
    expect(last.asciiPreview).not.toContain('Smith, John');
  });
});
