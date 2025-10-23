import { XwbStateMachine } from '../xwbState';

// Helper to craft provisional header (0x01 + uint16 len)
function header(len: number) {
  const b = Buffer.alloc(3);
  b.writeUInt8(0x01, 0);
  b.writeUInt16BE(len, 1);
  return b;
}

describe('XwbStateMachine multi-part size guard', () => {
  it('errors when accumulated size exceeds guard', () => {
    // Use default machine (512KB guard). We'll push slightly over 512KB via two large frames.
    const sm = new XwbStateMachine({});
    // First large frame ~400KB
    const part1 = Buffer.alloc(400 * 1024, 0x41); // 'A'
    const frame1 = Buffer.concat([header(part1.length), part1]);
    const r1 = sm.feed(frame1);
    expect(r1.state).toBe('COMPLETE');
    expect(r1.ok).toBe(true);
    // Reset machine to simulate continuation pattern: send continuation marker + next large payload
    // We simulate a continuation by feeding a zero-length header then a second big frame that will exceed the guard.
    const cont = header(0); // continuation marker
    const contRes = sm.feed(cont);
    expect(contRes.state).toBe('INTERIM');
    // Second payload ~200KB (total 600KB > 512KB guard)
    const part2 = Buffer.alloc(200 * 1024, 0x42); // 'B'
    const frame2 = Buffer.concat([header(part2.length), part2]);
    const res2 = sm.feed(frame2);
    expect(res2.state).toBe('ERROR');
    expect(res2.error).toBe('MULTIPART_SIZE_EXCEEDED');
  });
});
