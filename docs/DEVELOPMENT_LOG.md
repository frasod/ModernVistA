# ModernVista Development Log

### 📅 **October 22, 2025 - Azure VistA Integration Success + Port Standardization** 🎉

#### Summary
**MAJOR MILESTONE**: ModernVista successfully connected to Azure-hosted VistA instance and retrieved real patient data! After resolving port conflicts and standardizing frontend to port 5173 (Vite default), the full stack is operational with verified real RPC communication to Azure Container Instance.

#### What Works ✅
- **Azure VistA Connection**: `vista-demo-frasod-832.eastus.azurecontainer.io:9430`
- **Patient Search**: Real data retrieval (mock: false) with DOE,JOHN and DOE,JANE
- **Backend**: Stable on port 3001
- **Frontend**: Standardized to port 5173 (Vite default, less conflict-prone)
- **RPC Activity**: Full visibility of VistA communication

#### Technical Resolution Log
| Issue | Root Cause | Solution |
|-------|------------|----------|
| Port 3000 conflicts | Chrome stale connections + other services | Moved frontend to 5173 (Vite standard) |
| Backend on wrong port | Environment variable issues | Explicit PORT=3001 in startup |
| Vite auto-switching ports | 3000/3001 occupied | Configured vite.config.ts port: 5173 |

#### Files Changed
| File | Change | Reason |
|------|--------|--------|
| `frontend/vite.config.ts` | Changed port 3000 → 5173 | Use Vite standard, avoid conflicts |
| `README.md` | Updated Quick Start + Azure success note | Document working state |
| `AZURE_VISTA_CONFIG.md` | Created (earlier) | Azure setup guide |
| `docs/DEVELOPMENT_LOG.md` | This entry | Milestone documentation |

#### Port Architecture (Final)
```
Backend API:  http://localhost:3001
Frontend GUI: http://localhost:5173  ← NEW STANDARD
Azure VistA:  vista-demo-frasod-832.eastus.azurecontainer.io:9430
```

#### Verified Functionality
- ✅ Patient search returning structured JSON with normalized dates
- ✅ RPC activity logging showing real VistA communication
- ✅ Backend .env properly configured for Azure
- ✅ Connection tests passing (DNS, ping, RPC port, GUI port)
- ✅ Frontend proxy correctly routing /api/v1 to backend

#### Launch Commands (Simplified)
```bash
# Backend
cd backend && PORT=3001 npm run dev

# Frontend  
cd frontend && npm run dev  # Auto-uses port 5173
```

#### Next Steps
- [ ] Test additional clinical endpoints (labs, meds, vitals)
- [ ] Verify patient selection flow with real data
- [ ] Document Azure deployment patterns
- [ ] Add automated health checks for Azure connectivity

#### Decision Log
| Decision | Rationale |
|----------|-----------|
| Port 5173 for frontend | Vite's official default, universally recognized, minimal conflicts |
| Keep backend on 3001 | Stable, backend convention, no conflicts |
| Document Azure success | Prove cloud deployment viability for stakeholders |

---

### 📅 **October 14, 2025 - Live RPC Mapping Documentation & Phase Transition**

#### Summary
Added an explicit **Current Live REST ↔ VistA RPC Mapping** section to `README.md` separating *implemented reality* from the longer-term foundational mapping/roadmap. This clarifies for contributors exactly which endpoints are truly broker-backed vs. planned. Marked our state as transitioning from Phase 2 (Patient Core) into Phase 3 (Clinical Read) with initial clinical endpoints (labs, meds, vitals, allergies) all returning structured JSON.

#### Changes
| File | Change |
|------|--------|
| `README.md` | Added "Current Live REST ↔ VistA RPC Mapping" section + phase status + cross-links |
| `docs/DEVELOPMENT_LOG.md` | Appended this entry recording milestone |

#### Rationale
Previously the README mixed future planned RPC coverage with what was actually coded, causing confusion (“Are labs live?”). The new section provides an authoritative snapshot of:
1. Exact REST endpoints shipped today
2. The VistA RPC each calls (if any)
3. Status & caveats (e.g., allergy parser incomplete)
4. Diagnostic/admin endpoints + required feature flags

#### Current State Snapshot
| Aspect | Status |
|--------|--------|
| Patient search | Real ORWPT LIST (structured parse + metrics) |
| Clinical endpoints | Labs / Meds / Vitals / Allergies implemented (basic parsers) |
| Sign-on framing | Experimental (frames emitted; decode fallback still possible) |
| Observability | UI activity log + broker metrics + capture endpoints |
| Auth tokenization | Not implemented (pending surfacing XUS sign-on output) |

#### Next Focus (Short Horizon)
1. Replace placeholder parse segments for allergies & labs with field-accurate mapping (add raw toggle `?debug=1`).
2. Add patient-centric route aliases `/api/v1/patients/:id/{labs,meds,vitals,allergies}` keeping current paths for backward compatibility.
3. Implement durable sign-on & context result caching (avoid repeated handshake per RPC burst).
4. Summarization endpoint aggregating vitals+labs+meds+allergies (foundation for AI summary).
5. Auth layer: surface DUZ & context token; introduce minimal JWT session.

#### Metrics Impact
No new counters added in this change; documentation now instructs readers how to interpret existing parse + rpc latency metrics when correlating with live endpoints.

#### Risks / Watch Items
| Risk | Mitigation |
|------|-----------|
| Drift between README and code | Periodic CI check (future) to regenerate mapping table from router declarations |
| Parser inaccuracies (allergies) | Add raw capture & golden test fixtures before refining mapping |

#### Decision Log
| Decision | Reason |
|----------|-------|
| Separate live mapping from foundational plan | Avoid confusion between shipped vs roadmap features |
| Keep existing foundational section | Still valuable for strategic alignment & onboarding |

---
## What is ModernVista?

ModernVista is a **modern web interface** for VistA healthcare systems. Think of it as giving the old VistA system a completely new, smart interface that doctors and nurses can actually enjoy using.

**The Problem**: VistA's current interface (CPRS) is from the 1990s - text-based, clunky, and requires tons of training.

**Our Solution**: A clean, modern web interface with **natural language processing** so healthcare workers can just say or type what they want in plain English.

---
### 📅 **October 12, 2025 - Structured Patient Parsing & Parse Metrics**

### 📅 **October 12, 2025 - Patient Explorer & RPC Activity Logging**

#### Summary
Implemented an initial Patient Explorer UI panel alongside enhanced patient search allowing selection. Added a reusable RPC Activity logging context that captures endpoint, RPC name, HTTP status (if available), semantic events (e.g., selection), duration, and errors. Integrated real timing & rpcName extraction for the patient search API and added mock Labs / Meds fetching with logging. Activity stream is displayed within the explorer and can be cleared interactively.

#### Key Frontend Changes
| File | Change |
|------|--------|
| `frontend/src/context/RpcActivityContext.tsx` | Introduced activity provider (log/clear) with enriched schema (statusCode, event) |
| `frontend/src/hooks/usePatientSearch.ts` | Wired logging callback to capture latency & rpcName from `/patients-search` |
| `frontend/src/components/PatientSearch.tsx` | Added row selection + event log entry (select) |
| `frontend/src/components/PatientExplorer.tsx` | New explorer with tabs (Summary, Labs, Meds) + recent RPC activity table |
| `frontend/src/services/patients.ts` | Added labs & meds service functions + onResult logging support |
| `frontend/src/modules/app/App.tsx` | Composed two-column layout combining search & explorer |
| `frontend/src/main.tsx` | Wrapped app with `RpcActivityProvider` |

#### Backend (Earlier Supporting) Changes
Mock Labs (`/api/v1/labs/:patientId`) and Meds (`/api/v1/meds/:patientId`) endpoints already exposed with `rpcName` field (added in prior step); leveraged by new services.

#### Activity Item Schema
```
{
   id: string,
   timestamp: number,
   endpoint: string,
   rpcName?: string,
   durationMs: number,
   statusCode?: number,
   event?: string,      // e.g., "select", "cache", "timeout"
   error?: string
}
```

#### Current UX
1. User types ≥2 chars → debounced search → results rendered.
2. Each search request logs an RPC activity entry with status code & duration.
3. Selecting a patient row logs a semantic `select` event (zero-duration marker).
4. Switching to Labs or Meds tab triggers one-time fetch (per patient per tab) with loading/error states and logs the RPC.
5. Activity table shows latest entries (newest first) with color-coded status/event badges; clear button resets log.

#### Rationale
Provides immediate observability for frontend-backend interactions (latency, failures) and surfaces RPC names to meet the GUI requirement of displaying the type of underlying Broker/VistA call. Establishes a consistent logging seam future tabs (Vitals, Allergies, Orders) can reuse.

#### Next Steps
1. Persist recent activity in sessionStorage (opt-in) to survive reloads.
2. Add streaming/continued call visualization once real multi-part RPCs integrated (e.g., flag interim states).
3. Tag activity entries with a correlation ID once backend returns one (future broker enhancement).
4. Add filters (by endpoint / rpcName / error) to the activity panel.
5. Introduce toast or inline indication when a request exceeds latency threshold (e.g., >1s) to highlight slow calls.

### 📅 **October 12, 2025 - Vitals Tab, Activity Persistence & Filtering**

#### Summary
Extended clinical mock data with a vitals endpoint and added a Vitals tab to the Patient Explorer. Implemented sessionStorage persistence for the RPC activity log (survives reload within a session) and introduced an inline text filter plus latency severity coloring.

#### Changes
| File | Change |
|------|--------|
| `backend/src/api/router.ts` | Added `/api/v1/vitals/:patientId` mock endpoint with rpcName `ORQQVI VITALS` |
| `frontend/src/services/patients.ts` | Added `getVitals()` + `VitalSign` interface |
| `frontend/src/components/PatientExplorer.tsx` | Added `vitals` tab, filter input, duration color classes |
| `frontend/src/context/RpcActivityContext.tsx` | Added sessionStorage hydrate + persist logic |

#### UX Enhancements
1. Activity filter matches endpoint, rpcName, or event (case-insensitive).
2. Duration highlighting thresholds (ms):
   - ≥1500 red (slow)
   - ≥750 orange (moderate)
   - ≥300 yellow (mild)
3. Log persists up to 200 entries in sessionStorage under key `modernvista.rpc.activity`.

#### Rationale
Vitals round out a minimal multi-domain clinical snapshot (labs, meds, vitals). Persisted and filterable activity equips developers and future users to trace performance and behavior across tabs without losing context on accidental refresh.

#### Future Considerations
- Add export button (JSON/CSV) for current activity subset.
- Provide preset filters (errors, slow calls, specific RPC).
- Allow persistence toggle (privacy-sensitive deployments).
- Add tooltip with exact timestamp + ISO rendering.

#### Risks / Notes
| Concern | Note |
|---------|------|
| sessionStorage quota errors | Silently ignored; log falls back to in-memory only |
| Over-highlighting for short spikes | Thresholds may be tuned once real latency data collected |

#### Risks / Considerations
| Risk | Mitigation |
|------|-----------|
| Potential growth of log in long sessions | Hard cap at 200 entries (FIFO) |
| Missing rpcName if backend omits field | Graceful fallback to '-' in UI; log retains entry |
| Status/event ambiguity | Explicit separate fields; future refinement can standardize mapping |

---

#### Summary
Added structured parsing for `ORWPT LIST` RPC responses via `parseOrwptList` converting caret-delimited lines into patient objects plus an issues array for malformed input lines. Introduced parsing metrics and an experimental API endpoint returning structured data.

#### Key Changes
| File | Change |
|------|--------|
| `backend/src/vista/parser/orwpt.ts` | New parser module (patients + issues) |
| `backend/src/vista/broker/session.ts` | Integrated parser; emits parse metrics in mock & experimental paths |
| `backend/src/vista/broker/metrics.ts` | Added parsing counters (patients, issues, issue reasons) |
| `backend/src/app.ts` | `/metrics` now exposes parsing counters |
| `backend/src/api/router.ts` | Added `/api/v1/patients-search` endpoint (structured response) |
| `backend/README.md` | Documented endpoint + parsing metrics |

#### Metrics Added
```
broker_parse_patients_total
broker_parse_issues_total
broker_parse_issue_reasons_total{reason="..."}
```
Reasons: `NO_DELIMITERS`, `INSUFFICIENT_FIELDS`, `MISSING_CORE_FIELDS`.

#### Endpoint Response Example
```
GET /api/v1/patients-search?q=DOE
{
   ok: true,
   term: "DOE",
   patients: [ { id: "100", name: "DOE,JOHN", gender: "M", dob: "01/12/1965", raw: "100^DOE,JOHN^1234^M^01/12/1965" }, ... ],
   issues: [],
   raw: [ "100^DOE,JOHN^1234^M^01/12/1965", ... ],
   mock: true
}
```

#### Rationale
Moves from stringly-typed patient search responses toward domain objects the UI and future AI layers can rely on (typed attributes, explicit parsing quality signals). Metrics quantify data quality and help detect protocol drift when real Broker integration begins.

#### Next Steps
1. Add unit tests covering parser edge cases & malformed lines.
2. Normalize name fields (split LAST,FIRST for UI consumption) in a view layer or parser enhancement.
3. Add date normalization (DOB → ISO) + validation metrics.
4. Extend parsing to additional RPCs (labs, medications) once integrated.
5. Consider exposing parse issue rate SLO in metrics docs.

#### Risks
| Risk | Mitigation |
|------|-----------|
| Future real RPC adds fields (ICN etc.) | Parser built to tolerate optional fields; add versioned schema docs |
| Silent parse skips | Issues array + counters make failures observable |

---
### 📅 **October 12, 2025 - Parsing Normalization & Multi-Part Size Guard**

#### Summary
Enhanced ORWPT LIST parsing with name splitting (last/first), DOB ISO normalization, gender omission tracking, and added multi-part accumulated size guard in XWB state machine. Emitted new metrics for normalization quality.

#### Key Changes
| File | Change |
|------|--------|
| `backend/src/vista/parser/orwpt.ts` | Added lastName/firstName, dobIso, stats counters (dobNormalized/dobInvalid/genderOmitted) |
| `backend/src/vista/broker/metrics.ts` | Added counters & snapshot fields for new parse normalization metrics |
| `backend/src/app.ts` | Exposed new parse metrics in Prometheus output |
| `backend/src/vista/broker/xwbState.ts` | Added multi-part accumulated size guard (512KB) returning `MULTIPART_SIZE_EXCEEDED` error |
| `backend/src/vista/parser/__tests__/orwpt.parser.test.ts` | Updated tests for new fields & stats |
| `backend/README.md` | Documented new metrics and patient fields (lastName, firstName, dobIso) |

#### New Metrics
```
broker_parse_dob_normalized_total
broker_parse_dob_invalid_total
broker_parse_gender_omitted_total
```

#### Rationale
Improves data usability for UI and future AI layers (standardized DOB, split names) while making data quality observable (invalid DOBs, gender omissions). Multi-part size guard prevents unbounded memory growth pending authentic protocol specifics.

#### Next Steps
1. Add test covering multi-part size exceed path.
2. Consider percentile timing for parsing if performance becomes critical.
3. Extend normalization to additional fields (ICN validation, future SSN hashing if present).
4. Introduce configurable max accumulated size via env var.

---
### 📅 **October 11, 2025 (Later) - Upcoming Implementation Tasks (Simple Explanations)**

Below are the next planned tasks written in very clear, plain language so anyone scanning the log understands what each does and why it matters.

| Task | Plain Explanation | Why It Matters |
|------|-------------------|----------------|
| Plan next implementation phases | Write the detailed order we will build things (protocol → data → AI) | Keeps work sequenced and efficient |
| Frame analyzer utility | Little tool that prints raw frame bytes with offsets so we can see structure | Speeds up reverse‑engineering real protocol |
| Scaffold decodeXwb state machine | Create the skeleton parser with states (READ_HEADER, READ_BODY, etc.) returning placeholders | Lets us plug real rules in gradually without big refactors |
| Implement encodeXwb basic literal params | Send a real RPC with just simple string parameters | First step from mock to real Broker traffic |
| Add sign-on sequence real RPCs | Actually perform Access/Verify + set context over the socket | Enables authenticated, authorized calls |
| Integrate real ORWPT LIST | Make patient search use real VistA data instead of mock list | First visible clinical win; validates pipeline |
| Latency histogram metrics | Record timing buckets (fast/slow percentiles) for RPC calls | Lets us tune timeouts and spot slowdowns |
| Add log redaction patterns | Automatically remove things that look like SSNs/names before logging | Prevent accidental PHI leakage |
| NLP command RPC mapping | Map natural language intents ("recent labs") to concrete RPC sequences | Bridges AI layer to structured data APIs |
| Summarization endpoint | One endpoint that gathers several RPC results and summarizes them | Provides concise patient snapshot for UI/AI |
| UI patient search live data | Frontend switches to real backend results when flag on | Proves end‑to‑end real data path |
| Labs view scaffold | Basic labs tab UI with placeholder until real labs wired | Parallel UI progress; avoids blocking on backend |
| Feature flag per RPC | Toggle each RPC (real vs mock) individually via env or config | Safe incremental rollout & debugging |
| Fixture generator from captures | Turn sanitized captured frames into stored test files | Enables repeatable parser tests without live VistA |
| Unit tests decodeXwb | Tests for parser states and edge cases using fixtures | Prevent regressions as parser evolves |
| Integration test sign-on | End-to-end test: connect, sign on, set context (skips if no creds) | CI confidence in auth path |
| Update architecture doc real framing | Document true frame bytes and rules once known | Shared knowledge; reduces re-learning later |
| README env vars update | Add Access/Verify env variables + safety warnings | Guides users to configure sign-on correctly and safely |
| Security credential doc | Clear rules: how to store, load, and never log credentials & PHI | Formalizes privacy posture for contributors |

Execution Order (initial target): Analyzer → decode scaffold → basic encode → real sign-on → patient list → flags & metrics → redaction → NLP mapping → summary endpoint → UI expansions → docs & security hardening.

Progress Tracking: Each item will move from plan → in-progress → done; partials updated inline here for transparency.

---
### 📅 **October 11, 2025 (Later) - Extended Frame Capture Added**

#### Summary
Implemented a bounded rolling frame chunk capture facility to assist with authentic XWB protocol decoding. Supplements the initial single-shot greeting capture by retaining the most recent inbound socket chunks under strict size limits. Provides forensic visibility into framing patterns (length fields, delimiters, control bytes) before real `decodeXwb` is written.

#### Files
| File | Change |
|------|--------|
| `backend/src/vista/broker/capture.ts` | Added ring buffer (25 chunks, 256B per, 4KB total cap, drop counter) |
| `backend/src/vista/broker/connection.ts` | Calls `recordFrameChunk()` on each data buffer when enabled |
| `backend/src/api/admin/metrics.ts` | Added `/broker/frames` endpoint to expose chunk snapshot |
| `README.md` | Documented `VISTA_BROKER_FRAME_CAPTURE` flag & frames endpoint |
| `docs/architecture/vista-broker-framing.md` | New Extended Frame Capture section (rationale, safety) |
| `backend/src/vista/broker/__tests__/frameCapture.test.ts` | New tests validating ring buffer truncation & caps |

#### New Environment Flag
```
VISTA_BROKER_FRAME_CAPTURE=true
```

#### Snapshot Structure
```
{
   greetingEnabled: true,
   frameCaptureEnabled: true,
   greeting: { enabled: true, captured: true, ... },
   frames: {
      count, totalBytes, dropped, cap, chunks: [ { index, length, hex, asciiPreview, ts, truncated? } ]
   }
}
```

#### Why It Matters
| Objective | Contribution |
|-----------|-------------|
| Rapid Protocol Iteration | Immediate visibility into raw framing patterns without attaching external sniffers |
| Safety | Aggressive caps + truncation mitigate PHI exposure risk |
| Debuggability | Correlate `frames.errors` metrics with exact raw chunk sequences |
| Future Testing | Captured patterns can seed fixtures for real `decodeXwb` unit tests |

#### Safety / PHI Controls
1. Disabled by default; opt-in via env flag.
2. Per-chunk truncation (256B) avoids capturing large clinical payloads.
3. Total 4KB ceiling halts further storage; increments `dropped` counter instead.
4. ASCII preview sanitizes non-printable bytes to '.' reducing accidental leakage when copying.

#### Next Steps
1. Use captured samples to implement authentic `decodeXwb` state machine.
2. Add optional redaction heuristics (pattern-based) if early real frames show incidental PHI.
3. Export sanitized sampling harness for reproducible test fixtures.

#### Risk Update
| Risk | Mitigation |
|------|------------|
| Accidental PHI retention | Strict caps + disable flag when not actively reverse-engineering |
| Misinterpretation of synthetic vs real frames | Explicit doc labeling and `BrokerFrameKind` separation |

---
### 📅 **October 11, 2025 - Phase 2 Framing & Session Stubs**

#### Summary
Advanced the experimental broker integration to **Phase 2** by introducing a formal framing scaffold, session sign-on/context stubs, timeout configuration, and an architecture reference document. Still operating in *mock response* mode for safety; no real VistA credentials transmitted yet.

#### New / Updated Artifacts
| File | Purpose |
|------|---------|
| `backend/src/vista/broker/framing.ts` | Placeholder encode/decode + sanitization + roadmap enumerator |
| `backend/src/vista/broker/session.ts` (updated) | Added `performSignOn()` + `setContext()` stubs + framing usage |
| `backend/src/config/config.ts` (updated) | Added `brokerTimeoutMs` (env: `VISTA_BROKER_TIMEOUT_MS`) & removed duplicate context property |
| `docs/architecture/vista-broker-framing.md` | Deep-dive design for session, framing phases, error domains |
| `README.md` (updated) | Phase 2 env var + table updated to reflect sign-on stubs and architecture doc link |

#### Environment Variables (Phase 2)
```
VISTA_BROKER_EXPERIMENTAL=true
VISTA_CONTEXT="OR CPRS GUI CHART"
VISTA_BROKER_TIMEOUT_MS=5000
```

#### Current Behavior (After Phase 2)
1. Feature flag still gates all broker activity.
2. Session now tracks authentication & context flags (logical only, not real RPC auth yet).
3. Framing utilities produce a textual placeholder packet + decode mock fabricated response for non-patient RPC names.
4. Patient search path unchanged in output (still mock lines) but session call now demonstrates framing encode/decode pipeline.

#### Why These Changes Matter
| Objective | Contribution |
|-----------|--------------|
| Traceable Evolution | `planFramingEvolution()` enumerates ordered phases for test assertions |
| Future Parity | Encapsulation in framing.ts reduces risk when swapping placeholder with real protocol bytes |
| Observability | Sanitization helper preps for PHI-safe logging before real data flows |
| Reliability | Timeout configuration centralized (`brokerTimeoutMs`) for connect/call instrumentation |

#### Next Steps (Phase 3 Targets)
1. Implement real Broker frame structure (length prefix + control markers).
2. Execute genuine `XUS SIGNON SETUP` & `XUS AV CODE` RPCs; store DUZ.
3. Perform `XWB SET CONTEXT` and verify success/failure path.
4. Replace mock ORWPT LIST with real invocation; compare output to CPRS reference.
5. Add latency metrics + error classification (transport vs application).
6. Introduce minimal unit tests for encode/decode invariants.

#### Risks & Mitigations Update
| Risk | New Detail | Mitigation |
|------|------------|-----------|
| Protocol Drift | Placeholder may diverge from real framing | Transition quickly once capture samples obtained |
| Silent Auth Fail | Stub sign-on masks real failures | Add explicit state flags + warning logs when real auth code lands |
| Timeout Tuning | 5s may be too short for cold VistA | Make adaptive after metrics in place |

#### Open Questions
1. Should we introduce a broker metrics middleware before real traffic? (Lean: yes, histogram per RPC.)
2. Do we persist session DUZ in memory only or expose via secured endpoint? (Likely memory only until multi-user mode.)

#### Action Items Added
| Owner | Item |
|-------|------|
| Backend | Implement authentic sign-on RPC calls (Phase 3) |
| Backend | Real frame encoding + decode routine replacement |
| Docs | Add logging / PHI redaction architecture note (separate doc) |
| QA | Define baseline expected patient list shape from live ORWPT LIST |

---
### 📅 **October 11, 2025 (Later) - Phase 3 Scaffold Kickoff**

#### Summary
Initiated Phase 3 by adding a synthetic length-prefixed frame variant and gating a simulated framed sign-on sequence behind a new env flag. Still *no real* Broker protocol bytes sent—this preserves safety while building out buffer management & timing instrumentation.

#### What Changed
| File | Change |
|------|--------|
| `backend/src/vista/broker/framing.ts` | Added `lengthPrefixed` buffer, `decodeLengthPrefixed()` helper |
| `backend/src/vista/broker/session.ts` | `performSignOn()` now checks `VISTA_BROKER_PHASE3_ENABLE` and simulates framed RPCs; call now logs durationMs |
| `docs/architecture/vista-broker-framing.md` | Updated to note Phase 3 scaffold and future framing samples table |
| `backend/src/vista/broker/metrics.ts` | New lightweight metrics aggregator (count, errors, avg, max, p95) |
| `docs/architecture/logging-philosophy.md` | Added PHI redaction & logging guidelines |

#### New Environment Flag
```
VISTA_BROKER_PHASE3_ENABLE=true   # Enables simulated framed sign-on packets (still mock)
```

#### Metrics & Observability
- Added per-RPC duration logging (scaffold) ahead of real latency metrics.
- Logging includes frame length metadata but excludes payload PHI.

#### Rationale
- Pre-building buffer & timing pathways reduces churn once real frames are known.
- Separate flag prevents accidental assumption that Phase 3 implies real auth.

#### Next (Execution Phase)
1. Capture true frame structure from live VEHU sign-on.
2. Replace synthetic length prefix with authentic XWB framing (length + control markers).
3. Implement genuine sign-on & context RPCs; validate DUZ acquisition.
4. Add structured metrics (histogram for durations, counter for errors) after first successful real sign-on.

#### Risks Update
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Dual flags confusion | Misconfiguration | Document precedence: PHASE3 flag only adds simulation on top of EXPERIMENTAL |
| Overfitting synthetic framing | Rework | Keep synthetic code minimal & well-isolated |

---
### 📅 **October 11, 2025 (Later) - Admin Metrics Endpoint Added**

#### Summary
Exposed a development-only broker metrics endpoint under `/api/v1/admin/broker/metrics` gated by `ADMIN_METRICS_ENABLE=true`. Provides snapshot of RPC counts, error rates, and basic latency stats (avg, max, p95) plus sign-on attempts.

#### Files
| File | Change |
|------|--------|
| `backend/src/api/admin/metrics.ts` | New admin router returning metrics JSON |
| `backend/src/api/router.ts` | Conditional mounting of `/admin` routes via config flag |
| `backend/src/config/config.ts` | Added `admin.metricsEnable` bound to `ADMIN_METRICS_ENABLE` |
| `README.md` | Documented new flag and endpoint usage |
| `docs/architecture/vista-broker-framing.md` | Referenced metrics aggregator & logging philosophy |

#### Endpoint Output Shape (Example)
```
{
   "rpc": {
      "ORWPT LIST": { "count": 3, "errors": 1, "avgMs": 20.1, "maxMs": 30, "p95Ms": 30 }
   },
   "signOn": { "attempts": 2, "errors": 0 }
}
```

#### Next Hardening Steps
1. Add authentication + role guard (e.g., JWT claim `admin=true`).
2. Optional: expose Prometheus scrape format later.
3. Add rolling window or histogram bins for more granular latency analysis.

#### Risk Note
Ensure flag remains disabled in production builds until auth is enforced to avoid information disclosure.

---
### 📅 **October 11, 2025 (Later) - Broker Greeting Capture Added**

#### Summary
Implemented a safe, flag-gated capture mechanism to store only the first inbound Broker socket bytes (greeting/banner) for protocol analysis prior to full real frame decoding.

#### Files
| File | Change |
|------|--------|
| `backend/src/vista/broker/capture.ts` | New in-memory capture utility (max 512 bytes) |
| `backend/src/vista/broker/connection.ts` | Hooks first `data` event when `VISTA_BROKER_CAPTURE=true` |
| `backend/src/api/admin/metrics.ts` | Added `/broker/capture` & `/broker/capture/reset` endpoints (hex/base64 snapshot + reset) |
| `README.md` | Documented `VISTA_BROKER_CAPTURE` flag and capture endpoint |

#### Environment Flag
```
VISTA_BROKER_CAPTURE=true
```

#### Privacy / Safety
- Limits to first chunk and 512 bytes to avoid accidental PHI (banner unlikely to contain patient data).
- Not persisted to disk; memory only; can be cleared by process restart.

#### Reset Endpoint Added
Implemented a lightweight reset path so repeated greeting samples can be collected without a full backend restart:
```
POST /api/v1/admin/broker/capture/reset
```
Returns `{ "reset": true }` and simply clears the in-memory first-chunk buffer.

#### Next Steps
1. After capturing real frames, populate Framing Samples table.
2. Disable capture flag by default once authentic framing implemented.
3. Use reset endpoint to collect multiple variant samples (e.g., after different delays) for protocol comparison.

---

### 📅 **October 11, 2025 (Later) - Framing Contract Expanded**

#### Summary
Introduced a forward-compatible framing contract to prepare for real XWB broker implementation while keeping existing synthetic behavior stable. Added typed enums (`BrokerFrameKind`, `BrokerFrameErrorCode`), structured packet metadata (`kind`, `meta.declaredLength`), and stubbed real protocol entry points (`encodeXwb`, `decodeXwb`). Strengthened synthetic length-prefixed decoding with explicit error codes and test coverage.

#### Files
| File | Change |
|------|--------|
| `backend/src/vista/broker/framing.ts` | Added types, error codes, `encodeXwb` / `decodeXwb`, improved synthetic encode/decode |
| `backend/src/vista/broker/__tests__/framing.test.ts` | New Jest tests for encode/decode contract & stubs |
| `docs/architecture/vista-broker-framing.md` | Documented new contract, error codes, frame kinds |

#### New Concepts
| Concept | Purpose |
|---------|---------|
| `BrokerFrameKind` | Distinguish synthetic vs future real XWB frames |
| `BrokerFrameErrorCode` | Canonical decode error semantics (SHORT_FRAME, LENGTH_MISMATCH, etc.) |
| `encodeXwb` / `decodeXwb` | Stable API surface for swapping in authentic broker framing without refactoring callers |

#### Testing
- Validates synthetic encode (text & length-prefixed) returns expected `kind`.
- Ensures mismatched length detection returns `LENGTH_MISMATCH`.
- Asserts XWB decode stub returns `INCOMPLETE` (placeholder signal for later implementation).

#### Rationale
Separating synthetic scaffolding from the real protocol via explicit `kind` and stub functions reduces risk: when authentic frame parsing is added, test baselines only need expected `kind` adjustments rather than invasive refactors.

#### Next Steps
1. Capture authentic greeting + sign-on frames with capture tooling.
2. Implement real `encodeXwb` / `decodeXwb` (length, control bytes, parameter typing).
3. Replace synthetic path behind feature flag once parity test passes.
4. Add histogram latency metrics after first real RPC success.

#### Risk Note
Until real framing lands, misinterpretation of synthetic hex-length as authentic protocol is possible; docs explicitly label it synthetic-only to mitigate confusion.

---

### 📅 **October 11, 2025 (Later) - Frame Assembler Added**

#### Summary
Introduced a `FrameAssembler` layer to coalesce partial TCP chunks into complete frames (currently synthetic length-prefixed) ahead of real XWB framing. This de-risks the transition by validating buffer lifecycle, remainder handling, and safety caps before authentic protocol bytes are parsed.

#### Files
| File | Change |
|------|--------|
| `backend/src/vista/broker/assembler.ts` | New assembler implementation (synthetic mode) |
| `backend/src/vista/broker/connection.ts` | Integrated optional assembler when Phase 3 flag enabled |
| `backend/src/vista/broker/__tests__/assembler.test.ts` | Tests covering partial, complete, multi-frame, and malformed input |
| `docs/architecture/vista-broker-framing.md` | Added Frame Assembler section |

#### Capabilities
- Partial chunk accumulation until declared length reached.
- Back-to-back frame extraction leaving remainder for subsequent parsing.
- 256KB safety ceiling to prevent memory bloat on malicious/malformed lengths.
- Clear separation so real XWB parsing slots into assembler without API churn.

#### Rationale
Ensures fundamental buffering logic is correct (often source of subtle bugs) before introducing real control sequences. Synthetic frames exercise the path; authentic decode only needs to replace parser internals.

#### Next Steps
1. Capture authentic frames to design real `decodeXwb` state machine.
2. Extend assembler to detect/control authentic start markers & length semantics.
3. Add metrics for frame assembly errors vs application errors.

---
### 📅 **October 11, 2025 (Later) - Frame Metrics Instrumented**

#### Summary
Extended broker metrics with frame assembly counters (`seen`, `complete`, `errors`, `lastError`) and wired them into the connection layer. Updated admin metrics endpoint output and tests to ensure accuracy. This provides early visibility into buffering health before real XWB frames are implemented.

#### Files
| File | Change |
|------|--------|
| `backend/src/vista/broker/metrics.ts` | Added frame counters + snapshot serialization |
| `backend/src/vista/broker/connection.ts` | Emits frame chunk / complete / error events to metrics |
| `backend/src/vista/broker/__tests__/metrics.test.ts` | Added frame metrics assertions |
| `README.md` | Updated sample admin metrics JSON with `frames` block |
| `docs/architecture/vista-broker-framing.md` | Documented frame metrics semantics |

#### Rationale
Differentiating between framing failures and RPC-level errors reduces mean time to diagnose once real protocol parsing begins.

#### Next Steps
1. Add latency histogram bins (optional) for frame assembly vs RPC processing.
2. Integrate frame metrics with future Prometheus exporter when security layer added.
3. Emit structured logs on frame error thresholds (circuit-breaker candidate).

---

## Development Journey

### 📅 **October 2, 2025 - Project Kickoff**

#### What We Did Today:
1. **Research Phase** ✅
   - Downloaded and analyzed the original CPRS source code (written in Delphi/Pascal)
   - Found that CPRS uses "RPC calls" to communicate with VistA backend
   - Discovered the system has modules for: Patient selection, Charts, Lab results, Orders, Notes, etc.

2. **Architecture Planning** ✅
   - Decided on **hybrid AI approach**: 
     - **Primary**: Local AI models (Ollama) for privacy and speed
     - **Fallback**: Cloud AI APIs for complex medical queries
   - Chose modern web technologies:
     - **Frontend**: React (for the user interface)
     - **Backend**: Node.js (for the server)
     - **Database**: Keep using VistA's existing MUMPS database

3. **Project Structure** ✅
   - Created clean, organized folder structure
   - Separated concerns: frontend (what users see), backend (server logic), docs (documentation)

#### Key Decisions Made:
- **Design Philosophy**: Follow Braun design principles (clean, minimal, functional)
- **AI Strategy**: Local-first for privacy, cloud-enhanced for advanced features
- **Development Location**: Using 4TB NVMe drive for performance

---

## Technical Architecture (Simplified)

### How It All Works Together:

```
User Types/Speaks → Natural Language AI → Translates to Commands → VistA Database → Results Back to User
```

**Example**: 
- User says: *"Show me John Smith's lab results from last week"*
- AI understands this means: Find patient "John Smith" + Get lab data + Filter by date range
- System makes RPC calls to VistA to get the data
- Results displayed in clean, modern interface

### Folder Structure Explained:

```
ModernVista/
├── backend/           # Server-side code (handles data and AI)
│   ├── src/
│   │   ├── core/      # Main business logic
│   │   ├── vista/     # Talks to VistA database
│   │   ├── nlp/       # Natural language processing
│   │   ├── api/       # Web API endpoints
│   │   └── config/    # Settings and configuration
├── frontend/          # User interface (what doctors/nurses see)
│   ├── src/
│   │   ├── components/    # Reusable UI pieces
│   │   ├── modules/       # Main features (patients, orders, etc.)
│   │   ├── nlp/           # AI interface components
│   │   └── services/      # Connects to backend
└── docs/              # Documentation and guides
```

---

## Natural Language Features Planned

### What Users Can Say/Type:

#### **Patient Management**
- *"Find patient John Smith born 1965"*
- *"Show me all diabetic patients"*
- *"Open chart for patient in room 302"*

#### **Chart Navigation**
- *"Show labs from last week"*
- *"Display recent vital signs"*
- *"Open medication list"*

#### **Order Entry**  
- *"Order CBC and basic metabolic panel"*
- *"Schedule follow-up in 2 weeks"*
- *"Request chest X-ray stat"*

#### **Information Queries**
- *"What medications is this patient allergic to?"*
- *"Show me abnormal lab results"*
- *"List active prescriptions"*

---

## Technology Choices (And Why)

### **Frontend: React + TypeScript**
- **React**: Most popular web framework, lots of support
- **TypeScript**: Catches errors early, makes code more reliable
- **Tailwind CSS**: Fast, consistent styling

### **Backend: Node.js + Express**
- **Node.js**: Fast, JavaScript everywhere (same language as frontend)
- **Express**: Simple, proven web server framework

### **AI/NLP: Ollama + Cloud APIs**
- **Ollama**: Runs AI models locally (private, fast, offline-capable)
- **Cloud APIs**: For advanced medical reasoning when needed
- **Hybrid**: Best of both worlds - privacy + power

### **Database: Existing VistA/MUMPS**
- **Why**: Don't break what's working - use existing patient data
- **How**: Connect via RPC calls (same as old CPRS)

---

## Development Phases

### **Phase 1: Foundation** (Current)
- [x] Project setup and structure
- [x] Architecture planning
- [ ] Basic web server setup
- [ ] VistA RPC connection testing
- [ ] Simple patient lookup

### **Phase 2: Core Features**
- [ ] Patient selection interface
- [ ] Basic chart viewing
- [ ] Simple natural language commands
- [ ] Authentication system

### **Phase 3: Advanced NLP**
- [ ] Ollama integration
- [ ] Voice command support
- [ ] Complex medical queries
- [ ] Cloud AI fallback

### **Phase 4: Clinical Modules**
- [ ] Lab results interface
- [ ] Order entry system
- [ ] Clinical notes
- [ ] Reports and printing

### **Phase 5: Polish & Deployment**
- [ ] Performance optimization
- [ ] Security hardening
- [ ] User testing
- [ ] Production deployment

---

## Next Steps

1. **Set up development environment**
   - Initialize Node.js project
   - Create basic React app
   - Set up Docker containers

2. **Test VistA connection**
   - Connect to existing VistA system
   - Test basic RPC calls
   - Verify patient data access

3. **Build basic UI**
   - Create login screen
   - Design patient selection interface
   - Implement navigation structure

---

## Notes for Future Developers

### **Key Concepts to Understand:**
- **RPC (Remote Procedure Call)**: How we talk to VistA database
- **MUMPS**: The database language VistA uses (we don't need to write it, just call it)
- **CPRS Modules**: Patient, Chart, Orders, Labs, Meds, Notes, Reports
- **Healthcare Data**: Patient privacy is critical - HIPAA compliance required

### **Development Guidelines:**
- Keep code simple and readable
- Document everything in plain English
- Test with real healthcare workflows
- Security and privacy first
- Performance matters in clinical settings

### **Useful Resources:**
- OSEHRA VistA Documentation
- Original CPRS source code (in vista-source/ folder)
- VistA RPC Documentation
- Healthcare UI/UX best practices

---

*This log will be updated daily with progress, decisions, and lessons learned.*

---
### 📅 **October 12, 2025 - Phase 5 Raw Frame Capture & Integration**

#### Summary
Implemented disk-based raw frame capture (flag-gated) to persist each broker send/recv frame as a small JSON artifact (hex + ascii preview + meta). Integrated into sign-on, context, and RPC flows, complementing in-memory chunk capture and metrics. Provides durable samples to drive upcoming authentic XWB header reverse-engineering and fixture generation.

#### Key Changes
| File | Change |
|------|--------|
| `backend/.env.sample` | Added `VISTA_BROKER_CAPTURE_RAW`, `VISTA_BROKER_CAPTURE_DIR` |
| `backend/src/vista/broker/capture.ts` | Added raw file writing logic (safe caps, directory ensure) |
| `backend/src/vista/broker/session.ts` | Calls `brokerCapture.recordSend/recordRecv` at each frame boundary |
| `backend/src/vista/broker/__tests__/capture.raw.test.ts` | Verifies capture creates expected artifacts |
| `backend/README.md` | Added Phase 5 section & safety guidance |

#### Environment Flags
```
VISTA_BROKER_CAPTURE_RAW=true
VISTA_BROKER_CAPTURE_DIR=./captures
```

#### Safety Controls
| Control | Purpose |
|---------|---------|
| Disabled by default | Prevent accidental PHI persistence |
| JSON limited to hex + ascii preview | Avoid binary confusion; easy diffing |
| Directory configurable | Route captures to ephemeral or ignored storage |
| Encouraged .gitignore entry | Avoid committing sensitive payloads |

#### Why It Matters
1. Enables offline protocol analysis & fixture creation without rerunning live sessions.
2. Decouples decode development from live system availability.
3. Ensures reproducibility—bugs in future decoders can be regression tested against stored frames.

#### Next Actions Toward Real XWB
1. Capture genuine sign-on + ORWPT LIST frames in a secure environment.
2. Derive authentic header/control byte structure; document in `docs/architecture/vista-broker-framing.md`.
3. Implement `XwbCodec` real header parse (maintain backward compatibility via flags).
4. Introduce redaction pass (names, identifiers) before disk write (optional secondary mode).
5. Generate sanitized fixtures for `decodeXwb` state machine tests.

#### Risks
| Risk | Mitigation |
|------|-----------|
| PHI persisted accidentally | Keep flag off by default; add optional redaction; educate contributors |
| Large disk growth | Small frames + typical limited RPC volume; can add rotation janitor later |

---
### 📅 **October 12, 2025 - Phase 4 XwbCodec Stub & Binary Framing Scaffold**

#### Summary
Introduced `XwbCodec` as a provisional binary framing abstraction wrapping existing synthetic payloads in a simple header: `0x01 | uint16_be_length | payload`. Flag-gated via `VISTA_BROKER_XWB_ENABLE`. Establishes a seam where authentic XWB framing will be swapped in without modifying session logic.

#### Key Changes
| File | Change |
|------|--------|
| `backend/src/vista/broker/codec.ts` | Added `XwbCodec`, updated `createDefaultCodec()` flag selection |
| `backend/src/vista/broker/__tests__/xwbcodec.test.ts` | Tests for start marker, length validation, corruption handling |
| `backend/.env.sample` | Added `VISTA_BROKER_XWB_ENABLE` |
| `backend/README.md` | Documented Phase 4 flag and framing format |

#### Why This Layer
| Goal | Contribution |
|------|--------------|
| Swap real framing later | Centralizes encode/decode behind interface |
| Minimize refactors | Session interacts only with `FrameCodec` contract |
| Early integrity checks | Length mismatch tests already ensure header sanity |

#### Planned Evolution
1. Replace provisional header with authentic XWB start/control bytes.
2. Add parameter typing & sequence handling (multi-part results?).
3. Support streaming large responses via assembler once real chunk boundaries known.

#### Metrics Impact
Future: add codec-level counters for header parse failures to differentiate transport vs framing vs RPC errors.

---
### 📅 **October 12, 2025 - Phase 6 Real XWB Decode Scaffold**

#### Summary
Added initial real XWB decode pathway scaffolding: new `XwbStateMachine` (states: HEADER → BODY → COMPLETE/ERROR) and environment flag `VISTA_BROKER_XWB_REAL_ENABLE`. When the flag is enabled, `decodeXwb` instantiates the state machine and attempts to parse provisional frames using the existing placeholder header format (`0x01 | uint16_be_length | payload`). This isolates future authentic header/control-byte logic behind a stable state interface without disrupting current synthetic or provisional codec behavior.

#### Key Changes
| File | Change |
|------|--------|
| `backend/.env.sample` | Added `VISTA_BROKER_XWB_REAL_ENABLE` flag |
| `backend/src/vista/broker/xwbState.ts` | New state machine scaffold (safety caps, incremental feed) |
| `backend/src/vista/broker/framing.ts` | `decodeXwb` now delegates to state machine when real flag set |
| `backend/src/vista/broker/codec.ts` | `XwbCodec.decode` invokes real decode path when flag enabled |
| `backend/src/vista/broker/__tests__/xwbstate.test.ts` | Unit tests for state transitions & decode integration |

#### Current Behavior (Flag On)
| Stage | Behavior |
|-------|----------|
| HEADER | Validates start marker (0x01) + reads declared length |
| BODY | Waits until full payload available; incomplete returns needed byte count |
| COMPLETE | Splits payload into newline-delimited lines (synthetic placeholder) |
| ERROR | Emits canonical synthetic error mapping (BAD_START → UNKNOWN_FORMAT, BODY_TOO_LARGE → LENGTH_MISMATCH) |

#### Why This Matters
| Goal | Contribution |
|------|-------------|
| Incremental Real Protocol | Establishes parsing skeleton before authentic format known |
| Testability | Deterministic states allow unit tests independent of live VistA |
| Backward Compatibility | Other modes unaffected; real path gated by explicit flag |
| Risk Containment | Error mapping confines provisional errors to existing enum types |

#### Next Implementation Steps
1. Capture authentic sign-on and a simple RPC frame; derive true header layout (start control bytes, length, type codes, terminators).
2. Extend `XwbStateMachine` to parse multi-part or segmented results if present (introduce INTERIM state if needed).
3. Implement parameter typing metadata (string/list/global) for request encode path.
4. Introduce redaction & PHI-aware line parser before storing capture artifacts in raw mode.
5. Add metrics counters for state machine errors vs RPC-level errors (disambiguation metric).
6. Create fixture generator converting captured frames → JSON test vectors (round‑trip encode/decode assertions).

#### Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Placeholder header diverges from real | Clear docs + fast replacement once samples obtained |
| Silent parse failure on real frames | Add explicit checksum/control-byte validation once defined |
| Growing error taxonomy complexity | Maintain single enum mapping layer; avoid leaking provisional internal codes |

#### Open Questions
1. Do real responses ever exceed single length field (chunked / streaming)?
2. Are there control bytes signaling error conditions distinct from RPC body content?
3. Is there a session or sequence identifier per frame that must be validated?

---
### 📅 **October 12, 2025 - Redaction Layer & Metrics Endpoint**

#### Summary
Implemented PHI redaction for raw frame capture and exposed a Prometheus-style `/metrics` endpoint (flag-gated) surfacing broker RPC and frame metrics. Enhances safety of protocol reverse-engineering and introduces initial observability plumbing.

#### Key Changes
| File | Change |
|------|--------|
| `backend/src/vista/broker/capture.ts` | Added regex-based redaction (SSN, DOB, NAME), applied prior to JSON persistence |
| `backend/src/vista/broker/__tests__/redaction.test.ts` | Tests masking sensitive patterns |
| `backend/src/app.ts` | Added `/metrics` route when `ADMIN_METRICS_ENABLE=true` |
| `backend/.env.sample` | Introduced `VISTA_BROKER_CAPTURE_REDACT` flag |
| `backend/README.md` | Documented redaction, updated Phase 5/6, added Phase 7 plan & metrics format |

#### Flags
| Flag | Purpose |
|------|---------|
| `VISTA_BROKER_CAPTURE_REDACT` | Enable PHI redaction before writing raw capture JSON |
| `ADMIN_METRICS_ENABLE` | Expose `/metrics` endpoint (Prometheus text format) |

#### Metrics Exposed
`broker_rpc_count`, `broker_rpc_errors_total`, `broker_rpc_max_ms`, `broker_rpc_p95_ms`, `broker_rpc_avg_ms`, `broker_signon_attempts`, `broker_signon_errors`, `broker_frames_seen`, `broker_frames_complete`, `broker_frames_errors`, optional `broker_frames_last_error_code{code="..."}`.

#### Safety Considerations
Redaction is heuristic; artifacts still treated as sensitive. Further enhancements planned: token classification for medical terms, configurable custom patterns, redaction counters.

#### Next Steps
1. Add header parse error metrics once authentic header implemented.
2. Introduce redaction metrics counters (applied rule counts) under new gauge/counter names.
3. Provide `/metrics` authentication (basic token) for non-dev deployments.

---
### 📅 **October 12, 2025 - XWB Header Strategy Refactor**

#### Summary
Refactored `XwbStateMachine` to use a pluggable header strategy abstraction (`XwbHeaderStrategy`) enabling seamless introduction of the authentic XWB header parser without altering body/state handling code.

#### Details
Added:
* `XwbHeaderStrategy` interface (`minBytes`, `parse()` returning structured result)
* `ProvisionalHeaderStrategy` implementing existing provisional format: `0x01 | uint16_be_length`
* Injected strategy via `XwbStateMachineOptions.headerStrategy` (defaults to provisional)
* `XwbStateResult.header` now surfaces parsed header metadata for downstream logging / metrics.

#### Benefits
| Concern | Resolution |
|---------|-----------|
| Future authentic header fields | Strategy swap without touching body logic |
| Testing | Can inject mock strategy to simulate errors/edge cases |
| Metrics/Observability | Header metadata available early for counters |
| Incremental Delivery | Real header parser can land in isolation, minimizing diff size |

#### Next Steps
1. Implement `RealXwbHeaderStrategy` once empirical frame samples available.
2. Add header error metrics (`broker_header_errors_total{reason=...}`).
3. Expand strategy to signal multi-part frames (introduce `continuation` flag in parse result).

---
### 📅 **October 12, 2025 - Multi-Part Robustness Metrics & Session State Gauge**

#### Summary
Expanded observability around multi-part frame assembly, session lifecycle, and RPC timeout behavior. Added counters for multi-part sequence start/completion, size guard exceed events (previously present), continuation segment count, and a SHA1 checksum label for the last completed multi-part payload. Introduced an RPC timeout counter and a session state gauge emitting the current lifecycle phase. Extended parsing metrics with name split failure and strict DOB drop counters. All metrics surfaced at `/metrics` (Prometheus text) when `ADMIN_METRICS_ENABLE=true`.

#### Key Changes
| File | Change |
|------|--------|
| `backend/src/vista/broker/metrics.ts` | Added multipart start/completed counters, checksum, rpcTimeouts, sessionState gauge setters |
| `backend/src/vista/broker/xwbState.ts` | Instrumented continuation, multipart start detection, checksum calculation, completion counters |
| `backend/src/vista/broker/session.ts` | Wired session state transitions & timeout recording |
| `backend/src/app.ts` | Exported new metrics (timeouts, session state, multipart, checksum) |
| `backend/README.md` | Documented new metrics & related env vars |
| `backend/src/vista/broker/__tests__/xwb.multipart.metrics.test.ts` | Tests multipart start/completed + checksum |

#### New Metrics
```
broker_frames_continuations_total
broker_frames_multipart_started_total
broker_frames_multipart_completed_total
broker_frames_multipart_exceeded_total
broker_frames_multipart_checksum{sha1="<hex>"} 1
broker_rpc_timeouts_total
broker_session_state{state="idle|connecting|signing_on|context|ready|error|closed"} 1
broker_parse_name_split_failed_total
broker_parse_dropped_strict_dob_total
```

#### Environment Variables (Updated / Related)
```
VISTA_BROKER_MULTIPART_MAX_KB=512        # accumulated size guard (KB)
VISTA_PARSE_STRICT_DOB=true              # drop patients with invalid DOB
VISTA_BROKER_REDACT_EXTRA=REGEX1|REGEX2  # additional redaction patterns
```

#### Rationale
Multi-part sequences can conceal performance issues or memory growth risks; explicit start/completion & checksum metrics enable correlation with higher-level RPC latencies and ensure integrity across reassembly changes. Session state gauge aids operational dashboards (stuck sessions, error loops). Timeout counter informs tuning of `VISTA_BROKER_RPC_TIMEOUT` before real traffic.

#### Next Steps
1. Add alerting thresholds (e.g., high timeout rate >5% of RPCs).
2. Optional: expose multi-part average parts per sequence.
3. Add per-state dwell time counters (time spent in each session state) if needed for diagnosing connect/auth slowness.
4. Integrate metrics into a Grafana dashboard (future Prometheus scrape).

#### Risks
| Risk | Mitigation |
|------|-----------|
| High-cardinality checksum label churn | Only last checksum retained; acceptable until real large payload frequency known |
| Misinterpretation of single continuation as performance issue | Provide dashboard annotation clarifying provisional continuation heuristic |
| Timeout metric inflation in mock mode | Distinguish mock vs experimental via future label (planned) |

---
### 📅 **October 12, 2025 - Broker Mode Gauge & Session Dwell Metrics**

#### Summary
Introduced `broker_mode` gauge to distinguish mock vs experimental operating paths, and per-session-state dwell time counters (`broker_session_state_dwell_ms{state="..."}`) accumulating wall-clock milliseconds spent in each lifecycle state. Added consolidated `e2e.smoke.test.ts` plus CI workflow (`backend-ci.yml`) for automated test runs on push/PR.

#### Key Changes
| File | Change |
|------|--------|
| `backend/src/vista/broker/metrics.ts` | Added mode snapshot field, dwell timers (transition logic) |
| `backend/src/vista/broker/session.ts` | Replaced setSessionState with transitionSessionState to accrue dwell times |
| `backend/src/app.ts` | Exported `broker_mode` and `broker_session_state_dwell_ms` metrics |
| `backend/src/__tests__/e2e.smoke.test.ts` | New consolidated smoke test (health, patients-search, NLP, metrics) |
| `.github/workflows/backend-ci.yml` | GitHub Actions workflow for backend test CI |
| `backend/README.md` | Documented new metrics and smoke test guidance |

#### New Metrics
```
broker_mode{mode="mock"} 1
broker_mode{mode="experimental"} 1  (only one present with value 1 at a time)
broker_session_state_dwell_ms{state="connecting"} <ms>
broker_session_state_dwell_ms{state="ready"} <ms>
... (other states as they occur)
```

#### Rationale
Operational dashboards and alerting benefit from explicit mode labeling (avoids misattributing mock latency). Dwell times surface where sessions spend time (e.g., excessive `connecting` time due to network issues).

#### Next Steps
1. Emit a counter for session restarts to correlate with dwell anomalies.
2. Optionally normalize dwell to percentages at scrape time (export helper doc example).
3. Add alert rule examples (e.g., high proportion of time in `connecting` > threshold).

#### Risks
| Risk | Mitigation |
|------|-----------|
| High-cardinality if future per-user sessions tracked | Currently single shared session; if multi-session introduced, add labels carefully or aggregate | 
| Clock skew in containers affecting dwell accuracy | Uses monotonic Date.now() deltas within single process; acceptable for coarse visibility |

---
### 📅 **October 13, 2025 - Allergies Tab & Clinical Data Expansion**

#### Summary
Added allergies endpoint and UI tab to complete the core clinical data modules. The Patient Explorer now provides comprehensive coverage: summary, labs, medications, vitals, and allergies with consistent styling and RPC activity logging.

#### Key Changes
| File | Change |
|------|--------|
| `backend/src/api/router.ts` | Added `/api/v1/allergies/:patientId` mock endpoint with rpcName `ORQQAL ALLERGIES` |
| `frontend/src/services/patients.ts` | Added `Allergy` interface and `getAllergies()` service function |
| `frontend/src/components/PatientExplorer.tsx` | Extended to support allergies tab with severity color coding and status badges |

#### Allergy Data Schema
```typescript
interface Allergy {
  id: string;
  allergen: string;     // "Penicillin", "Peanuts", "Latex"
  reaction: string;     // "Rash, hives", "Anaphylaxis" 
  severity: string;     // "Mild", "Moderate", "Severe"
  onset: string;        // ISO timestamp
  status: string;       // "Active", "Inactive"
  type: string;         // "Drug", "Food", "Environmental"
}
```

#### UI Enhancements
- Severity-based text coloring (red for severe, orange for moderate, gray for mild)
- Status badges (red background for active allergies, gray for inactive)
- Consistent table styling matching other clinical tabs
- Proper accessibility attributes and loading states

#### Mock Data Includes
- Penicillin allergy (moderate severity, drug type)
- Peanut allergy (severe, food type) 
- Latex allergy (mild, environmental type)

#### Rationale
Allergies are critical safety information in healthcare workflows. Having this data visible alongside other clinical information provides a complete patient snapshot and supports clinical decision-making. The severity and status indicators help prioritize attention to active, high-risk allergies.

#### Next Steps
1. Add orders/prescription management interface for medication ordering workflows
2. Implement clinical notes viewer for documentation access
3. Add data export functionality (JSON/CSV) for patient records
4. Begin real VistA RPC integration replacing mock endpoints

---

### 📅 **October 12, 2025 - Strict Header Stub & Metrics Expansion**

#### Summary
Added `RealXwbHeaderStrategy` stub (two-byte start 0x00 0x01 + uint16 length) behind `VISTA_BROKER_XWB_REAL_STRICT` and expanded metrics to include header error counters and redaction rule application counts.

#### Key Changes
| File | Change |
|------|--------|
| `xwbState.ts` | Strategy selection based on `VISTA_BROKER_XWB_REAL_STRICT`; added real stub strategy |
| `framing.ts` | Records header errors via broker metrics during decode failures |
| `metrics.ts` | Added headerErrors, headerErrorReasons, redactionApplied, redactionRuleCounts |
| `capture.ts` | Emits redaction metrics when rules applied |
| `app.ts` | `/metrics` now outputs header & redaction series |
| `header.strategy.test.ts` | Tests strategy selection and strict stub expectations |
| `redaction.metrics.test.ts` | Verifies redaction metrics increment |
| `.env.sample` | Added `VISTA_BROKER_XWB_REAL_STRICT` |
| `backend/README.md` | Documented strict flag + new metrics lines |

#### Metrics Added
`broker_header_errors`, `broker_header_error_reasons_total{reason="..."}`, `broker_redaction_applied`, `broker_redaction_rule_total{rule="..."}`.

#### Rationale
Allows early validation tooling (metrics + tests) to be in place prior to integrating real header semantics, lowering integration risk and providing observability for decode failures.

#### Next Steps
1. Replace stub header strategy once authentic frame samples captured.
2. Add latency histogram for full decode path (header to COMPLETE).
3. Include redaction rule counts in Prometheus documentation section.

---
### 📅 **October 12, 2025 - Decode Latency Histogram**

#### Summary
Added decode latency histogram instrumentation for the XWB decode path. Every invocation of `decodeXwb` (success, incomplete, or error) now records wall-clock latency into fixed buckets `[1,2,5,10,20,50,100,250,500,1000,+Inf]` (milliseconds). Exported via Prometheus histogram series: `broker_decode_latency_ms_*`.

#### Implementation
* `metrics.ts`: Added bucket configuration, counts, sum, count, and `recordDecodeLatency()`.
* `framing.ts`: Wrapped decode path with start/stop timing; records latency even when real flag disabled.
* `/metrics`: Exposes histogram in standard Prometheus format.
* Tests: `decode.latency.test.ts` ensures a decode increments histogram.

#### Use Cases
| Goal | Benefit |
|------|---------|
| Performance regression detection | Track shifts in p95 decode time before real protocol integration |
| Capacity planning | Early baseline for expected per-frame processing cost |
| Alerting groundwork | Histogram supports SLO burn-rate alerts once aggregated |

#### Next Steps
1. Add separate histogram for end-to-end RPC (encode → decode complete).
2. Record header parse vs body assembly time separately (two-phase latency metrics).
3. Provide optional higher-resolution buckets if `VISTA_BROKER_METRICS_HIGH_RES=true`.

---
### 📅 **October 12, 2025 - End-to-End RPC Latency Histogram**

#### Summary
Captured full RPC end-to-end latency (encode → transport send/read → decode/mock fallback) in a separate histogram series. Supports distinguishing on-wire + session orchestration cost from pure decode overhead.

#### Implementation
* `metrics.ts`: Added `rpcE2E` buckets `[5,10,20,50,100,200,500,1000,2000,5000,+Inf]`, counts, sum, count and `recordRpcE2ELatency()`.
* `session.ts`: Records E2E latency right after RPC completion.
* `/metrics`: Exposes histogram under `broker_rpc_e2e_latency_ms_*`.
* Tests: `rpc.e2e.latency.test.ts` validates histogram increment.

#### Rationale
| Objective | Benefit |
|-----------|---------|
| Performance Baseline | Separate view from decode-only latency to identify future bottlenecks (e.g., network vs parsing). |
| SLA/SLO Design | Enables latency objectives per RPC aggregate once real backend connectivity is added. |
| Regression Detection | Fine-grained bucketization highlights shifts in median vs tail before production rollout. |

#### Next Steps
1. Tag latency metrics with RPC name label (opt-in flag) while controlling cardinality.
2. Add per-RPC p95 gauge export synthesized from histogram at scrape time (optional).
3. Correlate sign-on latency with first RPC latency (warm vs cold session metric).

---
### 📅 **October 12, 2025 - Multi-Part Frame Scaffold**

#### Summary
Introduced provisional multi-part / streaming frame support using a continuation marker (length=0) that produces an `INTERIM` state. Subsequent payload frames are accumulated until completion. Added continuation metrics.

#### Implementation
* `xwbState.ts`: Added `INTERIM` state, `continuation` flag on header, parts accumulation, continuation marker heuristic (length=0).
* `metrics.ts`: Added `frameContinuations` counter (exposed as `broker_frames_continuations`).
* `framing.ts`: Records continuation metric when `INTERIM` encountered.
* Tests: `xwb.multipart.test.ts` validates INTERIM -> COMPLETE assembly path.

#### Rationale
Provides an extensible pattern for real protocol multi-part responses without locking into provisional framing details. The heuristic (length=0) is easy to remove once authentic continuation semantics are known.

#### Next Steps
1. Support multiple successive continuation markers (empty keep-alives) without resetting parts.
2. Add max accumulated size guard distinct from single-frame cap.
3. Emit metric for completed multi-part frame count vs single part.

---

### 📅 **October 10, 2025 - Experimental Broker Scaffold Added**

#### Summary
Implemented the **initial VistA RPC Broker scaffolding** to pave the way for real CPRS-compatible RPC calls. Current implementation *does not yet perform authentication or true RPC framing*—it provides a controlled pathway and feature flag to begin incremental integration without disrupting existing mock behavior.

#### What Was Added
| File | Purpose |
|------|---------|
| `backend/src/vista/broker/connection.ts` | Raw TCP socket lifecycle (connect, simple write/read placeholders) |
| `backend/src/vista/broker/session.ts` | Session orchestrator scaffold (future: sign-on, context set, RPC dispatch) |
| `backend/src/vista/rpcClient.ts` (modified) | Routes calls through broker when `VISTA_BROKER_EXPERIMENTAL=true` |
| `backend/src/config/config.ts` (modified) | Added `config.vista.context` sourced from `VISTA_CONTEXT` env var |
| `README.md` (updated) | RPC table marks `ORWPT LIST` as 🧪 Experimental; documented env flags |

#### New / Updated Environment Variables
```
VISTA_CONTEXT="OR CPRS GUI CHART"       # Default CPRS option context
VISTA_BROKER_EXPERIMENTAL=true           # Enable broker session path (still mock responses)
VISTA_ACCESS_CODE=PRO1234                # Placeholder (not yet used)
VISTA_VERIFY_CODE=PRO1234!!              # Placeholder (not yet used)
```

#### Current Behavior
1. When experimental flag is **off**: patient search uses legacy mock logic.
2. When **on**: backend opens a TCP connection to port 9430, logs connection, and returns caret-delimited mock patient list via broker session scaffold (transformed to JSON by `rpcClient`).
3. No sign-on handshake yet (no credentials transmitted).

#### Why This Increment Matters
| Goal | How Today’s Work Enables It |
|------|-----------------------------|
| Safe Incremental Delivery | Feature flag isolates experimental path |
| Real RPC Migration | Provides extensible session object to add framing/auth |
| Observability | Connection & session readiness logged with minimal PHI risk |
| Future Testing | Deterministic mock lines allow regression tests while protocol matures |

#### Next Implementation Steps (Planned)
1. Add framing utilities (`framing.ts`) for building XWB packets.
2. Implement `XUS SIGNON SETUP` + `XUS AV CODE` (auth handshake) → store DUZ.
3. Implement `XWB SET CONTEXT` using `VISTA_CONTEXT`.
4. Replace mock patient list with a real `ORWPT LIST` or `ORWPT LIST ALL` invocation.
5. Add timing metrics + structured logger fields (exclude raw PHI).
6. Add reconnection & idle timeout logic in session manager.
7. Write minimal integration test harness (mock socket responses first, then live mode behind an additional flag).

#### Risks / Considerations
| Risk | Mitigation |
|------|-----------|
| Early coupling to provisional API shapes | Keep broker session methods small & refactorable |
| Logging PHI accidentally once real data flows | Predefine allowlist fields; redact others early |
| Socket hangs / unclosed handles | Centralize destroy & add process signal hooks |
| Credential leakage in errors | Never log access/verify; wrap errors with generic messages |

#### Decision Log
| Decision | Rationale |
|----------|-----------|
| Use feature flag `VISTA_BROKER_EXPERIMENTAL` | Allows merging incremental broker pieces safely |
| Keep mock patient list inside broker session (temporary) | Lets us test transformation pipeline independently |
| Add `VISTA_CONTEXT` now | Avoids a second config churn later when context setting is implemented |

#### Open Questions
1. Will we support multiple concurrent user sessions or single shared service session initially? (Leaning: single shared until auth tokens required.)
2. Do we normalize all patient names to `First Last` or retain `LAST,FIRST` until UI formatting layer? (Currently converting to space form.)
3. Need a PHI logging policy doc—should be added before real data flows.

#### Action Items
| Owner | Item |
|-------|------|
| Backend | Implement framing + sign-on sequence |
| Backend | Replace mock ORWPT responses with real output mapping |
| Docs | Add PHI logging guidelines doc (`docs/architecture/logging-philosophy.md`) |
| QA | Plan test cases for authentication failure, reconnect, slow socket |

---