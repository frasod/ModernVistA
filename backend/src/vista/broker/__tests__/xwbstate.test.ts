import { XwbStateMachine } from '../xwbState';
import { decodeXwb } from '../framing';

describe('XwbStateMachine scaffold', () => {
  test('needs more bytes when header incomplete', () => {
    const sm = new XwbStateMachine();
    const res = sm.feed(Buffer.from([0x01]));
    expect(res.state).toBe('HEADER');
    expect(res.needed).toBeGreaterThan(0);
  });

  test('completes simple frame', () => {
    const sm = new XwbStateMachine();
    const payload = Buffer.from('LINE1\nLINE2\n');
    const header = Buffer.alloc(3);
    header.writeUInt8(0x01,0);
    header.writeUInt16BE(payload.length,1);
    const frame = Buffer.concat([header,payload]);
    const res = sm.feed(frame);
    expect(res.state).toBe('COMPLETE');
    expect(res.ok).toBe(true);
    expect(res.lines).toContain('LINE1');
  });

  test('decodeXwb routes through state machine when flag set', () => {
    const prev = process.env.VISTA_BROKER_XWB_REAL_ENABLE;
    process.env.VISTA_BROKER_XWB_REAL_ENABLE = 'true';
    const payload = Buffer.from('ONLY\n');
    const header = Buffer.alloc(3);
    header.writeUInt8(0x01,0);
    header.writeUInt16BE(payload.length,1);
    const frame = Buffer.concat([header,payload]);
    const decoded = decodeXwb(frame);
    expect(decoded.ok).toBe(true);
    expect(decoded.lines[0]).toBe('ONLY');
    process.env.VISTA_BROKER_XWB_REAL_ENABLE = prev;
  });
});
