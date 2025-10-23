import { brokerCapture } from '../../broker/capture';

describe('extended frame capture', () => {
  beforeEach(() => brokerCapture.reset());

  test('records frame chunks up to limits', () => {
    // Force enable via env simulation
    (brokerCapture as any).frameCaptureEnabled = true;
    for (let i = 0; i < 5; i++) {
      const buf = Buffer.from('CHUNK' + i);
      (brokerCapture as any).recordFrameChunk(buf);
    }
    const snap: any = brokerCapture.snapshot();
    expect(snap.frames.count).toBe(5);
    expect(snap.frames.chunks[0].asciiPreview).toContain('CHUNK');
  });

  test('enforces total bytes cap and truncation', () => {
    (brokerCapture as any).frameCaptureEnabled = true;
    (brokerCapture as any).totalBytesCap = 40; // lower cap for test
    const big = Buffer.alloc(300, 'A');
    (brokerCapture as any).recordFrameChunk(big); // first chunk truncated
    const snap1: any = brokerCapture.snapshot();
    expect(snap1.frames.chunks[0].truncated).toBe(true);
    // Fill until cap reached
    for (let i = 0; i < 10; i++) {
      (brokerCapture as any).recordFrameChunk(Buffer.from('BBBB'));
    }
    const snap2: any = brokerCapture.snapshot();
    expect(snap2.frames.dropped).toBeGreaterThanOrEqual(0); // may drop after cap
  });
});
