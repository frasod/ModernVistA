import { XwbStateMachine } from '../xwbState';

// Helper to craft provisional frames: start(0x01) + len + payload
function frame(payload: Buffer): Buffer {
  const header = Buffer.alloc(3);
  header.writeUInt8(0x01,0);
  header.writeUInt16BE(payload.length,1);
  return Buffer.concat([header, payload]);
}

// Continuation marker: length=0
function continuationMarker(): Buffer {
  const h = Buffer.from([0x01,0x00,0x00]);
  return h; // no payload
}

describe('Multi-part provisional frame assembly', () => {
  test('INTERIM produced for continuation marker then completes with second payload', () => {
    const sm = new XwbStateMachine();
    const part1 = continuationMarker();
    const r1 = sm.feed(part1);
    expect(r1.state).toBe('INTERIM');
    // Next actual data payload
    const payload = Buffer.from('LINE1\nLINE2\n');
    const r2 = sm.feed(frame(payload));
    expect(r2.state).toBe('COMPLETE');
    expect(r2.lines).toContain('LINE1');
  });
});
