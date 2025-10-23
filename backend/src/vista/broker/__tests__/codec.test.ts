import { decodeLengthPrefixed } from '../framing';

describe('decodeLengthPrefixed', () => {
  test('returns SHORT_FRAME when fewer than 4 bytes', () => {
    const r = decodeLengthPrefixed(Buffer.from('0a', 'utf8'));
    expect(r.ok).toBe(false);
    expect(r.error).toBe('SHORT_FRAME');
  });

  test('returns LENGTH_MISMATCH when declared != actual', () => {
    // Declared length 0005 but only 3 bytes payload
    const buf = Buffer.concat([Buffer.from('0005', 'utf8'), Buffer.from('abc', 'utf8')]);
    const r = decodeLengthPrefixed(buf);
    expect(r.ok).toBe(false);
    expect(r.error).toBe('LENGTH_MISMATCH');
  });
});
