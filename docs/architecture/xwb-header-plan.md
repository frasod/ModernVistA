# Real XWB Header & Protocol Implementation Plan

Status: Draft (Scaffold in place via `XwbStateMachine`)  
Target Phase: 7 (Authentic Header Decode)  
Date: 2025-10-12

## Objectives
1. Capture authentic XWB broker frames (sign-on, context set, simple RPC) safely. 
2. Derive authoritative header/control byte structure (start markers, length fields, type codes, terminators, checksums if present). 
3. Extend `XwbStateMachine` to parse real headers incrementally without breaking provisional pathway. 
4. Introduce bidirectional encode/decode parity for a minimal RPC (e.g., `XUS GET USER INFO`). 
5. Preserve safety: PHI redaction before persistence; feature-flag gated rollout. 

## Constraints & Safety
- All real parsing gated behind `VISTA_BROKER_XWB_REAL_ENABLE` (and a new `VISTA_BROKER_XWB_REAL_STRICT` once validation logic added). 
- Raw capture directory must be treated as sensitive; redaction layer required before broader enablement. 
- Never commit raw unredacted sample frames into VCS; instead, convert to sanitized JSON fixtures with synthetic values. 

## Incremental Milestones
| Milestone | Description | Exit Criteria | Flag |
|----------|-------------|---------------|------|
| M1 Capture Seed | Obtain 3 canonical frames (sign-on handshake, context, trivial RPC response) | Hex dumps stored locally (ignored by git) | existing |
| M2 Header Schema Draft | Identify start byte(s), length encoding (endianness, size), frame type, terminator | Spec documented in this file | existing |
| M3 State Machine Upgrade | Implement real header parse path w/ validation + fallback | Tests pass with sanitized fixtures | real enable |
| M4 Encode Path | Implement real request encoder for trivial RPC | Round-trip test passes | real enable |
| M5 Strict Validation | Add checksum/terminator checks + `XWB_REAL_STRICT` flag | Fuzz tests reject malformed inputs | new strict |
| M6 Multi-part / Streaming | Support segmented responses (if present) | Fixture with multi-part passes | real enable |
| M7 Redaction Pipeline | Implement PHI redaction for capture artifacts | All capture tests confirm redaction | capture flags |

## Data Needed (Capture Checklist)
- Sign-on negotiation sequence (each frame hex + ASCII). 
- Context set frame. 
- At least one small RPC request & response pair (e.g., ping or user info). 
- Example longer RPC response (labs or problem list) for length stress test (optional early). 

## Planned Code Changes
1. `xwbState.ts` – Add real header parser: 
   - Detect authentic start marker pattern (tentatively 0x00 0x01? placeholder). 
   - Parse length (likely ASCII decimal or binary). 
   - Track partial header consumption (introduce `headerBytes` accumulator). 
   - Validate terminator (CR/LF or control char). 
2. Introduce `XwbHeader` interface (fields: `start`, `length`, `type`, `flags`, `terminator`). 
3. Extend result types: add `header?: XwbHeader` in `XwbDecodeResult`. 
4. Add `decodeRealHeader(buffer: Buffer): DecodeHeaderResult`. 
5. Split provisional and real logic behind strategy selected at construction time (avoid re-instantiating SM per `feed`). 
6. `codec.ts` – Provide encode function for real RPC when both `VISTA_BROKER_XWB_ENABLE` & real flag active. 
7. Add fixtures under `backend/src/vista/broker/__tests__/fixtures/xwb/` (sanitized). 
8. Add tests: 
   - `xwb.header.test.ts` for header parse edge cases. 
   - `xwb.roundtrip.test.ts` for encode/decode parity. 
   - Fuzz test generating random length corruption verifying rejection. 
9. Redaction: new `redactFrame(buffer: Buffer, header: XwbHeader): RedactionResult` applying regex & heuristics (SSN, DOB, names). 
10. Capture integration: call `redactFrame` before disk write when real flag active. 

## Edge Cases
- Truncated mid-header (should return needed bytes). 
- Declared length > policy cap (reject). 
- Non-numeric length / malformed control sequence. 
- Extra trailing bytes (leave for next feed). 
- Multi-part (if header signals continuation). 
- Embedded nulls in body (binary safe). 

## Testing Strategy
- Deterministic sanitized fixtures with fixed header bytes ensure reproducibility. 
- Property-based test (lightweight) varying declared length vs actual to assert rejection paths. 
- Mutation test style: flip each header byte and assert either error or fallback. 

## Metrics Additions
- `broker_frames_header_errors_total{reason=...}` 
- `broker_frames_truncated_total` 
- `broker_frames_length_overflow_total` 
- Latency histogram from first byte of header → COMPLETE. 

## Open Questions
1. Is checksum present or only delimiter-terminated? 
2. Are responses chunked with a continuation flag or separate headers? 
3. Do sign-on frames differ structurally from RPC frames? 
4. Is there a distinct frame type for errors vs embedding in body text? 

## Next Immediate Action
Scaffold fixtures directory & placeholder tests so future real data drops in with minimal friction.
