/**
 * Broker Capture Utility
 * ----------------------
 * Captures initial raw bytes from the VistA Broker socket (e.g., greeting
 * banner) for analysis. Controlled by feature flag to avoid unintended
 * data retention. Does NOT persist to disk; in-memory only.
 */

interface CaptureState {
  greeting?: Buffer;
  timestamp?: number;
}

interface FrameChunk {
  index: number;
  length: number;
  hex: string;
  asciiPreview: string;
  ts: number;
  truncated?: boolean;
}

class BrokerCapture {
  private state: CaptureState = {};
  private maxBytes = 512; // safeguard
  private enabled = process.env.VISTA_BROKER_CAPTURE === 'true';
  // Extended frame capture (optional)
  private frameCaptureEnabled = process.env.VISTA_BROKER_FRAME_CAPTURE === 'true';
  private frameChunks: FrameChunk[] = [];
  private frameChunkLimit = 25; // store last N chunks
  private frameChunkMaxBytes = 256; // per-chunk cap
  private totalBytes = 0;
  private totalBytesCap = 4096; // overall safety cap
  private droppedChunks = 0;
  private seq = 0;
  // Raw file capture
  private rawEnabled = process.env.VISTA_BROKER_CAPTURE_RAW === 'true';
  private rawDir = process.env.VISTA_BROKER_CAPTURE_DIR || './captures';
  private fs = require('fs');
  private path = require('path');
  private rawInitialized = false;
  // Redaction configuration
  private redactionEnabled = process.env.VISTA_BROKER_CAPTURE_REDACT === 'true';
  private redactionMaxPreview = 200;
  private redactionRules: { name: string; pattern: RegExp; replace: string }[] = [
    { name: 'SSN', pattern: /(?!\b)\d{3}-?\d{2}-?\d{4}\b/g, replace: '[SSN]' },
    { name: 'DOB', pattern: /\b(19|20)\d{2}[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/g, replace: '[DOB]' },
    { name: 'NAME', pattern: /\b([A-Z][a-z]+,\s?[A-Z][a-z]+)\b/g, replace: '[NAME]' }
  ];
  private extraPatternsLoaded = false;

  private redactBuffer(buf: Buffer): { redacted: Buffer; applied: string[]; asciiPreview: string } {
    if (!this.redactionEnabled) {
      try { const { brokerMetrics } = require('./metrics'); brokerMetrics.recordRedaction([]); } catch {/* ignore */}
      return { redacted: buf, applied: [], asciiPreview: buf.toString('ascii').replace(/[^\x20-\x7E]/g, '.') };
    }
    if (!this.extraPatternsLoaded) {
      const extra = process.env.VISTA_BROKER_REDACT_EXTRA;
      if (extra) {
        extra.split(';').map(s => s.trim()).filter(Boolean).forEach((p, i) => {
          try {
            const rx = new RegExp(p, 'g');
            this.redactionRules.push({ name: `EXTRA_${i}`, pattern: rx, replace: '[REDACT]' });
          } catch {/* invalid pattern ignore */}
        });
      }
      this.extraPatternsLoaded = true;
    }
    let text = buf.toString('utf8');
    const applied: string[] = [];
    for (const rule of this.redactionRules) {
      if (rule.pattern.test(text)) {
        text = text.replace(rule.pattern, rule.replace);
        applied.push(rule.name);
      }
    }
    // Truncate preview to avoid accidental large PHI retention
    const truncated = text.length > this.redactionMaxPreview ? text.slice(0, this.redactionMaxPreview) + '…' : text;
    return {
      redacted: Buffer.from(text, 'utf8'),
      applied,
      asciiPreview: truncated.replace(/[^\x20-\x7E]/g, '.')
    };
  }

  private ensureRawDir() {
    if (!this.rawEnabled || this.rawInitialized) return;
    try {
      if (!this.fs.existsSync(this.rawDir)) {
        this.fs.mkdirSync(this.rawDir, { recursive: true });
      }
      this.rawInitialized = true;
    } catch {/* ignore */}
  }

  private writeRaw(direction: 'send' | 'recv', buf: Buffer, meta: Record<string, any> = {}) {
    if (!this.rawEnabled) return;
    this.ensureRawDir();
    const ts = Date.now();
    const baseName = `${ts}-${direction}-${this.seq}.json`;
    const { redacted, applied, asciiPreview } = this.redactBuffer(buf);
    if (applied.length) {
      try {
        const { brokerMetrics } = require('./metrics');
        brokerMetrics.recordRedaction(applied);
      } catch {/* ignore metrics errors */}
    }
    const payload = {
      ts,
      direction,
      length: buf.length,
      redaction: { enabled: this.redactionEnabled, applied },
      hex: redacted.toString('hex'),
      asciiPreview,
      meta
    };
    try {
      this.fs.writeFileSync(this.path.join(this.rawDir, baseName), JSON.stringify(payload, null, 2));
    } catch {/* ignore */}
  }

  recordGreeting(buf: Buffer) {
    if (!this.enabled) return;
    if (this.state.greeting) return; // capture only first
    this.state = {
      greeting: buf.slice(0, this.maxBytes),
      timestamp: Date.now()
    };
  }

  recordFrameChunk(buf: Buffer) {
    if (!this.frameCaptureEnabled) return;
    if (this.totalBytes >= this.totalBytesCap) {
      this.droppedChunks += 1;
      return;
    }
    const slice = buf.length > this.frameChunkMaxBytes ? buf.slice(0, this.frameChunkMaxBytes) : buf;
    const truncated = slice.length !== buf.length;
    const chunk: FrameChunk = {
      index: this.seq++,
      length: slice.length,
      hex: slice.toString('hex'),
      asciiPreview: slice.toString('ascii').replace(/[^\x20-\x7E]/g, '.'),
      ts: Date.now(),
      truncated
    };
    this.frameChunks.push(chunk);
    this.totalBytes += slice.length;
    if (this.frameChunks.length > this.frameChunkLimit) this.frameChunks.shift();
  }

  recordSend(buf: Buffer, meta: Record<string, any> = {}) {
    this.writeRaw('send', buf, meta);
  }

  recordRecv(buf: Buffer, meta: Record<string, any> = {}) {
    this.writeRaw('recv', buf, meta);
  }

  snapshot() {
    const base = { greetingEnabled: this.enabled, frameCaptureEnabled: this.frameCaptureEnabled } as any;
    if (!this.enabled) base.greeting = { enabled: false };
    else if (!this.state.greeting) base.greeting = { enabled: true, captured: false };
    else {
      const g = this.state.greeting!;
      base.greeting = {
        enabled: true,
        captured: true,
        length: g.length,
        hex: g.toString('hex'),
        base64: g.toString('base64'),
        asciiPreview: g.toString('ascii').replace(/[^\x20-\x7E]/g, '.'),
        timestamp: this.state.timestamp
      };
    }
    if (this.frameCaptureEnabled) {
      base.frames = {
        count: this.frameChunks.length,
        totalBytes: this.totalBytes,
        dropped: this.droppedChunks,
        cap: this.totalBytesCap,
        chunks: this.frameChunks
      };
    }
    base.redaction = { enabled: this.redactionEnabled, rules: this.redactionRules.map(r => r.name) };
    return base;
  }

  reset() { 
    this.state = {}; 
    this.frameChunks = []; 
    this.totalBytes = 0; 
    this.droppedChunks = 0; 
    this.seq = 0; 
  }
}

export const brokerCapture = new BrokerCapture();
