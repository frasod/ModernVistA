/*
 * Frame Analyzer Utility
 * ----------------------
 * Dev helper to annotate raw captured frame chunks (from broker capture endpoints)
 * with offsets, hex pairs, ASCII preview, and simple heuristics to aid reverse
 * engineering of the real XWB protocol. Not used at runtime in production paths.
 */

export interface AnalyzedByte {
  offset: number;        // absolute offset in the merged buffer
  hex: string;           // two-digit hex
  dec: number;           // decimal value
  ascii: string;         // printable or '.'
  control: boolean;      // non-printable classification
}

export interface FrameAnalysis {
  length: number;
  bytes: AnalyzedByte[]; // trimmed if large
  hex: string;           // full hex (possibly truncated)
  asciiPreview: string;  // limited ASCII preview
  entropy?: number;      // Shannon entropy estimate (rough) over sample
  groups: string[];      // grouped hex lines for visual diffing
}

export interface AnalyzerOptions {
  maxBytes?: number;     // cap to avoid giant dumps
  groupWidth?: number;   // bytes per group line
  previewBytes?: number; // ascii preview length
}

const DEFAULTS: Required<AnalyzerOptions> = {
  maxBytes: 1024,
  groupWidth: 16,
  previewBytes: 128
};

export function analyzeFrameChunks(chunks: Buffer[], opts: AnalyzerOptions = {}): FrameAnalysis {
  const cfg = { ...DEFAULTS, ...opts };
  const merged = Buffer.concat(chunks);
  const slice = merged.slice(0, cfg.maxBytes);
  const bytes: AnalyzedByte[] = [];
  for (let i = 0; i < slice.length; i++) {
    const b = slice[i];
    const ascii = b >= 0x20 && b <= 0x7E ? String.fromCharCode(b) : '.';
    bytes.push({ offset: i, hex: b.toString(16).padStart(2, '0'), dec: b, ascii, control: ascii === '.' });
  }
  const hex = slice.toString('hex');
  const asciiPreview = bytes.map(b => b.ascii).join('').slice(0, cfg.previewBytes);
  const groups: string[] = [];
  for (let i = 0; i < bytes.length; i += cfg.groupWidth) {
    const segment = bytes.slice(i, i + cfg.groupWidth);
    const offs = segment[0].offset.toString().padStart(6, '0');
    const hexCols = segment.map(b => b.hex).join(' ');
    const asciiCols = segment.map(b => b.ascii).join('');
    groups.push(`${offs}  ${hexCols.padEnd(cfg.groupWidth * 3 - 1)}  |${asciiCols}|`);
  }
  return {
    length: merged.length,
    bytes,
    hex,
    asciiPreview,
    groups,
    entropy: estimateEntropy(slice)
  };
}

function estimateEntropy(buf: Buffer): number {
  if (buf.length === 0) return 0;
  const counts: Record<number, number> = {};
  for (const b of buf) counts[b] = (counts[b] || 0) + 1;
  let h = 0;
  for (const k in counts) {
    const p = counts[k]! / buf.length;
    h += -p * Math.log2(p);
  }
  return Number(h.toFixed(3));
}

export function formatAnalysis(a: FrameAnalysis): string {
  return [
    `Total Bytes: ${a.length}`,
    `Sampled: ${a.bytes.length}`,
    `Entropy: ${a.entropy}`,
    '---- Hex Dump ----',
    ...a.groups
  ].join('\n');
}
