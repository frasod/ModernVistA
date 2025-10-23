import net from 'net';
import { logger } from '../../config/logger';
import { config } from '../../config/config';
import { brokerCapture } from './capture';
import { createSyntheticAssembler, FrameAssembler } from './assembler';
import { brokerMetrics } from './metrics';

/**
 * Low-level VistA RPC Broker connection (scaffold)
 * Handles socket lifecycle, simple write/read with timeouts.
 * Actual framing & protocol will be implemented incrementally.
 */
export class VistaBrokerConnection {
  private socket: net.Socket | null = null;
  private host: string;
  private port: number;
  private timeoutMs: number;
  private assembler: FrameAssembler | null = null; // for experimental framing

  constructor(host = config.vista.host, port = config.vista.port, timeoutMs = 8000) {
    this.host = host;
    this.port = port;
    this.timeoutMs = timeoutMs;
  }

  async connect(): Promise<void> {
    if (this.socket && !this.socket.destroyed) return;
    this.socket = new net.Socket();
    // Initialize assembler if synthetic length-prefix experimentation is enabled
    if (process.env.VISTA_BROKER_PHASE3_ENABLE === 'true') {
      this.assembler = createSyntheticAssembler();
    }

    await new Promise<void>((resolve, reject) => {
      let done = false;
      const finish = (err?: Error) => {
        if (done) return;
        done = true;
        if (err) reject(err); else resolve();
      };

      this.socket!.setTimeout(this.timeoutMs);
      this.socket!
        .once('connect', () => finish())
        .once('error', (e) => finish(e))
        .once('timeout', () => finish(new Error('BROKER_CONNECT_TIMEOUT')))
        .connect(this.port, this.host);
    });

    // Capture first inbound data chunk (greeting) if enabled
    if (process.env.VISTA_BROKER_CAPTURE === 'true') {
      const onFirstData = (buf: Buffer) => {
        try { brokerCapture.recordGreeting(buf); } catch {/* ignore */}
        this.socket?.off('data', onFirstData); // only first chunk
      };
      this.socket.on('data', onFirstData);
    }

    // If assembler active, accumulate frames
    if (this.assembler) {
      this.socket.on('data', (buf: Buffer) => {
        try {
          brokerMetrics.recordFrameChunk();
          const res = this.assembler?.push(buf);
            if (res?.packet) brokerMetrics.recordFrameComplete();
            if (res?.error) brokerMetrics.recordFrameError(res.error);
        } catch {/* swallow; higher layer will read */}
      });
    }

    // Extended frame capture (raw inbound chunks) independent of assembler
    if (process.env.VISTA_BROKER_FRAME_CAPTURE === 'true') {
      this.socket.on('data', (buf: Buffer) => {
        try { brokerCapture.recordFrameChunk(buf); } catch {/* ignore */}
      });
    }

    logger.info('[VistaBroker] Connected', { host: this.host, port: this.port, capture: process.env.VISTA_BROKER_CAPTURE === 'true' });
  }

  /**
   * Placeholder send: in the real implementation we'll frame RPC packets.
   */
  async sendRaw(data: string | Buffer): Promise<void> {
    if (!this.socket) throw new Error('SOCKET_NOT_CONNECTED');
    await new Promise<void>((resolve, reject) => {
      this.socket!.write(data, (err) => err ? reject(err) : resolve());
    });
  }

  /**
   * Simple read until timeout or newline (temporary). Real implementation
   * will parse the broker response framing.
   */
  async readRaw(maxBytes = 4096): Promise<Buffer> {
    if (!this.socket) throw new Error('SOCKET_NOT_CONNECTED');
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const onData = (buf: Buffer) => {
        chunks.push(buf);
        if (Buffer.concat(chunks).length >= maxBytes) {
          cleanup();
          resolve(Buffer.concat(chunks));
        }
      };
      const onError = (e: Error) => { cleanup(); reject(e); };
      const onTimeout = () => { cleanup(); reject(new Error('BROKER_READ_TIMEOUT')); };

      const cleanup = () => {
        this.socket!.off('data', onData);
        this.socket!.off('error', onError);
        this.socket!.off('timeout', onTimeout);
      };

      this.socket!.once('timeout', onTimeout);
      this.socket!.once('error', onError);
      this.socket!.on('data', onData);
    });
  }

  destroy(): void {
    if (this.socket) {
      try { this.socket.destroy(); } catch {/* ignore */}
      this.socket = null;
      logger.info('[VistaBroker] Disconnected');
    }
    this.assembler = null;
  }

  /**
   * readFrame (experimental) - attempts to retrieve a fully assembled synthetic frame.
   * Returns undefined if no complete frame currently buffered. Non-blocking.
   */
  readFrame(): Buffer | undefined {
    if (!this.assembler) return undefined;
    // We re-run push with empty buffer to trigger extraction if a frame is already complete.
    const res = this.assembler.push(Buffer.alloc(0) as unknown as Buffer) || undefined;
    if (res?.packet?.raw) return res.packet.raw; // synthetic decode already performed inside
    return undefined;
  }
}

export const vistaBrokerConnection = new VistaBrokerConnection();
