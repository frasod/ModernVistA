import { XwbStateMachine } from '../xwbState';
import { brokerMetrics } from '../metrics';

function header(len: number) {
  const b = Buffer.alloc(3);
  b.writeUInt8(0x01,0);
  b.writeUInt16BE(len,1);
  return b;
}

function continuation() { return header(0); }

function frame(payload: Buffer) { return Buffer.concat([header(payload.length), payload]); }

describe('Multi-part metrics', () => {
  beforeEach(() => brokerMetrics.reset());

  test('records start, completion and checksum for multi-part sequence', () => {
    const sm = new XwbStateMachine();
    // First part (normal payload)
    const p1 = Buffer.from('PART1\n');
    const r1 = sm.feed(frame(p1));
    expect(r1.state).toBe('COMPLETE');
    // Introduce continuation marker for second part
    const cont = sm.feed(continuation());
    expect(cont.state).toBe('INTERIM');
    // Second payload triggers multi-part start & completion
    const p2 = Buffer.from('PART2\n');
    const r2 = sm.feed(frame(p2));
    expect(r2.state).toBe('COMPLETE');
    const snap = brokerMetrics.snapshot();
    expect(snap.frames.multipartStarted).toBe(1);
    expect(snap.frames.multipartCompleted).toBe(1);
    expect(snap.frames.multipartChecksum).toBeTruthy();
  });

  test('does not set multipart metrics for single-part frame', () => {
    const sm = new XwbStateMachine();
    const p = Buffer.from('ONLYONE\n');
    const r = sm.feed(frame(p));
    expect(r.state).toBe('COMPLETE');
    const snap = brokerMetrics.snapshot();
    expect(snap.frames.multipartStarted).toBe(0);
    expect(snap.frames.multipartCompleted).toBe(0);
    expect(snap.frames.multipartChecksum).toBe(null);
  });
});
