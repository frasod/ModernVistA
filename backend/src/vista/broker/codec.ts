import { EncodedRpcPacket, encodeRpc, encodeXwb, decodeRpcResponse, decodeLengthPrefixed, decodeXwb } from './framing';

export interface FrameCodec {
  encode(rpc: string, params: string[]): EncodedRpcPacket;
  decode(buf: Buffer, usedLengthPrefix: boolean): { ok: boolean; lines: string[] };
}

/**
 * SyntheticCodec - wraps current synthetic and experimental length-prefixed logic.
 * Future: XwbCodec implementing real protocol; tests can assert behavior via this interface.
 */
export class SyntheticCodec implements FrameCodec {
  constructor(private useLengthPrefix: boolean) {}
  encode(rpc: string, params: string[]): EncodedRpcPacket {
    return encodeRpc(rpc, params, { experimentalLengthPrefix: this.useLengthPrefix });
  }
  decode(buf: Buffer, usedLengthPrefix: boolean) {
    if (usedLengthPrefix) {
      const d = decodeLengthPrefixed(buf);
      return { ok: d.ok, lines: d.lines };
    }
    const d = decodeRpcResponse(buf);
    return { ok: d.ok, lines: d.lines };
  }
}

/**
 * XwbCodec (Phase 4 Stub)
 * Placeholder binary framing to prepare for real XWB implementation.
 * Frame format (temporary):
 *  [0x01 start][2-byte big-endian length N of payload][payload bytes]
 * Payload is current synthetic raw buffer (no length prefix) so higher layers unchanged.
 */
export class XwbCodec implements FrameCodec {
  encode(rpc: string, params: string[]): EncodedRpcPacket {
    const base = encodeXwb(rpc, params); // currently defers to synthetic encode
    const payload = base.raw; // synthetic raw
    const header = Buffer.alloc(3);
    header.writeUInt8(0x01, 0); // start marker placeholder
    header.writeUInt16BE(payload.length, 1);
    const framed = Buffer.concat([header, payload]);
    return {
      ...base,
      raw: framed,
      debug: `XWB|len=${payload.length}|` + base.debug,
      kind: 'xwb-request',
      meta: { start: 0x01, declared: payload.length }
    };
  }
  decode(buf: Buffer, _usedLengthPrefix: boolean): { ok: boolean; lines: string[] } {
    if (process.env.VISTA_BROKER_XWB_REAL_ENABLE === 'true') {
      const d = decodeXwb(buf);
      return { ok: d.ok, lines: d.lines };
    }
    if (buf.length < 3) return { ok: false, lines: [] };
    const start = buf.readUInt8(0);
    const len = buf.readUInt16BE(1);
    if (start !== 0x01) return { ok: false, lines: [] };
    const payload = buf.slice(3);
    if (payload.length !== len) return { ok: false, lines: [] };
    const dec = decodeRpcResponse(payload);
    return { ok: dec.ok, lines: dec.lines };
  }
}

export function createDefaultCodec(): FrameCodec {
  const lengthPref = process.env.VISTA_BROKER_PHASE3_ENABLE === 'true';
  if (process.env.VISTA_BROKER_XWB_ENABLE === 'true') {
    return new XwbCodec();
  }
  return new SyntheticCodec(!!lengthPref);
}
