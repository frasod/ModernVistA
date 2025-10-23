import net from 'net';
import { logger } from '../../config/logger';
import { config } from '../../config/config';

export interface BrokerTransportOptions {
  host?: string;
  port?: number;
  connectTimeoutMs?: number;
  rpcTimeoutMs?: number;
}

export interface BrokerTransport {
  connect(): Promise<void>;
  send(frame: Buffer): Promise<void>;
  read(timeoutMs?: number): Promise<Buffer | null>; // null on timeout
  destroy(): void;
  isConnected(): boolean;
}

export class SocketTransport implements BrokerTransport {
  private socket: net.Socket | null = null;
  private host: string;
  private port: number;
  private connectTimeoutMs: number;

  constructor(opts: BrokerTransportOptions = {}) {
    this.host = opts.host || config.vista.host;
    this.port = opts.port || config.vista.port;
    this.connectTimeoutMs = opts.connectTimeoutMs || parseInt(process.env.VISTA_BROKER_CONNECT_TIMEOUT || '8000', 10);
  }

  isConnected(): boolean {
    return !!this.socket && !this.socket.destroyed;
  }

  async connect(): Promise<void> {
    if (this.isConnected()) return;
    this.socket = new net.Socket();
    const timeoutMs = this.connectTimeoutMs;
    await new Promise<void>((resolve, reject) => {
      let finished = false;
      const finalize = (err?: Error) => { if (finished) return; finished = true; err ? reject(err) : resolve(); };
      this.socket!.setTimeout(timeoutMs);
      this.socket!
        .once('connect', () => finalize())
        .once('error', (e) => finalize(e))
        .once('timeout', () => finalize(new Error('BROKER_CONNECT_TIMEOUT')))
        .connect(this.port, this.host);
    });
    logger.info('[BrokerTransport] socket connected', { host: this.host, port: this.port });
  }

  async send(frame: Buffer): Promise<void> {
    if (!this.socket) throw new Error('BROKER_NOT_CONNECTED');
    await new Promise<void>((resolve, reject) => {
      this.socket!.write(frame, (err) => err ? reject(err) : resolve());
    });
  }

  async read(timeoutMs: number = parseInt(process.env.VISTA_BROKER_RPC_TIMEOUT || '10000', 10)): Promise<Buffer | null> {
    if (!this.socket) throw new Error('BROKER_NOT_CONNECTED');
    return new Promise<Buffer | null>((resolve, reject) => {
      const sock = this.socket!;
      let timer: NodeJS.Timeout | null = null;
      const onData = (buf: Buffer) => { cleanup(); resolve(buf); };
      const onError = (e: Error) => { cleanup(); reject(e); };
      const onTimeout = () => { cleanup(); resolve(null); };
      const cleanup = () => {
        sock.off('data', onData);
        sock.off('error', onError);
        if (timer) clearTimeout(timer);
      };
      sock.once('data', onData);
      sock.once('error', onError);
      timer = setTimeout(onTimeout, timeoutMs).unref();
    });
  }

  destroy(): void {
    if (this.socket) {
      try { this.socket.destroy(); } catch {/* ignore */}
      this.socket = null;
      logger.info('[BrokerTransport] socket destroyed');
    }
  }
}

/**
 * Mock loopback transport for tests / offline dev.
 * Simulates latency + canned responses, no real network.
 */
export class MockTransport implements BrokerTransport {
  private latencyMs: number;
  private connected = false;
  private canned: Record<string, string[]> = {
    'XUS SIGNON SETUP': ['#SIGNON_SETUP', 'END'],
    'XUS AV CODE': ['#AV_OK', 'END'],
    'XWB SET CONTEXT': ['1', 'END'],
    'ORWPT LIST ALL': [
      '100^DOE,JOHN^1234^M^01/12/1965',
      '101^DOE,JANE^2345^F^07/03/1972',
      '102^ALVAREZ,CARLOS^3456^M^11/22/1959',
      '103^JOHNSON,MARY^4567^F^05/09/1980',
      'END'
    ]
  };
  private queue: Buffer[] = [];
  private pendingRead: ((buf: Buffer | null) => void) | null = null;

  constructor(latencyMs = 8) { this.latencyMs = latencyMs; }
  isConnected(): boolean { return this.connected; }
  async connect(): Promise<void> { this.connected = true; }
  async send(frame: Buffer): Promise<void> {
    // Parse synthetic frame header to detect RPC name
    const text = frame.toString('utf8');
    const match = text.match(/^XWB_RPC:(.*)$/m);
    const rpc = match ? match[1].trim() : 'UNKNOWN';
    const params: string[] = [];
    // Extract simple filter for ORWPT LIST ALL (P0=filter)
    const p0 = text.match(/^P0=(.*)$/m);
    if (p0) params[0] = p0[1];
    const lines = this.respond(rpc, params[0]);
    const payload = Buffer.from(lines.join('\n') + '\n', 'utf8');
    const lengthHex = payload.length.toString(16).padStart(4, '0');
    const lengthPrefixed = Buffer.concat([Buffer.from(lengthHex, 'utf8'), payload]);
    // Simulate latency then enqueue
    await new Promise(r => setTimeout(r, this.latencyMs));
    if (this.pendingRead) {
      const pr = this.pendingRead; this.pendingRead = null; pr(lengthPrefixed);
    } else {
      this.queue.push(lengthPrefixed);
    }
  }
  async read(timeoutMs: number = 1000): Promise<Buffer | null> {
    if (this.queue.length) return this.queue.shift()!;
    return new Promise<Buffer | null>((resolve) => {
      this.pendingRead = resolve;
      const t = setTimeout(() => {
        if (this.pendingRead) { this.pendingRead = null; resolve(null); }
      }, timeoutMs);
      (t as any).unref?.();
    });
  }
  destroy(): void { this.connected = false; this.queue = []; this.pendingRead = null; }

  respond(rpc: string, filter?: string): string[] {
    if (rpc === 'ORWPT LIST ALL' && filter) {
      return (this.canned[rpc] || []).filter(l => l.toLowerCase().includes(filter.toLowerCase()));
    }
    return this.canned[rpc] || ['#MOCK', 'END'];
  }
}
