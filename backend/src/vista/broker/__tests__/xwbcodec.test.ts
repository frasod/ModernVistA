import { XwbCodec } from '../codec';

describe('XwbCodec stub', () => {
  test('encodes with start marker and length', () => {
    const codec = new XwbCodec();
    const pkt = codec.encode('FOO BAR', ['A','B']);
    expect(pkt.raw.length).toBeGreaterThan(3);
    expect(pkt.raw.readUInt8(0)).toBe(0x01);
    const declared = pkt.raw.readUInt16BE(1);
    expect(declared).toBe(pkt.raw.length - 3);
    expect(pkt.kind).toBe('xwb-request');
  });

  test('decode round-trip lines', () => {
    const codec = new XwbCodec();
    const pkt = codec.encode('FOO', ['P1']);
    const decoded = codec.decode(pkt.raw, false);
    expect(decoded.ok).toBe(true);
    expect(decoded.lines.some(l => l.includes('XWB_RPC:FOO'))).toBe(true);
  });

  test('decode fails with wrong length', () => {
    const codec = new XwbCodec();
    const pkt = codec.encode('BAR', []);
    // Corrupt length byte
    const corrupt = Buffer.from(pkt.raw);
    corrupt.writeUInt16BE(0xFFFF, 1);
    const decoded = codec.decode(corrupt, false);
    expect(decoded.ok).toBe(false);
  });
});
