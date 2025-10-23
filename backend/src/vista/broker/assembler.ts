/*
 * FrameAssembler - incremental buffer assembly for broker frames.
 * --------------------------------------------------------------
 * Handles partial TCP chunks and emits complete frames. Currently supports
 * the synthetic length-prefixed format used in development scaffolding.
 * Future: add authentic XWB framing parsing without changing the public API.
 */

import { decodeLengthPrefixed, DecodedRpcPacket, BrokerFrameErrorCode } from './framing';

export interface AssemblerResult {
  packet?: DecodedRpcPacket;
  // Remaining unconsumed bytes (if any) after extracting a frame
  remainder: Buffer;
  error?: BrokerFrameErrorCode;
}

export interface FrameAssemblerOptions {
  mode: 'synthetic-length-prefixed' | 'xwb';
  maxFrameBytes?: number; // safety cap
}

export class FrameAssembler {
  private buffer: Buffer = Buffer.alloc(0);
  private readonly maxFrame: number;
  private readonly mode: FrameAssemblerOptions['mode'];

  constructor(opts: FrameAssemblerOptions) {
    this.mode = opts.mode;
    this.maxFrame = opts.maxFrameBytes ?? 256 * 1024; // 256KB safety for now
  }

  reset(): void { this.buffer = Buffer.alloc(0); }

  /**
   * push - add new data chunk, attempt frame extraction.
   * Returns a result if a full frame is available; otherwise undefined.
   */
  push(chunk: Buffer): AssemblerResult | undefined {
    if (chunk.length === 0) return; // ignore empties
    this.buffer = Buffer.concat([this.buffer, chunk]);
    if (this.buffer.length > this.maxFrame) {
      // Safety: drop buffer if exceeding cap
      const remainder = this.buffer;
      this.reset();
      return { remainder, error: 'LENGTH_MISMATCH' }; // reuse code; future dedicated code
    }
    if (this.mode === 'synthetic-length-prefixed') {
      return this.trySynthetic();
    }
    // XWB mode stub – will implement once real framing known
    return undefined;
  }

  private trySynthetic(): AssemblerResult | undefined {
    if (this.buffer.length < 4) return; // need at least length header
    const lenHex = this.buffer.slice(0, 4).toString('utf8');
    const declared = parseInt(lenHex, 16);
    if (Number.isNaN(declared)) {
      const remainder = this.buffer;
      this.reset();
      return { remainder, error: 'UNKNOWN_FORMAT' };
    }
    const totalNeeded = 4 + declared;
    if (this.buffer.length < totalNeeded) return; // wait for more
    const frameBuf = this.buffer.slice(0, totalNeeded);
    const remainder = this.buffer.slice(totalNeeded);
    const decoded = decodeLengthPrefixed(frameBuf);
    this.buffer = remainder; // keep leftover for next call
    return { packet: decoded, remainder };
  }
}

export function createSyntheticAssembler(): FrameAssembler {
  return new FrameAssembler({ mode: 'synthetic-length-prefixed' });
}
