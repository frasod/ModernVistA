import { analyzeFrameChunks, formatAnalysis } from '../analyzer';

describe('frame analyzer utility', () => {
  it('annotates bytes and groups lines', () => {
    const buf1 = Buffer.from('HELLO', 'ascii');
    const buf2 = Buffer.from([0x00, 0x01, 0x7F]);
    const analysis = analyzeFrameChunks([buf1, buf2], { groupWidth: 8 });
    expect(analysis.length).toBe(8);
    expect(analysis.bytes.length).toBe(8);
    expect(analysis.bytes[0].hex).toBe('48'); // 'H'
    expect(analysis.bytes[5].control).toBe(true); // 0x00
    expect(analysis.groups.length).toBe(1);
    const formatted = formatAnalysis(analysis);
    expect(formatted).toMatch(/Total Bytes: 8/);
    expect(formatted).toMatch(/Entropy:/);
  });
});
