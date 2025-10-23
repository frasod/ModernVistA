import { decodeXwb } from '../framing';

/**
 * Placeholder tests for future real XWB header parsing.
 * Currently asserts provisional state machine behavior under real flag.
 */

describe('XWB Header Placeholder', () => {
  const realFlag = process.env.VISTA_BROKER_XWB_REAL_ENABLE;
  beforeAll(() => {
    process.env.VISTA_BROKER_XWB_REAL_ENABLE = 'true';
  });
  afterAll(() => {
    if (realFlag === undefined) delete process.env.VISTA_BROKER_XWB_REAL_ENABLE; else process.env.VISTA_BROKER_XWB_REAL_ENABLE = realFlag;
  });

  it('decodes provisional frame with start marker 0x01 and length', () => {
    const payload = Buffer.from('HELLO', 'utf8');
    const header = Buffer.from([0x01, 0x00, payload.length]);
    const frame = Buffer.concat([header, payload]);
    const res = decodeXwb(frame);
    expect(res.ok).toBe(true);
    expect(res.lines.join('\n')).toContain('HELLO');
  });

  it('returns INCOMPLETE for truncated body', () => {
    const payload = Buffer.from('HELLO', 'utf8');
    const header = Buffer.from([0x01, 0x00, payload.length]);
    const frame = Buffer.concat([header, payload.slice(0, 2)]); // truncated
    const res = decodeXwb(frame);
    expect(res.ok).toBe(false);
    expect(res.error === 'INCOMPLETE' || res.meta?.state === 'BODY').toBe(true);
  });
});
