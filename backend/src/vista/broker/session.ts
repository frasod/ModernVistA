import { config } from '../../config/config';
import { logger } from '../../config/logger';
import { sanitizeForLog, encodeRpc, decodeRpcResponse, decodeLengthPrefixed } from './framing';
import { parseOrwptList } from '../parser/orwpt';
import { createDefaultCodec, FrameCodec } from './codec';
import { brokerCapture } from './capture';
import { brokerMetrics } from './metrics';
import { SocketTransport, MockTransport, BrokerTransport } from './transport';

/**
 * VistaBrokerSession (scaffold)
 * This will orchestrate sign-on, context setting, and RPC invocation.
 * For now, it only ensures a raw socket is connected and returns mock responses.
 */
type SessionState = 'idle' | 'connecting' | 'signing_on' | 'context' | 'ready' | 'closed' | 'error';

export class VistaBrokerSession {
  private state: SessionState = 'idle';
  private authenticated = false;
  private contextSet = false;
  private lastUsed = 0;
  private idleMs = parseInt(process.env.VISTA_BROKER_IDLE_MS || '300000', 10);
  private connectTimeoutMs = parseInt(process.env.VISTA_BROKER_CONNECT_TIMEOUT || '8000', 10);
  private rpcTimeoutMs = parseInt(process.env.VISTA_BROKER_RPC_TIMEOUT || '10000', 10);
  private transport: BrokerTransport;
  private inFlight: Promise<void> | null = null;
  private experimental = process.env.VISTA_BROKER_EXPERIMENTAL !== 'false'; // Default to true
  private codec: FrameCodec = createDefaultCodec();
  constructor() {
    // Choose transport: experimental -> real socket, else mock (only exercised if flag later changed at runtime)
    this.transport = this.experimental ? new SocketTransport() : new MockTransport();
    // initialize session state metric
  try { brokerMetrics.transitionSessionState(this.state); } catch { /* ignore */ }
  }

  /**
   * performSignOn - placeholder sequence for Phase 2
   * Real flow (future):
   *  1. XUS SIGNON SETUP (no params) -> returns greeting & needAVCode flag
   *  2. XUS AV CODE (access^verify) -> returns DUZ / greeting / production flag
   */
  private async performSignOn(): Promise<void> {
    if (this.authenticated) return;
  this.state = 'signing_on';
  try { brokerMetrics.transitionSessionState(this.state); } catch { /* ignore */ }
    const start = Date.now();
    try {
      const access = process.env.VISTA_ACCESS_CODE || 'ACCESS';
      const verify = process.env.VISTA_VERIFY_CODE || 'VERIFY';
      const phase3 = process.env.VISTA_BROKER_PHASE3_ENABLE !== 'false'; // Default to true
      logger.info('[VistaBrokerSession] sign-on start', { phase3 });
      if (phase3) {
  const setupFrame = this.codec.encode('XUS SIGNON SETUP', []);
        logger.debug('[VistaBrokerSession] frame->SIGNON_SETUP', { bytes: setupFrame.lengthPrefixed?.length });
        if (setupFrame.lengthPrefixed) {
          brokerCapture.recordSend(setupFrame.lengthPrefixed, { phase: 'signon', rpc: 'XUS SIGNON SETUP' });
          await this.transport.send(setupFrame.lengthPrefixed);
          const buf = await this.transport.read(this.rpcTimeoutMs);
          if (buf) {
            brokerCapture.recordRecv(buf, { phase: 'signon', rpc: 'XUS SIGNON SETUP' });
            const decoded = decodeLengthPrefixed(buf);
            logger.debug('[VistaBrokerSession] SIGNON_SETUP response', { ok: decoded.ok, lines: sanitizeForLog(decoded.lines) });
          }
        }
  const avFrame = this.codec.encode('XUS AV CODE', [`${access}^${verify}`]);
        logger.debug('[VistaBrokerSession] frame->AV_CODE', { bytes: avFrame.lengthPrefixed?.length });
        if (avFrame.lengthPrefixed) {
          brokerCapture.recordSend(avFrame.lengthPrefixed, { phase: 'signon', rpc: 'XUS AV CODE' });
          await this.transport.send(avFrame.lengthPrefixed);
          const buf = await this.transport.read(this.rpcTimeoutMs);
            if (buf) {
              brokerCapture.recordRecv(buf, { phase: 'signon', rpc: 'XUS AV CODE' });
              const decoded = decodeLengthPrefixed(buf);
              logger.debug('[VistaBrokerSession] AV_CODE response', { ok: decoded.ok, lines: sanitizeForLog(decoded.lines) });
            }
        }
      }
      this.authenticated = true;
      brokerMetrics.recordSignOn(true, Date.now() - start);
      try { brokerMetrics.setSessionState(this.state); } catch { /* ignore */ }
      logger.info('[VistaBrokerSession] sign-on success');
    } catch (err:any) {
      brokerMetrics.recordSignOn(false, 0);
  this.state = 'error';
  try { brokerMetrics.transitionSessionState(this.state); } catch { /* ignore */ }
      logger.error('[VistaBrokerSession] sign-on failed', { error: err.message });
      throw err;
    }
  }

  /**
   * setContext - placeholder for XWB SET CONTEXT. In real implementation,
   * we will call the RPC that establishes the given context (option name)
   * so subsequent RPCs are authorized.
   */
  private async setContext(): Promise<void> {
    if (this.contextSet) return;
    if (!config.vista.context) {
      logger.warn('[VistaBrokerSession] no VISTA_CONTEXT provided; skipping context set');
      this.contextSet = true;
      return;
    }
    logger.info('[VistaBrokerSession] set context', { context: config.vista.context });
    const phase3 = process.env.VISTA_BROKER_PHASE3_ENABLE === 'true';
    if (phase3) {
  const ctxFrame = this.codec.encode('XWB SET CONTEXT', [config.vista.context]);
      logger.debug('[VistaBrokerSession] frame->SET_CONTEXT', { bytes: ctxFrame.lengthPrefixed?.length });
      if (ctxFrame.lengthPrefixed) {
        brokerCapture.recordSend(ctxFrame.lengthPrefixed, { phase: 'context', rpc: 'XWB SET CONTEXT' });
        await this.transport.send(ctxFrame.lengthPrefixed);
        const buf = await this.transport.read(this.rpcTimeoutMs);
        if (buf) {
          brokerCapture.recordRecv(buf, { phase: 'context', rpc: 'XWB SET CONTEXT' });
          const decoded = decodeLengthPrefixed(buf);
          logger.debug('[VistaBrokerSession] SET_CONTEXT response', { ok: decoded.ok, lines: sanitizeForLog(decoded.lines) });
        }
      }
    }
    this.contextSet = true;
  }

  private async beginLifecycle(): Promise<void> {
    if (this.state === 'ready') return;
    if (this.state === 'closed') throw new Error('BROKER_CLOSED');
    if (this.inFlight) return this.inFlight;
    this.inFlight = this._lifecycle();
    try { await this.inFlight; } finally { this.inFlight = null; }
  }

  private async _lifecycle(): Promise<void> {
    const now = Date.now();
    if (this.state === 'ready' && (now - this.lastUsed) < this.idleMs) {
      this.lastUsed = now; return; }
  this.state = 'connecting';
  try { brokerMetrics.transitionSessionState(this.state); } catch { /* ignore */ }
    try {
      await this.transport.connect();
      await this.performSignOn();
  this.state = 'context';
  try { brokerMetrics.transitionSessionState(this.state); } catch { /* ignore */ }
      await this.setContext();
  this.state = 'ready';
  try { brokerMetrics.transitionSessionState(this.state); } catch { /* ignore */ }
      this.lastUsed = Date.now();
      logger.info('[VistaBrokerSession] session ready', { context: config.vista.context });
    } catch (e:any) {
  this.state = 'error';
  try { brokerMetrics.transitionSessionState(this.state); } catch { /* ignore */ }
      throw e;
    }
  }

  async ensure(): Promise<void> { await this.beginLifecycle(); }

  destroy(): void {
    try { (this.transport as any).destroy?.(); } catch { /* ignore */ }
  this.state = 'closed';
  try { brokerMetrics.transitionSessionState(this.state); } catch { /* ignore */ }
  }

  /**
   * Placeholder RPC call. Returns mock ORWPT LIST style patient entries for now.
   */
  async call(rpcName: string, params: string[] = []): Promise<{ ok: boolean; lines: string[]; mock: boolean; structured?: any; }> {
  if (!this.experimental) {
      // Legacy mock path (no transport involvement)
      if (rpcName === 'ORWPT LIST' || rpcName === 'ORWPT LIST ALL') {
        const filter = (params[0] || '').toLowerCase();
        const sample = [
          '100^DOE,JOHN^1234^M^01/12/1965',
          '101^DOE,JANE^2345^F^07/03/1972',
          '102^ALVAREZ,CARLOS^3456^M^11/22/1959',
          '103^JOHNSON,MARY^4567^F^05/09/1980'
        ];
        const lines = filter ? sample.filter(l => l.toLowerCase().includes(filter)) : sample;
        const parsed = parseOrwptList(lines);
        brokerMetrics.recordParsedPatients(parsed.patients.length);
        if (parsed.stats) {
          brokerMetrics.recordParseDobNormalized(parsed.stats.dobNormalized);
          brokerMetrics.recordParseDobInvalid(parsed.stats.dobInvalid);
          brokerMetrics.recordParseGenderOmitted(parsed.stats.genderOmitted);
          brokerMetrics.recordParseNameSplitFailed(parsed.stats.nameSplitFailed);
          brokerMetrics.recordParseDroppedStrictDob(parsed.stats.droppedForStrictDob);
        }
        if (parsed.issues.length) {
          brokerMetrics.recordParseIssues(parsed.issues.length);
          for (const issue of parsed.issues) {
            brokerMetrics.recordParseIssueReason(issue.reason || 'unknown');
          }
        }
        return { ok: true, lines, mock: true, structured: { patients: parsed.patients, issues: parsed.issues } };
      }
      return { ok: false, lines: ['RPC_NOT_IMPLEMENTED'], mock: true };
    }

    await this.ensure();
  const start = Date.now();
    // For now still mock response but exercise framing + metrics.
  const encoded = this.codec.encode(rpcName, params);
    logger.debug('[VistaBrokerSession] encoded RPC', { rpc: rpcName, debug: encoded.debug, lpBytes: encoded.lengthPrefixed?.length });
    // Attempt to send via transport (still synthetic frame). If send/read fails, fallback to mock logic.
    let lines: string[] = [];
    let networkAttempted = false;
    try {
      if (encoded.lengthPrefixed) {
        brokerCapture.recordSend(encoded.lengthPrefixed, { phase: 'rpc', rpc: rpcName });
        await this.transport.send(encoded.lengthPrefixed);
      } else {
        brokerCapture.recordSend(encoded.raw, { phase: 'rpc', rpc: rpcName });
        await this.transport.send(encoded.raw);
      }
      networkAttempted = true;
      const buf = await this.transport.read(this.rpcTimeoutMs);
      if (!buf) {
        // timeout scenario
        try { brokerMetrics.recordRpcTimeout(); } catch { /* ignore */ }
      }
      if (buf) {
        brokerCapture.recordRecv(buf, { phase: 'rpc', rpc: rpcName });
  const decodedCore = this.codec.decode(buf, !!encoded.lengthPrefixed);
  const decoded = { ok: decodedCore.ok, lines: decodedCore.lines };
        if (decoded.ok && decoded.lines.length) {
          lines = decoded.lines;
        }
      }
    } catch (e:any) {
      logger.warn('[VistaBrokerSession] transport send/read failed - fallback to mock', { rpc: rpcName, error: e.message });
    }
    // Fallback / enrichment logic (ORWPT LIST mock if lines empty or not network attempted)
    if (!lines.length && (rpcName === 'ORWPT LIST' || rpcName === 'ORWPT LIST ALL')) {
      const filter = (params[0] || '').toLowerCase();
      const sample = [
        '100^DOE,JOHN^1234^M^01/12/1965',
        '101^DOE,JANE^2345^F^07/03/1972',
        '102^ALVAREZ,CARLOS^3456^M^11/22/1959',
        '103^JOHNSON,MARY^4567^F^05/09/1980'
      ];
      lines = filter ? sample.filter(l => l.toLowerCase().includes(filter)) : sample;
    }
    if (!lines.length) {
      // generic placeholder result
      lines = ['RESULT'];
    }
    const duration = Date.now() - start;
    brokerMetrics.record(rpcName, duration, true);
    try { brokerMetrics.recordRpcE2ELatency(duration); } catch { /* ignore */ }
    logger.debug('[VistaBrokerSession] rpc complete', { rpc: rpcName, durationMs: duration, lines: sanitizeForLog(lines) });
    let structured: any = undefined;
    if (rpcName === 'ORWPT LIST' || rpcName === 'ORWPT LIST ALL') {
      const parsed = parseOrwptList(lines);
      brokerMetrics.recordParsedPatients(parsed.patients.length);
      if (parsed.stats) {
        brokerMetrics.recordParseDobNormalized(parsed.stats.dobNormalized);
        brokerMetrics.recordParseDobInvalid(parsed.stats.dobInvalid);
        brokerMetrics.recordParseGenderOmitted(parsed.stats.genderOmitted);
        brokerMetrics.recordParseNameSplitFailed(parsed.stats.nameSplitFailed);
        brokerMetrics.recordParseDroppedStrictDob(parsed.stats.droppedForStrictDob);
      }
      if (parsed.issues.length) {
        brokerMetrics.recordParseIssues(parsed.issues.length);
        for (const issue of parsed.issues) {
          brokerMetrics.recordParseIssueReason(issue.reason || 'unknown');
        }
      }
      structured = { patients: parsed.patients, issues: parsed.issues };
    }
    return { ok: true, lines, mock: !networkAttempted, structured };
  }
}

export const vistaBrokerSession = new VistaBrokerSession();
