import { XwbStateMachine, RealXwbHeaderStrategy, ProvisionalHeaderStrategy } from '../xwbState';

describe('XWB Header Strategy Selection', () => {
  const prevStrict = process.env.VISTA_BROKER_XWB_REAL_STRICT;
  afterEach(() => {
    if (prevStrict === undefined) delete process.env.VISTA_BROKER_XWB_REAL_STRICT; else process.env.VISTA_BROKER_XWB_REAL_STRICT = prevStrict;
  });

  test('provisional strategy decodes provisional frame', () => {
    delete process.env.VISTA_BROKER_XWB_REAL_STRICT;
    const payload = Buffer.from('TEST\n');
    const header = Buffer.from([0x01, 0x00, payload.length]);
    const sm = new XwbStateMachine();
    const res = sm.feed(Buffer.concat([header, payload]));
    expect(res.ok).toBe(true);
    expect(res.header?.length).toBe(payload.length);
  });

  test('strict strategy expects 0x00 0x01 start and errors otherwise', () => {
    process.env.VISTA_BROKER_XWB_REAL_STRICT = 'true';
    const sm = new XwbStateMachine();
    const payload = Buffer.from('ABC');
    // Provide provisional frame which should fail strict header
    const header = Buffer.from([0x01, 0x00, payload.length]);
    const res = sm.feed(Buffer.concat([header, payload]));
    expect(res.state === 'ERROR' || res.ok === false).toBe(true);
  });

  test('strict strategy parses stub real header', () => {
    process.env.VISTA_BROKER_XWB_REAL_STRICT = 'true';
    const payload = Buffer.from('HELLO');
    // Real stub header: 0x00 0x01 + length(2)
    const header = Buffer.from([0x00, 0x01, 0x00, payload.length]);
    const sm = new XwbStateMachine();
    const res = sm.feed(Buffer.concat([header, payload]));
    expect(res.ok).toBe(true);
    expect(res.header?.length).toBe(payload.length);
  });
});
