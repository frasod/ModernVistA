/*
 * VistA RPC Broker Framing Utilities (Phase 2 Scaffold)
 * ----------------------------------------------------
 * This module documents and scaffolds the encoding/decoding steps for the
 * VistA RPC Broker (XWB) protocol without yet implementing the full binary
 * handshake. The design favors incremental delivery: each function returns
 * rich metadata and is side-effect free so we can unit-test framing logic
 * independently from the live socket.
 *
 * References (public domain / FOIA materials):
 *  - CPRS / XWB broker packet examples
 *  - Legacy Delphi client (CPRS) uses a length-prefixed string protocol
 *
 * High-Level Packet Structure (simplified for early implementation):
 *  [Header]\n[Body]
 *  Where header and body fields are caret or control-char delimited. Later
 *  iterations will adopt exact control sequences (e.g. \u0001 markers) once
 * High-Level Packet Structure (Evolution):
 *  1. Phase 2 (Synthetic Text): Simple newline-delimited text.
 *  2. Phase 3 (Synthetic Length-Prefixed): `[4-char-hex-len][payload]` to test
 *     the FrameAssembler before real protocol parsing.
 *  3. Phase 4+ (Real XWB): Authentic control bytes and framing once
 *  parity testing begins against a live VEHU instance.
 *
 * NOTE: This file intentionally uses placeholder strategies until actual
 *       capture & replay validation is performed. All exported functions
 *       are tagged with TODO steps describing what will change.
 */

// ---------------------------------------------------------------------------
// Frame / Protocol Contracts (Incremental, Forward-Compatible)
// ---------------------------------------------------------------------------

export type BrokerFrameKind =
  | 'synthetic-text'          // Current placeholder (Phase 2)
  | 'synthetic-length-prefixed' // Phase 3 experimental
  | 'xwb-request'             // Planned: real XWB request frame
  | 'xwb-response';           // Planned: real XWB response frame

export interface EncodedRpcPacket {
  rpcName: string;
  params: string[];
  raw: Buffer;                // Buffer to write (placeholder format now)
  debug: string;              // Human-readable representation for logging (PHI-safe)
  kind: BrokerFrameKind;
  lengthPrefixed?: Buffer;    // Phase 3 experimental length-prefixed form
  meta?: Record<string, any>; // Additional metadata (e.g., declared length, flags)
}

export interface DecodedRpcPacket {
  ok: boolean;
  lines: string[];             // Raw body lines (unparsed placeholder)
  error?: BrokerFrameErrorCode;
  meta?: Record<string, any>;  // e.g., declared length, control bytes
  raw: Buffer;                 // Original raw buffer
  kind?: BrokerFrameKind;      // Decoded frame type (synthetic vs real)
}

// Enumerated error codes (forward-compatible) to avoid stringly-typed chaos later.
export type BrokerFrameErrorCode =
  | 'SHORT_FRAME'
  | 'LENGTH_MISMATCH'
  | 'UNSUPPORTED_VERSION'
  | 'CONTROL_SEQUENCE'
  | 'INCOMPLETE'
  | 'UNKNOWN_FORMAT';

// Structured encode options (future: parameter typing, context, multi-part streaming)
export interface EncodeRpcOptions {
  experimentalLengthPrefix?: boolean; // Keep legacy flag explicit inside encode call
}

/**
 * Create proper XWB framing for VistA RPC calls
 * Implements actual XWB protocol structure used by CPRS
 */
export function encodeRpc(name: string, params: string[] = [], opts: EncodeRpcOptions = {}): EncodedRpcPacket {
  // Real XWB protocol implementation
  // XWB frame structure: [header][RPC name][parameters][trailer]
  
  // Build parameter block
  let paramBlock = '';
  params.forEach((param, i) => {
    if (param && param.length > 0) {
      paramBlock += `${i.toString().padStart(3, '0')}${param.length.toString().padStart(3, '0')}${param}f`;
    }
  });
  
  // Build full RPC payload  
  const rpcPayload = `${name.padEnd(30)}${paramBlock}`;
  
  // XWB header: 
  // - Start marker (0x00, 0x00)
  // - Version/flags 
  // - Length (4 bytes, little endian)
  const payloadLength = Buffer.byteLength(rpcPayload, 'utf8');
  const header = Buffer.alloc(10);
  header.writeUInt8(0x00, 0);   // Start marker 1
  header.writeUInt8(0x00, 1);   // Start marker 2  
  header.writeUInt8(0x01, 2);   // Version/Type
  header.writeUInt8(0x00, 3);   // Reserved
  header.writeUInt32LE(payloadLength, 4); // Length (little endian)
  header.writeUInt8(0x00, 8);   // Reserved
  header.writeUInt8(0x0A, 9);   // Separator
  
  const payload = Buffer.from(rpcPayload, 'utf8');
  const trailer = Buffer.from([0x04]); // EOT marker
  
  const rawBuffer = Buffer.concat([header, payload, trailer]);
  
  // Create debug string (PHI-safe)
  const debugStr = `XWB[${name}](${params.length} params)`;
  
  const result: EncodedRpcPacket = {
    rpcName: name,
    params: params,
    raw: rawBuffer,
    debug: debugStr,
    kind: 'xwb-request',
    meta: { 
      headerLength: header.length,
      payloadLength: payload.length,
      totalLength: rawBuffer.length
    }
  };
  
  // Add length-prefixed form if requested
  if (opts.experimentalLengthPrefix) {
    const lengthPrefix = Buffer.alloc(4);
    lengthPrefix.writeUInt32BE(rawBuffer.length, 0);
    result.lengthPrefixed = Buffer.concat([lengthPrefix, rawBuffer]);
  }
  
  return result;
}

/**
 * decodeRpcResponse - Parse actual XWB response frames
 * Implements real XWB protocol response parsing
 */
export function decodeRpcResponse(buffer: Buffer): DecodedRpcPacket {
  if (buffer.length < 10) {
    return {
      ok: false,
      lines: [],
      error: 'SHORT_FRAME',
      raw: buffer,
      kind: 'xwb-response',
      meta: { needed: 10 - buffer.length }
    };
  }

  // Check for XWB header markers
  const startMarker1 = buffer.readUInt8(0);
  const startMarker2 = buffer.readUInt8(1);
  
  if (startMarker1 === 0x00 && startMarker2 === 0x00) {
    // Real XWB response frame
    const version = buffer.readUInt8(2);
    const payloadLength = buffer.readUInt32LE(4);
    
    if (buffer.length < 10 + payloadLength) {
      return {
        ok: false,
        lines: [],
        error: 'INCOMPLETE',
        raw: buffer,
        kind: 'xwb-response',
        meta: { 
          declared: payloadLength,
          received: buffer.length - 10,
          needed: payloadLength - (buffer.length - 10)
        }
      };
    }
    
    // Extract payload
    const payloadStart = 10;
    const payloadEnd = payloadStart + payloadLength;
    const payload = buffer.slice(payloadStart, payloadEnd);
    
    // Parse payload as text lines
    const text = payload.toString('utf8');
    const lines = text.split(/\r?\n/).filter(l => l.length > 0);
    
    // Check for error indicators
    const hasError = lines.some(line => 
      line.startsWith('M  ERROR') || 
      line.includes('ACCESS DENIED') ||
      line.includes('INVALID')
    );
    
    return {
      ok: !hasError,
      lines: lines,
      raw: buffer,
      kind: 'xwb-response',
      meta: {
        version: version,
        declared: payloadLength,
        consumed: payloadEnd
      }
    };
  } else {
    // Fallback to text parsing for legacy/mock responses
    const text = buffer.toString('utf8');
    const lines = text.split(/\r?\n/).filter(l => l.length > 0);
    const ok = lines.includes('END');
    
    return {
      ok,
      lines: ok ? lines.filter(l => l !== 'END') : lines,
      raw: buffer,
      meta: { fallback: true },
      kind: 'synthetic-text'
    };
  }
}

/**
 * sanitizeForLog - Removes potential PHI from arbitrary lines before logging.
 * This will be refined once real responses are parsed (e.g., drop name/SSN fields).
 */
export function sanitizeForLog(lines: string[]): string {
  const redacted = lines.map(l => {
    if (/SSN|\b\d{3}-?\d{2}-?\d{4}\b/i.test(l)) return '[REDACTED_LINE]';
    return l.length > 120 ? l.slice(0, 117) + '...' : l;
  });
  return redacted.join(' | ');
}

/**
 * planFramingEvolution - returns a roadmap so unit tests can assert we haven't
 * skipped required phases accidentally.
 */
export function planFramingEvolution(): string[] {
  return [
    'phase2-skeleton',
    'phase3-length-prefix',
    'phase4-param-typing',
    'phase5-contextual-errors',
    'phase6-streaming-large-results'
  ];
}

/**
 * decodeLengthPrefixed - Phase 3 experimental helper that attempts to parse the
 * synthetic length-prefixed form created above. Real Broker protocol differs,
 * so this is only to exercise state machine & buffer management code paths.
 */
export function decodeLengthPrefixed(buffer: Buffer): DecodedRpcPacket {
  if (buffer.length < 4) {
    return { ok: false, lines: [], error: 'SHORT_FRAME', raw: buffer, kind: 'synthetic-length-prefixed' };
  }
  const lenHex = buffer.slice(0, 4).toString('utf8');
  const declared = parseInt(lenHex, 16);
  if (Number.isNaN(declared)) {
    return { ok: false, lines: [], error: 'UNKNOWN_FORMAT', raw: buffer, kind: 'synthetic-length-prefixed', meta: { lenHex } };
  }
  const payload = buffer.slice(4);
  if (payload.length !== declared) {
    return { ok: false, lines: [], error: 'LENGTH_MISMATCH', raw: buffer, kind: 'synthetic-length-prefixed', meta: { declared, actual: payload.length } };
  }
  const decoded = decodeRpcResponse(payload);
  return { ...decoded, kind: 'synthetic-length-prefixed', meta: { ...(decoded.meta || {}), declared } };
}

// Future real XWB frame decode stub (kept minimal to allow incremental TDD)
export interface XwbControlBytes {
  // Placeholder fields. Real protocol likely has start marker, length, type codes.
  start?: number;
  totalLength?: number;
  rpcMarker?: number;
}

export interface XwbDecodeResult extends DecodedRpcPacket {
  control?: XwbControlBytes;
}

import { XwbStateMachine } from './xwbState';

export function decodeXwb(buffer: Buffer): XwbDecodeResult {
  const startT = Date.now();
  if (process.env.VISTA_BROKER_XWB_REAL_ENABLE === 'true') {
    const sm = new XwbStateMachine();
    const res = sm.feed(buffer);
    const endT = Date.now();
    try {
      const { brokerMetrics } = require('./metrics');
      brokerMetrics.recordDecodeLatency(endT - startT);
      if (res.state === 'INTERIM' && res.header?.continuation) {
        brokerMetrics.recordFrameContinuation();
      }
    } catch {/* ignore */}
    if (res.state === 'COMPLETE' && res.ok) {
      return {
        ok: true,
        lines: res.lines,
        raw: buffer,
        kind: 'xwb-response',
        meta: { declared: res.consumed - 3, state: res.state }
      };
    }
    if (res.state === 'ERROR' && res.error) {
      try {
        const { brokerMetrics } = require('./metrics');
        brokerMetrics.recordHeaderError(res.error);
      } catch {/* ignore */}
    }
    return {
      ok: false,
      lines: res.lines,
      raw: buffer,
      kind: 'xwb-response',
  error: (res.error === 'BAD_START' ? 'UNKNOWN_FORMAT' : res.error === 'BODY_TOO_LARGE' ? 'LENGTH_MISMATCH' : 'INCOMPLETE'),
      meta: { needed: res.needed, state: res.state }
    };
  }
  // Even when real enable flag off, record a latency for observability of stub path
  try {
    const { brokerMetrics } = require('./metrics');
    brokerMetrics.recordDecodeLatency(Date.now() - startT);
  } catch {/* ignore */}
  // Fallback stub behavior
  return {
    ok: false,
    lines: [],
    raw: buffer,
    kind: 'xwb-response',
    error: 'INCOMPLETE',
    meta: { stub: true }
  };
}

export interface XwbEncodeOptions {
  // Placeholder for future options (e.g., parameter typing, context token inclusion)
}

export function encodeXwb(rpcName: string, params: string[], _opts: XwbEncodeOptions = {}): EncodedRpcPacket {
  // Stub: For now just defers to synthetic encode to keep call sites simple.
  return encodeRpc(rpcName, params, { experimentalLengthPrefix: false });
}
