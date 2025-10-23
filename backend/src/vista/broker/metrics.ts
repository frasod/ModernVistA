/**
 * Broker Metrics (Lightweight In-Memory Aggregator)
 * ------------------------------------------------
 * Phase 3 scaffold for capturing RPC timing and counts prior to adopting
 * a full metrics stack (Prometheus, OpenTelemetry, etc.). Keeps dependencies
 * minimal and exposes a query API for tests.
 */

export interface RpcMetricSample {
  rpc: string;
  durationMs: number;
  ok: boolean;
  ts: number;
}

interface RpcAggregate {
  count: number;
  errors: number;
  totalMs: number;
  maxMs: number;
  p95Ms?: number; // computed lazily
  samples: number[]; // bounded by maxSamples
}

class BrokerMetrics {
  private aggregates: Map<string, RpcAggregate> = new Map();
  private signOnCount = 0;
  private signOnErrors = 0;
  private maxSamples = 50; // keep small to avoid memory growth
  // Frame / assembler metrics (experimental)
  private framesSeen = 0;
  private framesComplete = 0;
  private frameErrors = 0;
  private lastFrameErrorCode: string | null = null;
  private frameContinuations = 0;
  private frameMultipartExceeded = 0;
  private frameMultipartStarted = 0;
  private frameMultipartCompleted = 0;
  private frameMultipartChecksum: string | null = null;
  // Parsing metrics
  private parseIssues = 0;
  private parseIssueReasons: Record<string, number> = {};
  private parsePatients = 0;
  private parseDobNormalized = 0;
  private parseDobInvalid = 0;
  private parseGenderOmitted = 0;
  private parseNameSplitFailed = 0;
  private parseDroppedStrictDob = 0;
  // Header + redaction metrics (future real header parsing)
  private headerErrors = 0;
  private headerErrorReasons: Record<string, number> = {};
  private redactionApplied = 0;
  private redactionRuleCounts: Record<string, number> = {};
  // Decode latency histogram (micro-buckets in ms)
  private decodeBuckets = [1, 2, 5, 10, 20, 50, 100, 250, 500, 1000];
  private decodeBucketCounts: number[] = new Array(10).fill(0);
  private decodeLatencySum = 0;
  private decodeLatencyCount = 0;
  // End-to-end RPC latency histogram
  private rpcE2EBuckets = [5,10,20,50,100,200,500,1000,2000,5000];
  private rpcE2EBucketCounts: number[] = new Array(10).fill(0);
  private rpcE2ELatencySum = 0;
  private rpcE2ELatencyCount = 0;
  // RPC timeouts
  private rpcTimeouts = 0;
  // Session state gauge (tracked as last state string)
  private sessionState: string = 'idle';
  private sessionStateEnteredAt: number = Date.now();
  private sessionStateDwell: Record<string, number> = {};

  record(rpc: string, durationMs: number, ok: boolean) {
    const agg = this.aggregates.get(rpc) || { count: 0, errors: 0, totalMs: 0, maxMs: 0, samples: [] as number[] };
    agg.count += 1;
    if (!ok) agg.errors += 1;
    agg.totalMs += durationMs;
    if (durationMs > agg.maxMs) agg.maxMs = durationMs;
    agg.samples.push(durationMs);
    if (agg.samples.length > this.maxSamples) agg.samples.shift();
    this.aggregates.set(rpc, agg);
  }

  recordSignOn(ok: boolean, durationMs: number) {
    this.signOnCount += 1;
    if (!ok) this.signOnErrors += 1;
    this.record('__SIGNON__', durationMs, ok);
  }

  recordFrameChunk() {
    this.framesSeen += 1;
  }

  recordFrameComplete() {
    this.framesComplete += 1;
  }

  recordFrameError(code: string) {
    this.frameErrors += 1;
    this.lastFrameErrorCode = code;
  }

  recordFrameContinuation() {
    this.frameContinuations += 1;
  }

  recordFrameMultipartExceeded() {
    this.frameMultipartExceeded += 1;
  }

  recordFrameMultipartStart() { this.frameMultipartStarted += 1; }
  recordFrameMultipartComplete() { this.frameMultipartCompleted += 1; }
  setFrameMultipartChecksum(sum: string) { this.frameMultipartChecksum = sum; }

  recordParseIssues(count: number) {
    this.parseIssues += count;
  }

  recordParseIssueReason(reason: string) {
    this.parseIssueReasons[reason] = (this.parseIssueReasons[reason] || 0) + 1;
  }

  recordParsedPatients(count: number) {
    this.parsePatients += count;
  }

  recordParseDobNormalized(count: number) { this.parseDobNormalized += count; }
  recordParseDobInvalid(count: number) { this.parseDobInvalid += count; }
  recordParseGenderOmitted(count: number) { this.parseGenderOmitted += count; }
  recordParseNameSplitFailed(count: number) { this.parseNameSplitFailed += count; }
  recordParseDroppedStrictDob(count: number) { this.parseDroppedStrictDob += count; }

  recordHeaderError(reason: string) {
    this.headerErrors += 1;
    this.headerErrorReasons[reason] = (this.headerErrorReasons[reason] || 0) + 1;
  }

  recordRedaction(rules: string[]) {
    if (!rules.length) return;
    this.redactionApplied += 1;
    for (const r of rules) {
      this.redactionRuleCounts[r] = (this.redactionRuleCounts[r] || 0) + 1;
    }
  }

  recordDecodeLatency(ms: number) {
    this.decodeLatencySum += ms;
    this.decodeLatencyCount += 1;
    for (let i = 0; i < this.decodeBuckets.length; i++) {
      if (ms <= this.decodeBuckets[i]) {
        this.decodeBucketCounts[i] += 1;
        return;
      }
    }
    // overflow bucket (extend array for +Inf semantics)
    if (this.decodeBucketCounts.length === this.decodeBuckets.length) {
      this.decodeBucketCounts.push(0);
    }
    this.decodeBucketCounts[this.decodeBucketCounts.length - 1] += 1;
  }

  recordRpcE2ELatency(ms: number) {
    this.rpcE2ELatencySum += ms;
    this.rpcE2ELatencyCount += 1;
    for (let i = 0; i < this.rpcE2EBuckets.length; i++) {
      if (ms <= this.rpcE2EBuckets[i]) {
        this.rpcE2EBucketCounts[i] += 1;
        return;
      }
    }
    if (this.rpcE2EBucketCounts.length === this.rpcE2EBuckets.length) this.rpcE2EBucketCounts.push(0);
    this.rpcE2EBucketCounts[this.rpcE2EBucketCounts.length - 1] += 1;
  }

  recordRpcTimeout() { this.rpcTimeouts += 1; }
  setSessionState(state: string) { this.sessionState = state; }
  transitionSessionState(next: string) {
    const now = Date.now();
    const prev = this.sessionState;
    const delta = now - this.sessionStateEnteredAt;
    this.sessionStateDwell[prev] = (this.sessionStateDwell[prev] || 0) + delta;
    this.sessionState = next;
    this.sessionStateEnteredAt = now;
  }

  snapshot() {
    const out: any = {};
    for (const [rpc, agg] of this.aggregates.entries()) {
      const avg = agg.totalMs / agg.count;
      // compute p95 from samples
      const sorted = [...agg.samples].sort((a,b) => a - b);
      const idx = Math.floor(sorted.length * 0.95) - 1;
      const p95 = sorted[Math.max(0, idx)];
      out[rpc] = {
        count: agg.count,
        errors: agg.errors,
        avgMs: Number(avg.toFixed(2)),
        maxMs: agg.maxMs,
        p95Ms: p95
      };
    }
    return {
      rpc: out,
      mode: process.env.VISTA_BROKER_EXPERIMENTAL === 'true' ? 'experimental' : 'mock',
      signOn: {
        attempts: this.signOnCount,
        errors: this.signOnErrors
      },
      frames: {
        seen: this.framesSeen,
        complete: this.framesComplete,
        errors: this.frameErrors,
        lastError: this.lastFrameErrorCode,
        continuations: this.frameContinuations,
        multipartExceeded: this.frameMultipartExceeded,
        multipartStarted: this.frameMultipartStarted,
        multipartCompleted: this.frameMultipartCompleted,
        multipartChecksum: this.frameMultipartChecksum
      },
      parsing: {
        issues: this.parseIssues,
        issueReasons: this.parseIssueReasons,
        patients: this.parsePatients,
        dobNormalized: this.parseDobNormalized,
        dobInvalid: this.parseDobInvalid,
        genderOmitted: this.parseGenderOmitted
        , nameSplitFailed: this.parseNameSplitFailed
        , droppedForStrictDob: this.parseDroppedStrictDob
      },
      header: {
        errors: this.headerErrors,
        reasons: this.headerErrorReasons
      },
      redaction: {
        applied: this.redactionApplied,
        rules: this.redactionRuleCounts
      },
      decodeLatency: {
        buckets: this.decodeBuckets,
        counts: this.decodeBucketCounts,
        sum: this.decodeLatencySum,
        count: this.decodeLatencyCount
      },
      rpcE2E: {
        buckets: this.rpcE2EBuckets,
        counts: this.rpcE2EBucketCounts,
        sum: this.rpcE2ELatencySum,
        count: this.rpcE2ELatencyCount
      },
      rpcTimeouts: this.rpcTimeouts,
      sessionState: this.sessionState
      , sessionStateDwellMs: this.sessionStateDwell
    };
  }

  reset() {
    this.aggregates.clear();
    this.signOnCount = 0;
    this.signOnErrors = 0;
    this.framesSeen = 0;
    this.framesComplete = 0;
    this.frameErrors = 0;
    this.lastFrameErrorCode = null;
  this.frameContinuations = 0;
  this.frameMultipartExceeded = 0;
  this.frameMultipartStarted = 0;
  this.frameMultipartCompleted = 0;
  this.frameMultipartChecksum = null;
  this.parseIssues = 0;
  this.parseIssueReasons = {};
  this.parsePatients = 0;
    this.parseDobNormalized = 0;
    this.parseDobInvalid = 0;
    this.parseGenderOmitted = 0;
  this.parseNameSplitFailed = 0;
  this.parseDroppedStrictDob = 0;
    this.headerErrors = 0;
    this.headerErrorReasons = {};
    this.redactionApplied = 0;
    this.redactionRuleCounts = {};
    this.decodeBucketCounts = new Array(10).fill(0);
    this.decodeLatencySum = 0;
    this.decodeLatencyCount = 0;
    this.rpcE2EBucketCounts = new Array(10).fill(0);
    this.rpcE2ELatencySum = 0;
    this.rpcE2ELatencyCount = 0;
    this.rpcTimeouts = 0;
    this.sessionState = 'idle';
    this.sessionStateEnteredAt = Date.now();
    this.sessionStateDwell = {};
  }
}

export const brokerMetrics = new BrokerMetrics();
