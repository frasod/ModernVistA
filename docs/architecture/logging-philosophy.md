# Logging & PHI Redaction Philosophy

Status: Draft
Updated: 2025-10-10

## Objectives
- Provide actionable operational insight (performance, errors, state transitions)
- Prevent Protected Health Information (PHI) / Personally Identifiable Information (PII) leakage
- Support future audit & compliance reporting
- Remain lightweight (no heavy vendor lock-in early on)

## Classification Levels
| Level | Examples | Contains PHI? | Allowed Fields |
|-------|----------|--------------|----------------|
| DEBUG | Frame construction, mock decoding | Never | rpcName, durations, counts, feature flags |
| INFO  | Session ready, sign-on success, context set | No | rpcName, context (option name), timing, boolean flags |
| WARN  | Timeouts, reconnect attempts | No | errorCode, attempt counters |
| ERROR | Sign-on failure, decode mismatch | No PHI; abstract messages | errorCode, rpcName, durations |
| FATAL | Process-wide unrecoverable | No PHI | reason, component |

PHI (names, SSNs, DOB, addresses, medical content) must never be logged directly.

## Redaction Strategy
1. Upstream transformation layers remove or tokenize PHI before logging.
2. Use `sanitizeForLog()` for any line-based Broker output (drops/obfuscates suspicious patterns: SSN-like digits, truncates long lines).
3. Any future parser that extracts clinical data must pass only aggregate counts or hashed identifiers to logs.

## Prohibited in Logs
- Full patient names ("DOE,JOHN", "John Smith")
- SSN or last 4 if not strictly required (avoid altogether if possible)
- DOB in full fidelity (age bucket acceptable later if needed)
- Free-text note content / lab narratives
- Access/Verify codes

## Allowed Identifiers (If Necessary)
| Type | Form | Rationale |
|------|------|-----------|
| Internal numeric DFN | e.g. 100 | Operative join key, minimal exposure risk |
| RPC Name | e.g. ORWPT LIST | Operational routing info |
| Timing | ms integer | Performance tuning |
| Success Flag | boolean | Reliability tracking |

## Future Enhancements
- Introduce structured field allowlist middleware
- Add hash-based pseudonymization for DFN when multi-tenant concerns arise
- Integrate metrics emission (histograms) separate from log stream

## Incident Handling
If a log entry is suspected to contain PHI:
1. Disable log shipment immediately (if shipping externally)
2. Rotate & quarantine affected log files
3. Run redaction tool (to be created) to scrub patterns
4. File incident report referencing commit / deployment ID

## Tooling Roadmap
| Phase | Feature |
|-------|---------|
| 1 | Current manual sanitization helpers |
| 2 | Structured logger adapter with field allowlist |
| 3 | Automated PHI pattern scanner in CI (regex + entropy heuristics) |
| 4 | Centralized secure log aggregation (self-hosted) |

## Developer Guidelines
- Never interpolate raw buffers or patient objects directly into log messages.
- Prefer meta objects with explicit scalar fields.
- Treat any new RPC decoder output as sensitive until whitelisted.
- Review this document before adding new DEBUG lines in sensitive modules.

---
Document Owner: ModernVista Backend Team
