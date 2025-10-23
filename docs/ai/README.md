# ModernVista AI / NLP Integration Blueprint

> Status: Design Document (Pre-Implementation)  
> Scope: Dev / Research Phase – Not Enabled in Production

---
## 1. Motivation
ModernVista now returns *real* clinical slices via live VistA RPCs. The next evolutionary step is to layer **deterministic summarization** and **grounded question answering (Q/A)** without jeopardizing stability, privacy, or maintainability.

Goals:
- Zero regressions to core patient retrieval
- Deterministic, cache-friendly summaries (hash stable)
- Grounded answers citing the *exact* data lines used
- Local‑first inference; optional cloud escalation
- Clean separation: Node fetches & normalizes, Python reasons

---
## 2. Design Pillars
| Pillar | Rationale | Mechanism |
|--------|-----------|-----------|
| Determinism | Cache reuse & testability | Canonical JSON + SHA256 hash |
| Isolation | Keep AI failures from impacting core API | Out-of-process Python service |
| Grounding | Prevent hallucinations | Strict context window from bundle |
| Progressive Disclosure | Phase gates reduce risk | Feature flags + phased rollout |
| Minimal PHI Exposure | Dev only but still careful | Redaction + no raw free-text logging |

---
## 3. High-Level Architecture
```
[VistA] --RPC--> [Node Backend] --canonical bundle--> [Python FastAPI AI]
                                      |                           |
                                   (hash)                     (Models / Embeddings)
                                      |                           |
                                [Redis Cache]<----store----> (Summary / Vectors)
                                      |
                                 [Frontend UI]
```

---
## 4. Patient Bundle Contract
A **canonical bundle** is produced by Node *before* any AI call. Keys ordered, arrays sorted where sensible, timestamps normalized.

```jsonc
{
  "patient": { "id": "123", "name": "DOE,JOHN", "dob": "1950-01-01", "sex": "M" },
  "problems": [],
  "medications": [],
  "allergies": [],
  "vitals": [],
  "labs": [],
  "meta": { "schemaVersion": 1, "generatedAt": "2025-10-14T15:00:00Z" }
}
```

Hashing rule: `sha256(utf8(JSON.stringify(bundleWithoutWhitespaceStandardized)))`.

---
## 5. Python FastAPI Service
| Endpoint | Method | Purpose | Notes |
|----------|--------|---------|-------|
| `/health` | GET | Liveness & config snapshot | No PHI |
| `/v1/summary` | POST | Generate (or recompute) patient summary | Requires bundle |
| `/v1/query` | POST | Grounded Q/A | Bundle hash or inline bundle |
| `/v1/embed` | POST | Build embeddings (phase C) | Internal/admin only |

### 5.1 Summary Response Shape
```jsonc
{
  "hash": "b1d4...",
  "generatedAt": "2025-10-14T15:03:00Z",
  "model": "local-med-small",
  "sections": [
    { "id": "problems", "title": "Key Problems", "content": "1. Diabetes Mellitus...", "sourceCount": 5 },
    { "id": "medications", "title": "Medications", "content": "Metformin 500mg BID..." }
  ],
  "narrative": "Stable metabolic control...",
  "metadata": { "omissions": [], "tokens": 512 }
}
```

### 5.2 Q/A Response Shape
```jsonc
{
  "question": "What are this patient's active medications?",
  "answer": "Metformin 500mg twice daily.",
  "citations": [ { "section": "medications", "indices": [0] } ],
  "method": "vector+llm",
  "traceId": "abc123"
}
```

---
## 6. Summarization Pipeline (Phase A)
1. Node builds canonical bundle
2. Computes hash, checks Redis (`summary:{hash}`)
3. Cache miss → POST to `/v1/summary`
4. Python: pre-filter (truncate long lab histories)
5. Compose prompt (section templates + constraints)
6. Local model attempt (Ollama / GGUF) → if fail & allowed fallback to cloud
7. Validate output JSON schema (Pydantic)
8. Return & cache with TTL (e.g., 300s)

Failure surface: return explicit error block; Node passes through with 502.

---
## 7. Grounded Q/A (Phase B)
Retrieval tiers:
1. Exact field / regex match (fast path)
2. Shallow semantic chunk embeddings (vitals/labs lines + section summaries)
3. Rerank (optional) → Compose answer context window
4. Local LLM generation with explicit citation scaffolding
5. Cloud fallback (if `AI_QA_CLOUD_FALLBACK=true`)

All answers MUST include at least one citation entry; otherwise treat as failure.

---
## 8. Embeddings (Phase C)
| Aspect | Choice (Initial) | Rationale |
|--------|------------------|-----------|
| Store | Qdrant (container) | Simple, typed payloads, fast filters |
| Distance | Cosine | Standard for sentence vectors |
| Dimensionality | Model dependent (e.g. 768) | Model compatibility |
| Namespacing | `patient:{id}:{hash}` | Isolation per bundle |

Rolling strategy: purge embeddings when superseded by new bundle hash for same patient.

---
## 9. Caching & Invalidation
| Cache Key | Contents | TTL |
|-----------|----------|-----|
| `summary:{hash}` | Summary JSON | 300s (configurable) |
| `qa:{hash}:{questionHash}` | Q/A answer payload | 120s |

Invalidation triggers: new bundle hash (data changed), manual refresh (`?refresh=1`).

---
## 10. Environment & Flags
```
AI_SUMMARY_ENABLE=true
AI_QA_ENABLE=false
AI_SERVICE_URL=http://localhost:5005
AI_EMBED_STORE=qdrant
AI_QA_CLOUD_FALLBACK=false
AI_MODEL_LOCAL=med-small
AI_MODEL_CLOUD=gpt-4o-mini
AI_MAX_SECTION_TOKENS=800
```

---
## 11. Security / Privacy (Dev Scope)
| Concern | Mitigation |
|---------|------------|
| PHI in logs | Structured logs: no raw free text; truncate >200 chars |
| External model exposure | Redaction (simple pattern rules) + opt-in fallback |
| Unauthorized AI endpoints | Bind service to localhost; gateway via backend only |
| Vector store PHI persistence | Store only hashed patient ID & minimal text segments |

---
## 12. Failure Modes & Resilience
| Failure | Node Behavior | User Impact |
|---------|---------------|-------------|
| AI service down | 503 on summary/Q/A endpoints | Core clinical data unaffected |
| Model timeout | Abort after configurable budget | Graceful error message |
| Cache unavailable | Bypass cache (higher latency) | Still functional |
| Embedding store error | Skip semantic tier; downgrade | Possibly less relevant answers |

---
## 13. Roadmap (AI Layer)
| Phase | Deliverable | Status |
|-------|-------------|--------|
| A | Deterministic summary endpoint | Pending |
| B | Grounded Q/A endpoint | Pending |
| C | Embeddings + retrieval layer | Pending |
| D | Longitudinal trend narratives | Pending |
| E | Cohort aggregation | Pending |

---
## 14. Local Development Setup (Preview)
```bash
# (future) Start Python service
cd ai-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 5005
```

For now this document is a blueprint; code will be added incrementally behind flags.

---
## 15. Open Questions
- Do we need patient-level opt-outs for AI features even in dev?
- Should summaries include structured change deltas (previous hash comparison)?
- Embedding TTL vs on-demand regeneration trade-offs.

---
## 16. Next Steps
1. Implement bundle builder in Node (pure function + tests)
2. Add `/patients/:id/summary` endpoint (flag guarded)
3. Scaffold FastAPI service with `/health` + `/v1/summary` (stub)
4. Add Redis to docker-compose (optional dev)
5. Write snapshot tests for bundle hashing determinism

---
*End of Blueprint – iterate via PRs; keep this doc updated with any contract changes.*
