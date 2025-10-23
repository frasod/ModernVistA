export type XwbDecodeState = 'HEADER' | 'BODY' | 'INTERIM' | 'COMPLETE' | 'ERROR';

export interface XwbStateResult {
  state: XwbDecodeState;
  ok: boolean;
  consumed: number;         // bytes consumed
  lines: string[];
  error?: string;
  needed?: number;          // additional bytes required (estimate)
  header?: XwbProvisionalHeader; // future: authentic header structure
}

export interface XwbStateMachineOptions {
  maxBodyBytes?: number;
  headerStrategy?: XwbHeaderStrategy; // dependency injection for authentic header parse
}

// ---------------------------------------------------------------------------
// Header Strategy Abstraction
// ---------------------------------------------------------------------------
export interface XwbProvisionalHeader {
  start: number;
  length: number;
  // placeholder fields for future expansion
  continuation?: boolean; // indicates more segments to follow
}

export interface XwbHeaderParseResult {
  ok: boolean;
  needed?: number;
  error?: string;
  header?: XwbProvisionalHeader; // later real type will replace
  consumed: number; // bytes consumed from buffer (header bytes only)
}

export interface XwbHeaderStrategy {
  readonly minBytes: number;
  parse(buffer: Buffer): XwbHeaderParseResult; // buffer starting at header boundary
}

// Provisional header: 0x01 | uint16_be_length
export class ProvisionalHeaderStrategy implements XwbHeaderStrategy {
  readonly minBytes = 3;
  constructor(private maxLength: number) {}
  parse(buffer: Buffer): XwbHeaderParseResult {
    if (buffer.length < this.minBytes) {
      return { ok: false, needed: this.minBytes - buffer.length, consumed: 0 };
    }
    const start = buffer.readUInt8(0);
    if (start !== 0x01) {
      return { ok: false, error: 'BAD_START', consumed: 1 };
    }
    const length = buffer.readUInt16BE(1);
    if (length > this.maxLength) {
      return { ok: false, error: 'BODY_TOO_LARGE', consumed: 3 };
    }
    // Provisional continuation heuristic: if length == 0, treat as continuation marker (no payload)
    if (length === 0) {
      return { ok: true, header: { start, length, continuation: true }, consumed: 3 };
    }
    return { ok: true, header: { start, length }, consumed: 3 };
  }
}

// Real header strategy stub (placeholder logic): expects two-byte start 0x00 0x01 then uint16_be length
export class RealXwbHeaderStrategy implements XwbHeaderStrategy {
  readonly minBytes = 4 + 2; // start(2) + len(2) + provisional extra? kept simple
  constructor(private maxLength: number) {}
  parse(buffer: Buffer): XwbHeaderParseResult {
    if (buffer.length < 4) {
      return { ok: false, needed: 4 - buffer.length, consumed: 0 };
    }
    const b0 = buffer.readUInt8(0);
    const b1 = buffer.readUInt8(1);
    if (b0 !== 0x00 || b1 !== 0x01) {
      return { ok: false, error: 'BAD_START', consumed: 1 };
    }
    if (buffer.length < 4) {
      return { ok: false, needed: 4 - buffer.length, consumed: 0 };
    }
    const length = buffer.readUInt16BE(2);
    if (length > this.maxLength) {
      return { ok: false, error: 'BODY_TOO_LARGE', consumed: 4 };
    }
    return { ok: true, header: { start: 0x0001, length }, consumed: 4 };
  }
}

/**
 * XwbStateMachine (scaffold)
 * Incrementally processes a buffer to extract a complete XWB response.
 * Real protocol rules TBD; for now we assume a provisional header format:
 *  [0x01 start][2-byte BE length L][payload L bytes]
 * This mirrors provisional XwbCodec frame for early state testing.
 */
export class XwbStateMachine {
  private state: XwbDecodeState = 'HEADER';
  private needed = 0;
  private declaredLength = 0;
  private body: Buffer | null = null;
  private parts: Buffer[] = [];
  private accumulated = 0;
  private maxAccumulated = 512 * 1024; // 512KB guard for multi-part total
  private multipartActive = false;
  private maxBody: number;
  private strategy: XwbHeaderStrategy;
  private header: XwbProvisionalHeader | undefined;

  constructor(opts: XwbStateMachineOptions = {}) {
    this.maxBody = opts.maxBodyBytes || 256 * 1024; // 256KB safety cap
  const strict = process.env.VISTA_BROKER_XWB_REAL_STRICT === 'true';
  this.strategy = opts.headerStrategy || (strict ? new RealXwbHeaderStrategy(this.maxBody) : new ProvisionalHeaderStrategy(this.maxBody));
    this.needed = this.strategy.minBytes;
    const overrideKb = parseInt(process.env.VISTA_BROKER_MULTIPART_MAX_KB || '512', 10);
    if (!isNaN(overrideKb) && overrideKb > 0) this.maxAccumulated = overrideKb * 1024;
  }

  reset() {
    this.state = 'HEADER';
    this.needed = this.strategy.minBytes;
    this.declaredLength = 0;
    this.body = null;
    this.header = undefined;
    this.parts = [];
  }

  feed(buffer: Buffer): XwbStateResult {
    if (this.state === 'COMPLETE' || this.state === 'ERROR') {
      return { state: this.state, ok: this.state === 'COMPLETE', consumed: 0, lines: [], error: this.state === 'ERROR' ? 'ALREADY_TERMINAL' : undefined, header: this.header };
    }
    let offset = 0;
    if (this.state === 'HEADER') {
      const parsed = this.strategy.parse(buffer);
      if (!parsed.ok) {
        if (parsed.error) {
          this.state = 'ERROR';
          return { state: 'ERROR', ok: false, consumed: parsed.consumed, lines: [], error: parsed.error };
        }
        this.needed = parsed.needed || this.strategy.minBytes;
        return { state: 'HEADER', ok: false, consumed: 0, lines: [], needed: this.needed };
      }
      this.header = parsed.header;
      if (this.header?.continuation) {
        // Continuation marker: no payload, transition to HEADER again after recording INTERIM state
        this.state = 'INTERIM';
        try { require('./metrics').brokerMetrics.recordFrameContinuation?.(); } catch { /* ignore */ }
        // Represent INTERIM with no lines yet; consumer can call feed() again with remaining buffer
        return { state: 'INTERIM', ok: false, consumed: parsed.consumed, lines: [], header: this.header };
      }
      this.declaredLength = parsed.header!.length;
      offset = parsed.consumed;
      this.state = 'BODY';
    }
    if (this.state === 'BODY') {
      const remaining = buffer.length - offset;
      if (remaining < this.declaredLength) {
        this.needed = this.declaredLength - remaining;
        return { state: 'BODY', ok: false, consumed: 0, lines: [], needed: this.needed, header: this.header };
      }
      const payload = buffer.slice(offset, offset + this.declaredLength);
      this.parts.push(payload);
      this.accumulated += payload.length;
      if (this.accumulated > this.maxAccumulated) {
        try { require('./metrics').brokerMetrics.recordFrameMultipartExceeded(); } catch { /* ignore */ }
        this.state = 'ERROR';
        return { state: 'ERROR', ok: false, consumed: offset + this.declaredLength, lines: [], error: 'MULTIPART_SIZE_EXCEEDED', header: this.header };
      }
      // If more than one part, mark start on first time we realize multi-part (parts length >1)
      if (this.parts.length === 2 && !this.multipartActive) {
        this.multipartActive = true;
        try { require('./metrics').brokerMetrics.recordFrameMultipartStart(); } catch { /* ignore */ }
      }
      this.body = Buffer.concat(this.parts);
      this.state = 'COMPLETE';
      if (this.multipartActive) {
        // compute simple checksum (sha1) for observability
        try {
          const crypto = require('crypto');
          const sum = crypto.createHash('sha1').update(this.body).digest('hex');
          require('./metrics').brokerMetrics.setFrameMultipartChecksum(sum);
          require('./metrics').brokerMetrics.recordFrameMultipartComplete();
        } catch { /* ignore */ }
      }
      const text = this.body.toString('utf8');
      const lines = text.split(/\r?\n/).filter(l => l.length > 0);
      return { state: 'COMPLETE', ok: true, consumed: offset + this.declaredLength, lines, header: this.header };
    }
    if (this.state === 'INTERIM') {
      // After INTERIM, caller should supply next buffer starting with a new header
      this.state = 'HEADER';
      this.needed = this.strategy.minBytes;
      return { state: 'INTERIM', ok: false, consumed: 0, lines: [], header: this.header };
    }
    return { state: this.state, ok: false, consumed: 0, lines: [], needed: this.needed, header: this.header };
  }
}
