import { encodeRpc, decodeRpcResponse, decodeLengthPrefixed, encodeXwb, decodeXwb } from '../framing';

describe('framing contract (synthetic)', () => {
  test('encodeRpc produces synthetic-text packet by default', () => {
    const pkt = encodeRpc('ORWPT LIST', ['JOHN']);
    expect(pkt.kind).toBe('synthetic-text');
    expect(pkt.raw.toString()).toContain('XWB_RPC:ORWPT LIST');
    expect(pkt.debug).toContain('ORWPT LIST');
    expect(pkt.lengthPrefixed).toBeUndefined();
  });

  test('encodeRpc with length prefix sets kind and metadata', () => {
    const pkt = encodeRpc('ORWPT LIST', ['JOHN'], { experimentalLengthPrefix: true });
    expect(pkt.kind).toBe('synthetic-length-prefixed');
    expect(pkt.lengthPrefixed).toBeDefined();
    expect(pkt.meta?.declaredLength).toBe(pkt.raw.length);
  });

  test('decodeRpcResponse ok with END sentinel', () => {
    const pkt = encodeRpc('X', ['A']);
    const decoded = decodeRpcResponse(pkt.raw);
    expect(decoded.ok).toBe(true);
    expect(decoded.lines.some(l => l.includes('P0=A'))).toBe(true);
  });

  test('decodeLengthPrefixed validates length', () => {
    const pkt = encodeRpc('X', ['A'], { experimentalLengthPrefix: true });
    const decoded = decodeLengthPrefixed(pkt.lengthPrefixed!);
    expect(decoded.ok).toBe(true);
    expect(decoded.error).toBeUndefined();
    expect(decoded.kind).toBe('synthetic-length-prefixed');
  });

  test('decodeLengthPrefixed detects mismatch', () => {
    const pkt = encodeRpc('X', ['A'], { experimentalLengthPrefix: true });
    const tampered = Buffer.concat([
      pkt.lengthPrefixed!.slice(0, 4),
      pkt.lengthPrefixed!.slice(4, 10) // truncate intentionally
    ]);
    const decoded = decodeLengthPrefixed(tampered);
    expect(decoded.ok).toBe(false);
    expect(decoded.error).toBe('LENGTH_MISMATCH');
  });
});

describe('xwb stubs', () => {
  test('encodeXwb currently falls back to synthetic', () => {
    const pkt = encodeXwb('ORWPT LIST', ['JOHN']);
    expect(pkt.kind).toBe('synthetic-text');
  });

  test('decodeXwb returns INCOMPLETE stub', () => {
    const buffer = Buffer.from('stub');
    const res = decodeXwb(buffer);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('INCOMPLETE');
    expect(res.kind).toBe('xwb-response');
  });
});
