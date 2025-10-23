import net from 'net';
import { config } from '../config/config';
import { logger } from '../config/logger';
import { vistaBrokerSession } from './broker/session';

/**
 * Minimal VistA RPC Client (POC)
 *
 * For now this provides a stub interface. It can be extended to implement
 * the full broker/RPC protocol used by CPRS. We keep it intentionally lean.
 */
export interface VistaRPCResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  raw?: string;
  timingMs: number;
}

export class VistaRPCClient {
  private host: string;
  private port: number;

  constructor(host = config.vista.host, port = config.vista.port) {
    this.host = host;
    this.port = port;
  }

  /**
   * Test connectivity to VistA RPC port with timeout handling.
   */
  async ping(timeoutMs: number = 3000): Promise<boolean> {
    return new Promise(resolve => {
      const socket = new net.Socket();
      let finished = false;
      
      const cleanup = () => {
        if (!finished) {
          finished = true;
          socket.destroy();
        }
      };

      // Set connection timeout
      socket.setTimeout(timeoutMs);
      
      socket
        .once('connect', () => {
          cleanup();
          resolve(true);
        })
        .once('error', (err) => {
          logger.error('VistA RPC connection error:', { host: this.host, port: this.port, error: err.message });
          cleanup();
          resolve(false);
        })
        .once('timeout', () => {
          logger.warn('VistA RPC connection timeout:', { host: this.host, port: this.port, timeoutMs });
          cleanup();
          resolve(false);
        })
        .connect(this.port, this.host);

      // Additional fallback timeout
      setTimeout(() => {
        if (!finished) {
          logger.warn('VistA RPC ping fallback timeout');
          cleanup();
          resolve(false);
        }
      }, timeoutMs + 500);
    });
  }

  /**
   * Execute a VistA RPC (stubbed). Returns mock data for known calls.
   */
  async call<T = any>(rpcName: string, params: string[] = []): Promise<VistaRPCResponse<T>> {
    const start = Date.now();

    // Experimental path: delegate fully to broker session
    if (process.env.VISTA_BROKER_EXPERIMENTAL === 'true') {
      try {
        const broker = await vistaBrokerSession.call(rpcName, params);
        if (broker.ok) {
          if (rpcName.startsWith('ORWPT')) {
            const data: any = broker.lines.map(l => {
              const [id, rawName, ssn4, sex, dob] = l.split('^');
              return { id, name: rawName?.replace(',', ' '), ssnLast4: ssn4, sex, dob };
            });
            return { ok: true, data, timingMs: Date.now() - start };
          }
          return { ok: true, data: broker.lines as any, timingMs: Date.now() - start };
        }
      } catch (e:any) {
        logger.error('VistaRPC broker call failed', { rpcName, error: e.message });
      }
    }

    // Current mock implementation (will be replaced once broker fully implemented)
    try {
      // Mock logic for early POC: translate certain RPC names
      if (rpcName === 'ORWPT LIST ALL') {
        const sample: any = [
          { id: '100', name: 'John Smith', dob: '1965-01-12' },
            { id: '101', name: 'Jane Doe', dob: '1972-07-03' },
            { id: '102', name: 'Carlos Alvarez', dob: '1959-11-22' },
            { id: '103', name: 'Mary Johnson', dob: '1980-05-09' }
          ];
        const filter = params[0]?.toLowerCase();
        const filtered = filter ? sample.filter((p: any) => p.name.toLowerCase().includes(filter)) : sample;
        return { ok: true, data: filtered as T, timingMs: Date.now() - start };
      }

      // Unknown RPC returns not implemented
      return { ok: false, error: 'RPC_NOT_IMPLEMENTED', timingMs: Date.now() - start };
    } catch (e: any) {
      logger.error('VistaRPCClient call error', { rpcName, error: e.message });
      return { ok: false, error: e.message, timingMs: Date.now() - start };
    }
  }
}

export const vistaRPCClient = new VistaRPCClient();
