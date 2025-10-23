import { createSyntheticAssembler } from '../assembler';
import { encodeRpc } from '../framing';

function buildLengthPrefixed(rpc: string, params: string[]) {
  const pkt = encodeRpc(rpc, params, { experimentalLengthPrefix: true });
  return pkt.lengthPrefixed!;
}

describe('FrameAssembler (synthetic-length-prefixed)', () => {
  test('assembles complete frame in one chunk', () => {
    const assembler = createSyntheticAssembler();
    const buf = buildLengthPrefixed('X', ['A']);
    const res = assembler.push(buf);
    expect(res).toBeDefined();
    expect(res?.packet?.ok).toBe(true);
    expect(res?.remainder.length).toBe(0);
  });

  test('assembles frame across two chunks', () => {
    const assembler = createSyntheticAssembler();
    const buf = buildLengthPrefixed('X', ['A']);
    const firstHalf = buf.slice(0, 3); // shorter than needed for header+payload
    const secondHalf = buf.slice(3);
    const r1 = assembler.push(firstHalf);
    expect(r1).toBeUndefined();
    const r2 = assembler.push(secondHalf);
    expect(r2).toBeDefined();
    expect(r2?.packet?.ok).toBe(true);
  });

  test('detects unknown format (non-hex length)', () => {
    const assembler = createSyntheticAssembler();
    const bad = Buffer.from('zzzzHELLO');
    const res = assembler.push(bad);
    expect(res).toBeDefined();
    expect(res?.error).toBe('UNKNOWN_FORMAT');
  });

  test('handles multiple frames back-to-back', () => {
    const assembler = createSyntheticAssembler();
    const a = buildLengthPrefixed('X', ['A']);
    const b = buildLengthPrefixed('Y', ['B']);
    const combined = Buffer.concat([a, b]);
    const r1 = assembler.push(combined);
    expect(r1?.packet?.ok).toBe(true);
    // second frame should remain as remainder
    expect(r1?.remainder.length).toBe(b.length);
    const r2 = assembler.push(Buffer.alloc(0)); // pushing empty won't process
    // need to push something (even zero) won't process; push remainder explicitly
    const r3 = assembler.push(Buffer.from('')); // still undefined
    // Force attempt by re-adding remainder bytes (simulate next chunk arrival)
    const r4 = assembler.push(r1!.remainder);
    expect(r4?.packet?.ok).toBe(true);
  });
});
