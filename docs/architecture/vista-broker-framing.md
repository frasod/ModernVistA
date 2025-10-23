# VistA Broker Framing & Session Architecture (Phase 2 → Phase 3 Scaffold)

Status: Draft / Phase 3 Scaffold Initiated
Updated: 2025-10-11 (Phase 3 length-prefix experimental helper added)
Scope: Documents current incremental strategy for implementing a ModernVista TypeScript RPC Broker client targeting CPRS parity.

## Goals
- Replace mock patient RPC calls with real VistA Broker calls incrementally.
- Maintain a safe, observable, feature-flagged path (`VISTA_BROKER_EXPERIMENTAL=true`).
- Provide clean separation: Connection (TCP) -> Session (sign-on/context) -> Framing (encode/decode) -> Domain transforms.

## Layers
1. Connection (`connection.ts`)
   - Owns raw `net.Socket` lifecycle (connect, write, teardown).
   - Enforces connect timeout (`config.vista.brokerTimeoutMs`).
2. Session (`session.ts`)
   - Maintains authentication + context state.
   - Handles sign-on handshake (future real RPCs): `XUS SIGNON SETUP`, `XUS AV CODE`.
   - Handles context: `XWB SET CONTEXT` using `config.vista.context`.
   - Provides `call(rpcName, params)` abstraction.
3. Framing (`framing.ts`)
   - Encodes RPC invocation into broker wire format (placeholder now).
   - Decodes responses & sanitizes for logs.
   - Roadmap enumerated by `planFramingEvolution()`.
4. Domain Adaptation (`rpcClient.ts`)
   - Transforms raw lines into JSON objects used by API routes.
   - Applies PHI redaction & normalization.

## Incremental Phases
| Phase | Focus | Code Artifacts | Feature Flag Behavior |
|-------|-------|----------------|-----------------------|
| 1 | Socket Scaffold + Mock Call Delegation | `connection.ts`, `session.ts` (basic) | Still returns mock lines |
| 2 | Framing Scaffold + Sign-On Stubs | `framing.ts`, extended session | Still mock; framing exercised synthetically |
| 3 | Real Sign-On & Context | Implement real XUS / XWB RPCs | Live auth; selected RPCs still mock |
| 4 | Real Patient RPC (`ORWPT LIST`) | Session call writes real frames | Patient search becomes live |
| 5 | Additional RPC Coverage | Add scheduling, orders, labs | Expand mapping table |
| 6 | Robustness (reconnect, pooling) | Idle timeout logic, pooling | Production hardening |

## Framing Evolution
`framing.ts` exposes `planFramingEvolution()` which returns canonical ordered milestones so tests can assert we have not skipped steps. Each milestone tightens fidelity toward authentic XWB broker parity while preserving backward compatibility with already-implemented abstractions.

Planned transition:
1. phase2-skeleton: Textual placeholder (completed)
2. phase3-length-prefix: Experimental synthetic length prefix added (NOT real XWB framing yet) + env-gated sign-on frame simulation (completed: synthetic only)
3. phase4-param-typing: Encode parameter types (literal/list/global/empty) + structured encode options
4. phase5-contextual-errors: Distinguish transport vs application errors; stable error code enum
5. phase6-streaming-large-results: Support chunked multi-buffer reads

### Current Frame Contract (Synthetic)
The encode/decode API now returns structured metadata to decouple higher layers from raw buffer assumptions:

| Field | Purpose |
|-------|---------|
| `kind` | Distinguishes `synthetic-text`, `synthetic-length-prefixed`, future `xwb-request` / `xwb-response` |
| `raw` | Buffer to write (current placeholder) |
| `lengthPrefixed` | Optional experimental length-prefixed variant (hex length header) |
| `meta.declaredLength` | Recorded size for diagnostics when using length prefix |

### Error Codes (Preliminary Enum)
`BrokerFrameErrorCode` centralizes decode error semantics:

| Code | Meaning | Typical Action |
|------|---------|----------------|
| SHORT_FRAME | Buffer shorter than minimal header | Accumulate / wait for more bytes |
| LENGTH_MISMATCH | Declared vs actual payload length mismatch | Drop & reconnect (synthetic) |
| UNKNOWN_FORMAT | Cannot parse expected header format | Log + abort decode path |
| INCOMPLETE | Stub / partial frame (e.g., XWB capture not yet parsed) | Buffer until complete |
| CONTROL_SEQUENCE | Invalid or unexpected control marker | Abort socket, classify protocol error |
| UNSUPPORTED_VERSION | Version/marker not supported | Future negotiation fallback |

### Stubbed Real XWB Functions
`encodeXwb()` and `decodeXwb()` are introduced as explicit stubs. For now they delegate to / return synthetic structures while tests assert the placeholder `INCOMPLETE` state. This allows incremental TDD: once authentic framing details are known, only these internals change—public API and tests adapt gradually by flipping expected fields from synthetic to real kinds.

### Frame Assembler Layer
The new `assembler.ts` module introduces a `FrameAssembler` abstraction that accumulates arbitrary TCP chunks and emits complete frames. This sits logically between the raw connection and framing decode logic but is intentionally lightweight so it can be swapped or extended without touching session/business layers.

| Feature | Status | Notes |
|---------|--------|-------|
| Partial chunk accumulation | ✅ | Buffers until declared length satisfied |
| Back-to-back frame handling | ✅ | Returns first frame; leaves remainder for next invocation |
| Safety cap (256KB default) | ✅ | Prevents unbounded growth on malformed length headers |
| Synthetic hex length support | ✅ | Drives current Phase 3 experimentation |
| Real XWB control parsing | 🔄 Planned | Will parse authentic control bytes once captured |

Usage (synthetic):
```ts
const assembler = createSyntheticAssembler();
const res = assembler.push(chunk); // res?.packet when complete
```
The connection layer activates the assembler when `VISTA_BROKER_PHASE3_ENABLE=true` so we test buffer logic now and simply redirect to real decode later.

## Sign-On Flow (Target Behavior)
1. Connect TCP -> server emits initial greeting (ignored or logged)
2. Call `XUS SIGNON SETUP` (no params) -> returns needed capabilities
3. Call `XUS AV CODE` with `access^verify` -> returns DUZ, greeting, flags
4. Call `XWB SET CONTEXT` with option name (e.g. `OR CPRS GUI CHART`)
5. Session ready flag set; subsequent calls reuse socket until idle timeout

## Timeout & Idle Strategy
- `config.vista.brokerTimeoutMs` (default 5000ms) covers connect & per-call wait windows.
- Idle socket: session tracks `lastUsed`; beyond 5 minutes (tunable later) it will force reconnect.

## Logging & PHI
- Raw lines never logged in full; `sanitizeForLog()` truncates & redacts.
- Future: structured extraction -> explicit whitelisting of fields.

## Error Domains
| Domain | Examples | Handling Strategy |
|--------|----------|------------------|
| Transport | ECONNREFUSED, timeout | Retry (limited), escalate 503 |
| Sign-On | Invalid access/verify | Mark session unusable, clear auth flags |
| Context | Option not found | Log error, fail calls with 403-like code |
| RPC | Application error strings | Parse & map to HTTP 4xx/5xx |
| Decode | Malformed frame | Abort socket, force reconnect |

## Testing Strategy (Forthcoming)
- Unit: framing encode/decode invariants (golden fixtures)
- Unit: session state machine transitions (mock connection)
- Integration: sign-on against VEHU container (flagged)
- Contract: sample outputs vs legacy CPRS expected patterns

## Open Questions / TODO
- Confirm exact framing control characters from live capture.
- Decide on pool size vs single session for MVP.
- Implement structured patient row parser tolerant of variations.
- Add metrics (histograms) for RPC latency.

## Next Steps (Immediate)
- Implement real sign-on RPC calls (Phase 3 proper execution)
- Capture & document actual frame bytes (append real examples under Framing Samples section)
- Replace synthetic fabricated decode path in `session.call` for non-mock rpcName.

## Phase 3 Additions (Current State)
- Expanded framing contract with `BrokerFrameKind`, structured `EncodedRpcPacket` / `DecodedRpcPacket` types.
- Added synthetic length-prefixed buffer in `encodeRpc` (hex length header) for exercising buffer management.
- Added `decodeLengthPrefixed` helper (delegates to placeholder parsing; adds error codes & kind tagging).
- Introduced preliminary `BrokerFrameErrorCode` enumeration for consistent error surfaces.
- Added stub `encodeXwb` / `decodeXwb` entry points for seamless introduction of real broker protocol.
- Maintained optional env flag `VISTA_BROKER_PHASE3_ENABLE` for simulated framed sign-on path.
- Lightweight in-memory metrics aggregator (`metrics.ts`) capturing count/avg/max/p95 & sign-on attempts.
- Logging philosophy doc (`logging-philosophy.md`) establishing PHI redaction guardrails.

## Observability Endpoint (Development Only)
When `ADMIN_METRICS_ENABLE=true`, an admin endpoint `/api/v1/admin/broker/metrics` exposes the in-memory snapshot (counts, errors, avg, max, p95, sign-on attempts). This is intentionally:
- Unauthenticated for now (development only)
- Lightweight (no Prometheus/OpenTelemetry yet)
Future: secure with auth, optionally add Prometheus exposition format & histogram buckets.

### Frame Metrics (Experimental)
The metrics snapshot now includes a `frames` object:
| Field | Meaning |
|-------|---------|
| `seen` | Number of inbound data chunks processed (assembler pushes) |
| `complete` | Number of successfully assembled frames (synthetic) |
| `errors` | Count of frame assembly errors (length mismatch, unknown format, etc.) |
| `lastError` | Last error code encountered (or null) |

These metrics validate buffering logic prior to real XWB adoption and help distinguish transport vs framing vs application faults.

## Framing Samples (To Be Captured)
| Stage | Description | Captured | Notes |
|-------|-------------|----------|-------|
| Sign-On Greeting | Initial server banner (if any) | No | Need TCP capture |
| XUS SIGNON SETUP Request | Real frame bytes | No | After implementing real framing |
| XUS SIGNON SETUP Response | Returns needAV & capabilities | No |  |
| XUS AV CODE Request | Access^Verify composite | No |  |
| XUS AV CODE Response | DUZ, greeting, flags | No |  |
| XWB SET CONTEXT Request | Option name payload | No |  |
| XWB SET CONTEXT Response | Success/failure boolean | No |  |

---
## Extended Frame Capture (Experimental Diagnostic Layer)
To accelerate implementation of authentic XWB framing, an optional rolling frame chunk capture facility is provided (flag: `VISTA_BROKER_FRAME_CAPTURE=true`). It records only the last N inbound socket chunks (post-greeting) with strict truncation rules:

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Chunk ring size | 25 | Keep memory bounded |
| Per-chunk cap | 256 bytes | Prevent large PHI payload ingestion |
| Total bytes cap | 4096 bytes | Global safeguard (after which chunks are counted as dropped) |

Exposure occurs via the admin endpoint (dev only):
```
GET /api/v1/admin/broker/frames
```
Response structure merges greeting snapshot and frame chunk metadata:
```
{
   "greetingEnabled": true,
   "frameCaptureEnabled": true,
   "greeting": { ... },
   "frames": {
      "count": 7,
      "totalBytes": 896,
      "dropped": 0,
      "cap": 4096,
      "chunks": [ { "index": 0, "length": 128, "hex": "...", "asciiPreview": "...", "ts": 1696970000000 } ]
   }
}
```

Safety / PHI Considerations:
1. Intended only pre-production while reverse-engineering or validating frame parser correctness.
2. Non-printable bytes replaced with '.' to reduce accidental leakage when copying samples.
3. Disable flag in normal development and always before handling real patient workflows.

Usage Workflow:
1. Enable both `VISTA_BROKER_CAPTURE=true` and `VISTA_BROKER_FRAME_CAPTURE=true`.
2. Trigger a broker operation (e.g., patient list) to accumulate chunks.
3. Inspect `/broker/frames` and `/broker/metrics` to correlate framing behavior.
4. Implement / refine `decodeXwb` using captured structural patterns.
5. Disable frame capture once parser stabilizes; keep greeting capture optional for regression checks.

Future Enhancements (Optional):
- Add server-side redaction rules (e.g., zeroing ASCII sequences that resemble SSNs or MRNs).
- Provide diffing utility comparing successive capture sessions to highlight framing invariants.
- Export limited sanitized fixture files for unit tests of `decodeXwb`.

---
Document owner: ModernVista backend team
