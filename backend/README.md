# ModernVista Backend

ModernVista backend provides a modern API layer over VistA RPCs (and future services) with a clean, testable architecture.

See the evolving implementation journal in `../docs/DEVELOPMENT_LOG.md` for a dated breakdown of phases, design decisions, and next steps.

## Quick Start (Development)

1. Install dependencies
2. Copy `.env.sample` to `.env` and set `JWT_SECRET`
3. Run in dev mode (ts-node) or build + start

```bash
cd backend
npm install
cp .env.sample .env
# edit .env and set JWT_SECRET
npm run dev          # live reload (ts-node)
# or
npm run build && npm start
```

Health endpoints:
- Root: `GET /health`
- API: `GET /api/v1/health`

Patients mock endpoints:
- `GET /api/v1/patients/ping`
- `GET /api/v1/patients/search?q=<term>` (mocked list)

## Testing

Uses Jest + supertest.

```bash
npm test
```

### New Endpoint & Metrics Tests
Added coverage for:
* `GET /api/v1/patients-search` structured response (`patients.search.test.ts`)
* `POST /api/v1/nlp/intent/patient-search` term extraction (`nlp.intent.patientSearch.test.ts`)
* Prometheus metrics smoke (`metrics.smoke.test.ts`) – sets `ADMIN_METRICS_ENABLE=true` at test runtime

Run a single test file:
```bash
npm test -- patients.search.test.ts
```
Update snapshots (if any added later):
```bash
npm test -- -u
```

## Environment Variables
See `.env.sample` for full list. Key ones:
- `PORT` (default 3001)
- `JWT_SECRET` (required in production; auto-fallback generated in dev if unset)
- `ADMIN_METRICS_ENABLE` enable admin metrics routes
- `VISTA_*` placeholders for real RPC connectivity
- `OLLAMA_*` local LLM integration

## Architecture Highlights
- Express + modular routers under `src/api`
- Middleware: rate limiting, request timeout, logging, error handling
- Clean separation of app factory (`app.ts`) from startup (`index.ts`) for testability
- Broker / RPC scaffolding under `src/vista/broker`

### Experimental Broker (Phase 3)
The broker layer is evolving through phased scaffolds controlled by feature flags so production remains stable:

Flags:
```
VISTA_BROKER_EXPERIMENTAL=true        # enable session + transport path (otherwise pure mocks)
VISTA_BROKER_PHASE3_ENABLE=true       # use synthetic length-prefixed frames + basic sign-on/context send/read
VISTA_CONTEXT="OR CPRS GUI CHART"      # context option name (placeholder)
VISTA_ACCESS_CODE=ACCESS              # development access code (placeholder only)
VISTA_VERIFY_CODE=VERIFY              # development verify code (placeholder only)
```

Behavior when enabled:
1. Session connects via chosen transport (real socket if configured; MockTransport in tests) and performs:
	- `XUS SIGNON SETUP`
	- `XUS AV CODE` (using placeholder access^verify)
	- `XWB SET CONTEXT` (if `VISTA_CONTEXT` provided)
2. RPC calls are encoded via a `FrameCodec` abstraction. Current codec (`SyntheticCodec`) supports optional length prefix.
3. Responses are decoded; if transport times out or returns nothing, fallback mock lines are supplied for patient list RPCs.
4. Metrics: A single sign-on attempt is recorded (`__SIGNON__` aggregate) and per-RPC timing captured.

Testing additions (Phase 3):
- `signon.test.ts` validates handshake path.
- `codec.test.ts` covers length prefix error handling.
- `timeout.test.ts` ensures timeout fallback still returns mock data.
- `metrics.signon.test.ts` asserts sign-on metric counted once.

Next Phases:
- Introduce real XWB frame encoding/decoding (`XwbCodec`).
- Implement true Access/Verify authentication flow against a test VistA.
- Parse structured results (patient demographics, labs) instead of raw caret lines.

Security Note: Never commit real Access/Verify codes. Current values are placeholders for local-only synthetic testing.

### Phase 4: XWB Codec Flag
Enable early binary framing stub:
```
VISTA_BROKER_XWB_ENABLE=true
```
When set, session uses `XwbCodec` which wraps payloads in a simple provisional frame:
`0x01 | uint16_be_length | synthetic_payload`.
Decoding validates start marker and length, then reuses synthetic parser. This is a staging point to implement authentic XWB control bytes without changing higher-level session logic.

### Phase 5: Raw Frame Capture (Development Only)
Flags:
```
VISTA_BROKER_CAPTURE_RAW=true      # write JSON files (send/recv) with hex + ascii preview
VISTA_BROKER_CAPTURE_DIR=./captures
VISTA_BROKER_CAPTURE_REDACT=true   # enable PHI redaction (SSN, DOB, NAME heuristics)
```
Behavior:
- Each send/recv frame (sign-on, context, RPC) produces a timestamped JSON artifact.
- Files include direction, length, hex, redacted ascii preview, applied redaction rules, and minimal meta (phase, rpc name).
- Intended strictly for protocol reverse-engineering; disable in production (sensitive data risk).
Safety:
- Synchronous writes kept small.
- Add `captures/` to `.gitignore` (recommended) before enabling where real data may appear.
- Redaction masks SSN-like patterns, ISO-style DOB, and simple `Last, First` name forms before persistence.
- Disable in production; treat artifacts as sensitive even with redaction.

### Phase 6 (Preparing Real XWB Decode)
Flag (scaffold only – no real parsing yet):
```
VISTA_BROKER_XWB_REAL_ENABLE=true
```
When enabled, the decode path routes through an incremental XWB state machine (HEADER→BODY→COMPLETE/ERROR). Provisional header: `0x01 | uint16_be_length | payload`. Tests assert state transitions; future authentic header fields will replace the provisional parse without changing higher-level session code. Redaction + raw capture (Phase 5) provide safe inputs for deriving the real format.

Strict header strategy (stub) flag:
```
VISTA_BROKER_XWB_REAL_STRICT=true
```
Activates a placeholder "real" header strategy expecting a two-byte start sequence (`0x00 0x01`) followed by a 16‑bit big-endian length. This is a staging hook; real semantics will replace it once empirical frames are analyzed. Errors under strict mode increment header error metrics.

### Phase 7 (Planned): Authentic XWB Header & Prometheus Metrics
Adds real header parsing (control bytes, length, potential terminators) and expands metrics. New exposed endpoint when `ADMIN_METRICS_ENABLE=true`:

`GET /metrics` returns Prometheus text including:
```
broker_rpc_count{rpc="<name>"}
broker_rpc_errors_total{rpc="<name>"}
broker_rpc_max_ms{rpc="<name>"}
broker_rpc_p95_ms{rpc="<name>"}
broker_rpc_avg_ms{rpc="<name>"}
broker_signon_attempts
broker_signon_errors
broker_frames_seen
broker_frames_complete
broker_frames_errors
broker_frames_last_error_code{code="<ERR>"}
broker_header_errors
broker_header_error_reasons_total{reason="..."}
broker_redaction_applied
broker_redaction_rule_total{rule="SSN"}
broker_decode_latency_ms_bucket{le="1"}
... (multiple buckets)
broker_decode_latency_ms_bucket{le="+Inf"}
broker_decode_latency_ms_sum
broker_decode_latency_ms_count
broker_rpc_e2e_latency_ms_bucket{le="5"}
... (multiple buckets)
broker_rpc_e2e_latency_ms_bucket{le="+Inf"}
broker_rpc_e2e_latency_ms_sum
broker_rpc_e2e_latency_ms_count
broker_frames_continuations_total
broker_frames_multipart_exceeded_total
broker_frames_multipart_started_total
broker_frames_multipart_completed_total
broker_frames_multipart_checksum{sha1="..."}
broker_rpc_timeouts_total
broker_session_state{state="ready"}
broker_parse_name_split_failed_total
broker_parse_dropped_strict_dob_total
```
Planned additions: header parse errors, redaction invocation counts, frame latency histograms.

### Structured Parsing (ORWPT LIST)
Phase: Initial integration.

The broker now parses caret-delimited patient list responses into structured objects when invoking `ORWPT LIST` (mock or experimental transport path). A new experimental endpoint is exposed:

`GET /api/v1/patients-search?q=<term>`

Response shape:
```
{
	ok: true,
	term: "DOE",
	patients: [ { id, name, lastName?, firstName?, icn?, gender?, dob?, dobIso?, raw } ],
	issues: [ { line, reason, index } ],
	raw: [ "100^DOE,JOHN^1234^M^01/12/1965", ... ],
	mock: true
}
```
Parsing metrics (in /metrics):
```
broker_parse_patients_total
broker_parse_issues_total
broker_parse_issue_reasons_total{reason="NO_DELIMITERS"}
broker_parse_dob_normalized_total
broker_parse_dob_invalid_total
broker_parse_gender_omitted_total
```
Reasons currently: `NO_DELIMITERS`, `INSUFFICIENT_FIELDS`, `MISSING_CORE_FIELDS`.

These metrics help track data quality / protocol drift as real frames are integrated.

### Recent Metrics Additions (October 12, 2025)

Multi-part & session observability:
```
broker_frames_continuations_total              # continuation (INTERIM) markers observed
broker_frames_multipart_started_total          # sequences where more than one payload part assembled
broker_frames_multipart_completed_total        # multi-part sequences that reached COMPLETE
broker_frames_multipart_exceeded_total         # sequences aborted due to accumulated size guard
broker_frames_multipart_checksum{sha1="..."}  # SHA1 of last completed multi-part payload (label)
broker_rpc_timeouts_total                      # transport read timeouts (no data before deadline)
broker_session_state{state="<value>"} 1       # one-hot gauge for current session lifecycle state
```

Parsing quality extensions:
```
broker_parse_name_split_failed_total           # lines lacking comma for LAST,FIRST split
broker_parse_dropped_strict_dob_total          # patients dropped under strict DOB validation mode
broker_mode{mode="mock|experimental"} 1       # indicates operating mode (flag-controlled)
broker_session_state_dwell_ms{state="ready"} # cumulative ms spent in each state
```

Enable strict DOB enforcement via:
```
VISTA_PARSE_STRICT_DOB=true
```
Add extra redaction regex patterns (pipe-delimited) via:
```
VISTA_BROKER_REDACT_EXTRA="REGEX1|REGEX2"
```
Configure multi-part max accumulated size (KB):
```
VISTA_BROKER_MULTIPART_MAX_KB=512
```
All new metrics are automatically exported when `ADMIN_METRICS_ENABLE=true`.

## Production Build

```bash
npm run build
NODE_ENV=production node dist/index.js
```

Ensure you provide a strong `JWT_SECRET` in production; dev fallback is disabled when `NODE_ENV=production`.

## Roadmap (High-Level)
- Real VistA broker session negotiation
- Auth (login, refresh tokens)
- Patient chart modules (labs, meds, vitals)
- NLP command interface
- Metrics (Prometheus / OTEL) integration
- Caching layer (Redis)
- Structured domain services + repository layer
