import { brokerCapture } from '../../broker/capture';

describe('brokerCapture', () => {
  afterEach(() => brokerCapture.reset());

  it('returns disabled greeting when flag not set', () => {
    const snap: any = brokerCapture.snapshot();
    expect(snap.greetingEnabled).toBe(false);
    // In disabled mode greeting key may be omitted OR have enabled:false
    if (snap.greeting) {
      expect(snap.greeting.enabled).toBe(false);
    }
  });

  it('captures only first greeting', () => {
    (brokerCapture as any).enabled = true; // force enable for test
    const buf1 = Buffer.from('HELLO');
    const buf2 = Buffer.from('WORLD');
    brokerCapture.recordGreeting(buf1);
    brokerCapture.recordGreeting(buf2);
    const snap: any = brokerCapture.snapshot();
    expect(snap.greeting.captured).toBe(true);
    expect(snap.greeting.length).toBe(5);
    expect(snap.greeting.asciiPreview.startsWith('HELLO')).toBe(true);
  });

  it('resets state', () => {
    (brokerCapture as any).enabled = true;
    brokerCapture.recordGreeting(Buffer.from('ABC'));
    brokerCapture.reset();
    const snap: any = brokerCapture.snapshot();
    expect(snap.greeting.captured).toBe(false);
  });
});
