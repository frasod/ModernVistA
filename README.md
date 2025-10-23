# ModernVista

**A Modern Web Interface for Your Existing VistA System**

ModernVista is a clean, intelligent web interface that connects to your existing VistA Docker container. Think of it as giving your VistA system a beautiful, modern dashboard while keeping all your data safe and unchanged.

## Project Genesis: AI-Driven Architecture Analysis

ModernVista was born from a novel approach: **using Large Language Models (LLMs) to analyze CPRS architecture** and reverse-engineer its clinical workflows into a modern, browser-based interface. Instead of starting from scratch, we leveraged AI to understand decades of clinical software evolution and translate that institutional knowledge into contemporary web technology.

### The LLM Analysis Process
1. **CPRS Deconstruction**: AI models analyzed CPRS interface patterns, RPC call sequences, and clinical workflows
2. **Pattern Recognition**: Identified core clinical operations (patient search, chart navigation, order entry)
3. **Modern Translation**: Mapped legacy desktop patterns to responsive web components
4. **AI Integration Points**: Designed natural language interfaces and intelligent workflow automation

This approach preserves the clinical wisdom embedded in CPRS while enabling next-generation features like voice commands, AI-powered clinical decision support, and modern collaborative workflows.

## How It Works (Simple Explanation)

```
Your Existing VistA Docker Container    →    ModernVista (AI-Enhanced Interface)
├── All your medical data (safe!)      →    ├── Beautiful web interface  
├── Original CPRS still works          →    ├── Natural language: "Show John's labs"
├── Runs independently                  →    ├── Voice commands & AI analysis
└── worldvista/vehu (6.08GB)           →    └── Modern clinical workflows + ML insights
```

**Key Innovation**: ModernVista doesn't replace CPRS—it **evolves** it. By understanding CPRS through AI analysis, we created a browser-based interface that feels familiar to clinicians while enabling modern technologies like natural language processing, voice commands, and intelligent clinical insights.

**Safety Promise**: Your VistA Docker container remains completely independent. ModernVista enhances the experience without changing your underlying medical data or breaking existing workflows.

## Architecture: Two Separate Systems

### 🔐 Your VistA (Safe & Independent)
- **Location**: Docker container `worldvista/vehu`
- **Data**: All patient records, medical data (untouched)
- **Access**: Original CPRS interface + web interface
- **Ports**: 9430 (RPC), 8080 (web), 2222 (SSH)
- **Status**: ✅ Can run without ModernVista

### 🎨 ModernVista (Optional Enhancement)
- **Location**: `/media/frasod/4T NVMe/ModernVista/` (this folder)
- **Purpose**: Modern web interface that connects TO your VistA
- **Technology**: React frontend + Node.js backend
- **Safety**: Read-only by default, can't break your VistA data

## API Architecture: Bypassing MDWS

A key architectural decision in ModernVista is to bypass legacy middleware like MDWS (Medical Domain Web Services) and connect directly to VistA's core communication layer.

#### The Legacy Way: MDWS
Older web-based VistA applications often relied on MDWS, a SOAP-based web service layer that acted as a middleman between the web application and VistA. This added complexity, potential performance overhead, and another system to maintain.

#### The ModernVista Way: Direct RPC Communication
ModernVista uses a more direct and robust approach by implementing a modern RESTful API that communicates directly with VistA's underlying **RPC Broker** protocol. This is the same battle-tested communication method used by CPRS, VistA's primary desktop client.

```
+-----------------+      +---------------------+      +----------------------------+      +--------------------+
| React Frontend  | ---> | ModernVista Backend | ---> | VistA RPC Broker (Port 9430) | ---> | VistA Mumps Database |
| (Web Browser)   |      | (Node.js/Express)   |      | (Direct TCP Connection)    |      | (Your Docker/VistA)  |
+-----------------+      +---------------------+      +----------------------------+      +--------------------+
```

#### Advantages of this Architecture:
1.  **Performance**: By removing the middleware layer, the connection is faster and more efficient.
2.  **Control & Flexibility**: We have full control over the data exchange and can access any RPC available in VistA, not just those exposed by MDWS.
3.  **Simplicity**: The architecture is simpler, with fewer points of failure.
4.  **Modern Standards**: The backend exposes a clean, RESTful JSON API, which is the standard for modern web development, making it easier for other services to integrate with it.

In essence, ModernVista replaces the outdated MDWS with its own modern, high-performance API gateway, providing a more stable and extensible foundation.

## Philosophy

**Clean. Functional. Intelligent. AI-Informed.**

ModernVista embodies a unique development philosophy: **LLM-guided architectural evolution**. Rather than rebuilding healthcare software from scratch, we used artificial intelligence to analyze and understand the institutional knowledge embedded in CPRS, then translated that wisdom into a modern web interface.

### Core Principles:
- **AI-Driven Architecture**: Large Language Models analyzed CPRS workflows to inform our design decisions
- **Clinical Workflow Preservation**: Maintain familiar patterns clinicians trust while enabling new capabilities  
- **Browser-Native**: Leverage modern web technologies for accessibility, mobility, and integration
- **Intelligence Integration**: Natural language processing, voice commands, and AI-powered clinical insights
- **Braun Design Aesthetics**: Clean, functional interface that reduces cognitive load
- **Local-First AI**: Privacy-focused AI processing with optional cloud enhancement

### The LLM Advantage:
By using AI to deconstruct CPRS architecture, ModernVista captures decades of clinical software evolution and institutional healthcare knowledge, then presents it through a sleek, modern interface optimized for contemporary clinical workflows and emerging AI technologies.

## Architecture Overview

```
ModernVista/
├── backend/                 # Node.js/TypeScript API Server
│   ├── src/
│   │   ├── core/           # Core business logic
│   │   ├── vista/          # VistA RPC communication
│   │   ├── nlp/            # Natural Language Processing
│   │   │   ├── local/      # Ollama local models
│   │   │   ├── cloud/      # Cloud API integrations  
│   │   │   └── processor/  # NLP command processing
│   │   ├── api/            # REST API endpoints
│   │   ├── auth/           # Authentication & authorization
│   │   └── config/         # Configuration management
│   ├── docker/             # Container definitions
│   └── tests/              # Test suites
├── frontend/               # React/TypeScript Web App
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── modules/        # Feature modules (charts, orders, etc.)
│   │   │   ├── patients/   # Patient management
│   │   │   ├── charts/     # Chart viewing
│   │   │   ├── orders/     # Order entry
│   │   │   └── reports/    # Clinical reports
│   │   ├── nlp/            # NLP interface components
│   │   │   ├── CommandBar/ # Global command interface
│   │   │   ├── VoiceInput/ # Voice command processing
│   │   │   └── ChatPanel/  # Conversational interface
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API communication
│   │   └── utils/          # Utility functions
├── docs/                   # Documentation
│   ├── api/                # API documentation
│   ├── architecture/       # System architecture docs
│   └── user-guide/         # User documentation
├── deployment/             # Deployment configs
└── scripts/                # Build and development scripts
```

## Natural Language Features

### **Local-First Processing (Ollama)**
- **Privacy**: All sensitive data stays local
- **Speed**: Instant response for common commands  
- **Offline**: Works without internet connection
- **Models**: Medical-focused fine-tuned models

### **Cloud Enhancement (Optional)**
- **Complex Queries**: Advanced medical reasoning
- **Latest Models**: Access to newest AI capabilities
- **Fallback**: When local model confidence is low
- **Privacy-Safe**: Anonymized data only

### **Supported Commands**
```bash
# Patient Management
"Find patient John Smith DOB 1965"
"Show me patients with diabetes"

# Chart Navigation  
"Open labs from last week"
"Display recent vitals"
"Show medication history"

# Order Entry
"Order CBC and BMP for tomorrow"
"Schedule follow-up in 2 weeks"

# Clinical Queries
"What are this patient's allergies?"
"Show abnormal lab results"
"List active medications"
```

## Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **NLP**: Ollama (local) + OpenAI/Anthropic (cloud optional)
- **Communication**: VistA RPC Protocol + WebSocket
- **Database**: VistA/MUMPS (existing) + Redis (caching)
- **Containers**: Docker + Docker Compose

## Prerequisites

**You Need**: VistA system running and accessible

### Option A: Local Docker Container (Traditional)
```bash
# Verify your VistA is running
docker ps | grep vehu
# Should show: vehu ... Up XX minutes ... worldvista/vehu

# Check VistA is accessible
curl http://localhost:8080  # Web interface
curl http://localhost:9430  # RPC port (may timeout, that's normal)
```

### Option B: Azure Container Instance (Cloud) ✅ WORKING
ModernVista successfully connects to Azure-hosted VistA! See **[AZURE_VISTA_CONFIG.md](./AZURE_VISTA_CONFIG.md)** for complete setup.

**Verified Configuration**:
- Azure VistA: `vista-demo-frasod-832.eastus.azurecontainer.io:9430`
- Patient Search: ✅ Real data (mock: false)
- Backend: Port 3001
- Frontend: Port 5173

Quick test:
```bash
# Test Azure VistA connectivity
./test-azure-vista.sh
```

## Quick Start

### 1. Configure Backend
```bash
cd backend
cp .env.example .env

# Edit .env and set:
# VISTA_HOST=localhost (or Azure: vista-demo-frasod-832.eastus.azurecontainer.io)
# VISTA_PORT=9430
# VISTA_ACCESS_CODE=<your-code>
# VISTA_VERIFY_CODE=<your-code>
```

### 2. Start Backend
```bash
npm install
PORT=3001 npm run dev        # Runs on http://localhost:3001
```

### 3. Start Frontend (in another terminal)
```bash
cd frontend
npm install
npm run dev                  # Runs on http://localhost:5173
```

### 4. Access ModernVista
- **Modern Interface**: http://localhost:5173
- **Backend API**: http://localhost:3001/api/v1/health
- **Your Original VistA**: http://localhost:8080 (if local Docker)

**Note**: Frontend now uses port **5173** (Vite default) to avoid conflicts with other services.

## Docker Commands (For Your VistA)

```bash
# See what's running
docker ps

# Start VistA (if stopped)
docker start vehu

# Stop VistA (if needed)
docker stop vehu

# VistA container logs
docker logs vehu

# Your VistA images
docker images worldvista/vehu
```

## Documentation

- **[Development Guide](./docs/DEVELOPMENT_GUIDE.md)** - Complete development setup and workflow
- **[Docker vs ModernVista](./docs/DOCKER_VS_MODERNVISTA.md)** - Simple explanation of how they work together  
- **[Development Log](./docs/DEVELOPMENT_LOG.md)** - Daily development progress and decisions
- **[Changelog](./docs/CHANGELOG.md)** - Version history and changes
- **[Architecture Docs](./docs/architecture/)** - Technical architecture details
	- [Broker Framing](./docs/architecture/vista-broker-framing.md)
	- [Logging & PHI Philosophy](./docs/architecture/logging-philosophy.md)

## Key Points for Developers

### ✅ Safety First
- Your VistA Docker container is completely safe and independent
- ModernVista can't break your medical data
- Delete this project → VistA still works perfectly
- All development is risk-free

### 🔧 Development Ready  
- Modern stack: React + Node.js + TypeScript
- Clean architecture following Braun design principles
- Natural language processing with local AI (Ollama)
- Real-time connection to your existing VistA data

### 🚀 Getting Started
1. Ensure your VistA container is running: `docker ps | grep vehu`
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `cd frontend && npm run dev`  
4. Access modern interface: http://localhost:3000

## Contributing

This project follows clean architecture principles and Braun design philosophy. See [DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md) for detailed contribution guidelines.

## License

Apache 2.0 - Healthcare interoperability focused

## Current Live REST ↔ VistA RPC Mapping (As of 2025-10-14)

This table reflects what is actually wired right now in the running code (see `backend/src/api/router.ts`). These endpoints travel through the `VistaBrokerSession` which performs (early) sign-on framing attempts and falls back gracefully if the transport cannot yet decode a response.

| REST Endpoint | Method | VistA RPC | Status | Notes |
|---------------|--------|-----------|--------|-------|
| `/api/v1/patients-search?q=DOE` | GET | `ORWPT LIST` | ✅ | Structured patient list parsing with normalization + metrics |
| `/api/v1/labs/:patientId` | GET | `ORWLRR LABS` | ✅ | Basic caret split parsing; date range params not yet exposed |
| `/api/v1/meds/:patientId` | GET | `ORWPS ACTIVE MEDS` | ✅ | Minimal field extraction; future enhancement: order metadata |
| `/api/v1/vitals/:patientId` | GET | `ORQQVI VITALS` | ✅ | Returns raw split vitals (type/value/unit/observed) |
| `/api/v1/allergies/:patientId` | GET | `ORQQAL ALLERGIES` | ✅ | Placeholder parsing (may show “Unknown Allergen” until refined) |
| `/api/v1/health` | GET | N/A | ✅ | Service health (no RPC) |
| `/api/v1/` | GET | N/A | ✅ | API index (HTML or JSON via content negotiation) |
| `/api/v1/openapi.json` | GET | N/A | ✅ | Generated minimal OpenAPI spec |
| `/api/v1/meta` | GET | N/A | ✅ | Runtime metadata (version, uptime, feature flags) |
| `/api/v1/nlp/intent/patient-search` | POST | (Internal) | ✅ | Simple intent extraction (no RPC) |

Supporting Dev / Diagnostics (feature-flagged):
| Endpoint | Purpose | Flag |
|----------|---------|------|
| `/api/v1/admin/broker/metrics` | Broker & parse counters | `ADMIN_METRICS_ENABLE=true` |
| `/api/v1/admin/broker/capture` | Initial greeting bytes | `VISTA_BROKER_CAPTURE=true` |
| `/api/v1/admin/broker/frames` | Rolling frame chunk capture | `VISTA_BROKER_FRAME_CAPTURE=true` |

### Current Development Phase
We are between **Phase 2 (Patient Core)** and **Phase 3 (Clinical Read)** of the original roadmap:

- Patient search & structured parsing: COMPLETE
- Early sign-on & context framing: IN PROGRESS (experimental framing scaffold active)
- Clinical read endpoints (labs / meds / vitals / allergies): INITIAL IMPLEMENTATIONS
- Observability: RPC activity UI + broker metrics + latency thresholds

Upcoming near-term upgrades:
1. Harden real frame decode (replace placeholder fallback lines)
2. Refine allergies & labs parsing (field mapping; raw debug toggle)
3. Add patient-centric route aliases: `/api/v1/patients/:id/{labs,meds,vitals,allergies}`
4. Introduce `/api/v1/patients/:id/summary` aggregated endpoint
5. Authentication (XUS SIGNON / AV CODE result surfaced in a session token)

### Cross-Reference Docs
| Topic | Document |
|-------|----------|
| Quick start running | `QUICKSTART.md` |
| Real RPC implementation details | `VISTA_RPC_IMPLEMENTATION.md` |
| Broker framing plan | `docs/architecture/vista-broker-framing.md` |
| Development progress log | `docs/DEVELOPMENT_LOG.md` |

> The older section **“VistA / CPRS RPC Mapping (Foundational Plan)”** below is retained as the strategic roadmap. This new section documents the *current live state*.

## AI & Clinical Summarization Architecture (Planned Integration)

This section captures the forward-looking AI / NLP plan requested and designed during the transition from mock prototype → real RPC phase. Implementation is intentionally **decoupled** and will land behind feature flags so the core VistA connectivity remains stable and auditable.

### Goals
| Goal | Description | Initial Phase |
|------|-------------|---------------|
| Patient Snapshot Summaries | Generate concise, structured clinical overviews (Problems, Meds, Allergies, Vitals, Labs) | Phase A |
| Targeted Q/A | Natural language question answering grounded only in the patient's retrieved data | Phase B |
| Intent → RPC Orchestration | Map free‑form user intents ("recent abnormal labs") into coordinated backend RPC calls | Phase B |
| Longitudinal Trend Narratives | Summarize changes over time (lab trends, vitals deltas) | Phase C |
| Multi-Patient Cohort Summaries | Aggregate patterns across a selected patient set (non-PHI aggregate) | Phase D |

### High-Level Data Flow
```
VistA RPCs  -->  ModernVista Backend  -->  (Structured Patient Bundle JSON)
																						↓ (POST /v1/summary)
																		Python AI Service (FastAPI)
																						↓ (LLM / Embeddings / Rules)
																		 Summary + Section Metadata → Cache
																						↓
																			Frontend UI (Summary Panel / Q&A)
```

### Separation of Concerns
| Layer | Responsibility | Tech |
|-------|---------------|------|
| Node Backend | Fetch raw clinical slices via RPC, normalize & sign semantic hash | TypeScript | 
| Python AI Service | Summarization, retrieval, embeddings, Q/A | FastAPI + Python |
| Vector Store (optional phase) | Embedding storage & semantic search | Qdrant / Chroma |
| Cache | Short-lived summary caching keyed by content hash | Redis |
| Frontend | Request summary & render structured + free-text AI output | React |

### Patient Bundle (Canonical Input Contract)
The backend produces a deterministic JSON document (order & key normalization) so we can hash it (SHA256) and cache AI outputs by content identity.
```jsonc
{
	"patient": { "id": "123", "name": "DOE,JOHN", "dob": "1950-01-01", "sex": "M" },
	"problems": [ { "id": "P1", "term": "DIABETES MELLITUS" } ],
	"medications": [ { "id": "M1", "name": "METFORMIN 500MG", "status": "ACTIVE" } ],
	"allergies": [ { "id": "A1", "substance": "PENICILLIN", "severity": "MODERATE" } ],
	"vitals": [ { "type": "BP", "value": "120/70", "ts": "2025-10-14T10:22:00Z" } ],
	"labs": [ { "panel": "CBC", "loinc": "", "result": "HGB 13.2", "ts": "2025-10-13T09:00:00Z", "flags": [] } ],
	"meta": { "generatedAt": "2025-10-14T15:00:00Z", "schemaVersion": 1 }
}
```

### Python AI Service (Planned Endpoints)
| Endpoint | Method | Purpose | Input | Output |
|----------|--------|---------|-------|--------|
| `/health` | GET | Liveness & version | - | `{ status, version }` |
| `/v1/summary` | POST | Deterministic bundle summarization | Patient Bundle + options | `{ summary, sections[], hash }` |
| `/v1/query` | POST | Grounded Q/A over bundle | `{ bundleHash?, question, bundle? }` | `{ answer, citations[], method }` |
| `/v1/embed` | POST | (Phase C) Generate embeddings for bundle sections | `{ bundle }` | `{ vectors[] }` |

Feature gating variables (Node backend `.env`):
```
AI_SUMMARY_ENABLE=true
AI_QA_ENABLE=false
AI_SERVICE_URL=http://localhost:5005
AI_EMBED_STORE=qdrant   # (future) or 'chroma'
AI_MAX_SECTION_TOKENS=800
```

### Summarization Pipeline (Phase A)
1. Gather RPC data (parallel fetch with timeouts)
2. Normalize & deterministic sort keys
3. Compute `hash = sha256(canonicalJson)`
4. Check Redis for `summary:{hash}`
5. If cache miss → POST to AI service `/v1/summary`
6. AI service applies: lightweight pre-trim → prompt template → model call (local first, fallback cloud)
7. Return structured sections (problems, meds, safety, recent changes)
8. Store in Redis with TTL (e.g., 5m) + ETag header pass-through

### Grounded Q/A (Phase B)
Retrieval strategies escalate:
1. Direct structured scan (regex / key search) for simple entity queries → zero-model path
2. Local embedding similarity (vector store) across sections & lab/vital lines
3. LLM answer synthesis with explicit citations (section indices / lab IDs)
4. (Fallback) Cloud LLM with strict PHI scrubbing & truncation

### Edge Cases & Safety
| Case | Handling |
|------|----------|
| Missing RPC slice | Exclude section + note in `summary.metadata.omissions` |
| Large lab history | Window to last N days before embedding/summarizing |
| Model failure | Return `{ summary: null, error: "MODEL_UNAVAILABLE" }` with 502 |
| PHI leakage risk | Local redaction pass (SSN patterns) before external call |
| Hash collision (theoretical) | Include length + first 32 chars of hash in cache key |

### Roadmap Phases (AI Layer)
| Phase | Deliverable | Exit Criteria |
|-------|-------------|---------------|
| A | Deterministic summaries | Repeated bundle → identical hash → cache hit; sections stable |
| B | Grounded Q/A | Answers cite section IDs or lab/vital references; fallback logic tested |
| C | Embeddings Store | Vector search latency < 50ms p95 for 1k vectors |
| D | Longitudinal Trends | Delta narrative tests verified on synthetic data |
| E | Cohort Aggregation | Aggregate stats computed without PHI leakage |

### Minimal Frontend Integration Plan
1. Add Summary panel placeholder (feature-flag hidden)
2. When patient context changes → request `/api/v1/patients/:id/summary` (proxy to Python if enabled)
3. Display structured sections (cards) + narrative block
4. Add Q/A input box (Phase B) with streaming answer support
5. Provide "Regenerate" (forces bypass of cache using `?refresh=1`)

### Security & PHI Constraints (Dev-Oriented)
- Dev environment only: still treat data carefully (avoid full free-text logging)
- All outbound model calls (if any) pass through a scrubber removing: name patterns, partial SSN, addresses
- No persistent PHI in vector store beyond hashed patient ID references
- Ability to fully disable AI layer without code removal (flags above)

### Implementation Strategy Summary
| Step | Action | Repo Impact |
|------|--------|-------------|
| 1 | Define bundle builder function | `backend/src/core/summary/builder.ts` (planned) |
| 2 | Add `/patients/:id/summary` REST endpoint | Reuses builder + cache + proxy |
| 3 | Scaffold Python FastAPI service | New `ai-service/` directory (future) |
| 4 | Introduce Redis integration (cache) | Docker compose service addition |
| 5 | Add feature flags & health checks | Extend existing meta endpoint |
| 6 | Frontend summary panel (hidden) | `frontend/src/modules/patient/summary/` |
| 7 | Q/A retrieval + embeddings | Add vector store client adapter |

More detailed living design will be maintained under: `docs/ai/README.md` (to be created).


## VistA / CPRS RPC Mapping (Foundational Plan)

This section documents the core Remote Procedure Calls (RPCs) used by CPRS (and related VistA client components) that ModernVista will progressively implement. It serves as both:

1. A migration guide for feature parity with CPRS
2. A contract for the ModernVista backend REST endpoints and internal broker client layer

Status Legend:
| Status | Meaning |
|--------|---------|
| ✅ Implemented | Live in code (real RPC) |
| 🧪 Experimental | Prototype / partial implementation |
| 🔄 Planned | In scope, not started |
| ⏸ Deferred | Intentionally postponed |
| 🧱 Mock | Currently stubbed / returning sample data |

> NOTE: At this early stage most items are Planned or Mock; only health checks and basic scaffolding are live.

### 1. Session / Security / Context
| RPC | Purpose | Status | Notes |
|-----|---------|--------|-------|
| `XUS SIGNON SETUP` | Begin sign-on negotiation | 🔄 Planned | Needed before AV CODE |
| `XUS AV CODE` | Access/Verify authentication | 🔄 Planned | Will return DUZ & greeting |
| `XUS GET USER INFO` | User metadata after login | 🔄 Planned | Populate user banner |
| `XWB SET CONTEXT` | Set option context (e.g. `OR CPRS GUI CHART`) | 🔄 Planned | Required for protected RPCs |
| `ORWU USERINFO` | CPRS user info conveniences | 🔄 Planned | Supplements XUS responses |
| `ORWU DT` | Server date/time utility | ⏸ Deferred | Low priority |

### 2. Patient Selection & Demographics
| RPC | Purpose | Status | Notes |
|-----|---------|--------|-------|
| `ORWPT LIST` / `ORWPT LIST ALL` | Patient name search | � Experimental | Uses broker scaffold when `VISTA_BROKER_EXPERIMENTAL=true` (still mock lines until full framing) |
| `ORWPT ID INFO` | Basic demographics by DFN | 🔄 Planned | For patient banner |
| `ORWPT SELECT` | Set current patient in session | 🔄 Planned | Required for subsequent context-sensitive RPCs |
| `ORQQPT DETAIL` | Extended patient details | ⏸ Deferred | After core chart views |

### 3. Vitals, Labs, Imaging
| RPC | Purpose | Status | Notes |
|-----|---------|--------|-------|
| `ORQQVI VITALS` | Retrieve vitals summary | 🔄 Planned | Phase 1 clinical data |
| `ORWLRR LAB ORDERS` | Lab orders list | ⏸ Deferred | Post initial chart |
| `ORWLRR RESULTS` | Lab results (panels) | 🔄 Planned | Labs view |
| `ORWLRR LOG` | Lab results chronology | ⏸ Deferred | Timeline enhancement |
| `MAGG PAT INFO` | Imaging patient info | ⏸ Deferred | Imaging integration later |

### 4. Medications & Orders
| RPC | Purpose | Status | Notes |
|-----|---------|--------|-------|
| `ORWORR AGET` | Active orders list | 🔄 Planned | Core chart tab |
| `ORWORR GET4LST` | Order detail retrieval | 🔄 Planned | Orders drilldown |
| `ORWDX SAVE` | Place an order | ⏸ Deferred | Write operations gated until read stack stable |
| `ORWDXA VALID` | Validate order before save | ⏸ Deferred | Same phase as SAVE |
| `ORWDX SEND` | Finalize order | ⏸ Deferred | Same phase as SAVE |

### 5. Allergies, Problems, Immunizations
| RPC | Purpose | Status | Notes |
|-----|---------|--------|-------|
| `ORQQAL LIST` | Allergies list | 🔄 Planned | Banner safety section |
| `ORQQPL PROBLEM LIST` | Active problem list | 🔄 Planned | Problems module |
| `ORQQIMM IMM LIST` | Immunization history | ⏸ Deferred | Later clinical expansion |

### 6. Notes & Documents
| RPC | Purpose | Status | Notes |
|-----|---------|--------|-------|
| `TIU GET RECORD TEXT` | Full note text | ⏸ Deferred | After vitals/labs/meds |
| `TIU GET LIST OF TITLES` | Note title taxonomy | ⏸ Deferred | Needed for authoring |
| `TIU CREATE RECORD` | Create a progress note | ⏸ Deferred | Write phase |

### 7. Utilities & Support
| RPC | Purpose | Status | Notes |
|-----|---------|--------|-------|
| `ORWU VALDT` | Validate date/time | ⏸ Deferred | Can implement locally first |
| `ORWU DT` | Current date/time | ⏸ Deferred | Minor enhancement |
| `ORWU HASKEY` | Security key check | 🔄 Planned | Feature gating |

### 8. NLP / AI Augmentation (Non-VistA)
These are ModernVista internal endpoints that may wrap multiple RPCs and apply transformation / summarization.

| Endpoint (Planned) | Underlying RPCs | Function |
|--------------------|-----------------|----------|
| `/api/v1/patients/:id/summary` | Multiple (demographics, problems, meds, allergies) | Aggregated patient snapshot |
| `/api/v1/patients/:id/labs/recent` | `ORWLRR RESULTS` | Filter last N days, AI summarization optional |
| `/api/v1/patients/:id/nlp/query` | Contextual set | Free-form clinical question answering |

### 9. Mapping to REST (Design Draft)
ModernVista will expose *stable* REST resources that translate VistA RPC semantics into conventional JSON. Example (draft):

| REST Endpoint | Method | RPC(s) | Shape |
|---------------|--------|--------|-------|
| `/api/v1/patients/search?q=` | GET | `ORWPT LIST` | `{ patients: [ { id, name, dob } ] }` |
| `/api/v1/patients/:id` | GET | `ORWPT ID INFO` | `{ patient: { id, name, dob, sex, ssn, ... } }` |
| `/api/v1/patients/:id/vitals` | GET | `ORQQVI VITALS` | `{ vitals: [...], timingMs }` |
| `/api/v1/patients/:id/labs` | GET | `ORWLRR RESULTS` | `{ labs: [...panel objects...] }` |
| `/api/v1/patients/:id/orders` | GET | `ORWORR AGET` | `{ orders: [...], meta }` |
| `/api/v1/patients/:id/allergies` | GET | `ORQQAL LIST` | `{ allergies: [...] }` |
| `/api/v1/patients/:id/problems` | GET | `ORQQPL PROBLEM LIST` | `{ problems: [...] }` |

### 10. Implementation Roadmap (Phase Breakdown)
| Phase | Goals | Key RPCs | Exit Criteria |
|-------|-------|----------|---------------|
| 0 (Now) | Mock prototype | (Mock) `ORWPT LIST ALL` | React search works with mock data |
| 1 | Auth & Context | `XUS SIGNON SETUP`, `XUS AV CODE`, `XWB SET CONTEXT` | Backend can authenticate & hold session |
| 2 | Patient Core | `ORWPT LIST`, `ORWPT ID INFO`, `ORWPT SELECT` | Real patient lookup / banner |
| 3 | Clinical Read | `ORQQVI VITALS`, `ORWLRR RESULTS`, `ORWORR AGET` | Vitals, labs, orders tabs live |
| 4 | Safety & Lists | `ORQQAL LIST`, `ORQQPL PROBLEM LIST` | Allergies & problems visible |
| 5 | Extended Data | Additional labs chronology, imaging | Users can navigate richer chart |
| 6 | Write Ops | `ORWDX*`, TIU note creation | Place simple orders / draft notes |
| 7 | NLP Fusion | Aggregated endpoints + AI | AI summaries & Q/A stable |

### 11. Generation & Maintenance Strategy
1. **Source of Truth**: REMOTE PROCEDURE File (#8994) & OPTION File (#19) inside VistA.
2. **Extraction**: (Planned) script to export RPC metadata to JSON (routine parsing or FileMan export).
3. **Schema Catalog**: JSON definitions versioned in `docs/api/rpc-catalog.json` (to be created).
4. **Codegen**: Future script generates TypeScript param/response stubs.
5. **Testing**: Mock responses captured & stored under `backend/tests/fixtures/rpc/`.
6. **Change Control**: Each new RPC added = README table update + CHANGELOG note.

### 12. Security & PHI Considerations (Preview)
| Concern | Approach |
|---------|----------|
| Credentials | `.env` injected; never logged |
| PHI in Logs | Structured logging with field suppression (no free-text data) |
| Session Handling | Per-connection broker session; future token abstraction |
| Least Privilege | Minimal option context (e.g. read-only at first) |

### 13. Current Gaps
| Area | Gap | Planned Resolution |
|------|-----|-------------------|
| Broker Protocol | No framing / sign-on implemented | Implement Phase 1 auth module |
| Patient Data | Mock only | Implement real RPC list & ID info |
| Clinical Tabs | Not wired | Add vitals/labs/orders endpoints Phases 3+ |
| Catalog | No automated extraction | Build extraction & catalog generator |

If you need a deeper dive into a specific RPC family, open an issue or start a doc under `docs/api/` and we’ll expand the mapping.

### Experimental Broker Mode
Set the following in your backend `.env` to enable the in-progress broker session layer:
```
VISTA_BROKER_EXPERIMENTAL=true
VISTA_CONTEXT="OR CPRS GUI CHART"
VISTA_BROKER_TIMEOUT_MS=5000
VISTA_BROKER_PHASE3_ENABLE=true   # Enables simulated framed sign-on packets (still mock)
ADMIN_METRICS_ENABLE=true         # Expose /api/v1/admin/broker/metrics endpoint (unauth dev only)
VISTA_BROKER_CAPTURE=true         # Capture first greeting bytes (development analysis)
VISTA_BROKER_FRAME_CAPTURE=true   # Extended rolling frame chunk capture (development only)
```
Current behavior: establishes a TCP connection and returns scaffolded (mock) patient list via the broker session path. Once real framing & sign-on are implemented this flag will enable live RPCs.

#### Architecture (Incremental)
```
patientsRouter -> vistaRPCClient.call('ORWPT LIST', [q])
	-> if VISTA_BROKER_EXPERIMENTAL=true
			 vistaBrokerSession.call()
				 -> vistaBrokerConnection.connect()  (raw TCP only)
				 -> (future) signOn() -> setContext() -> sendFramedRpc()
			 transform caret-lines -> JSON
	-> else
			 legacy mock list
```

#### Next Broker Phases
| Step | Goal | Output |
|------|------|--------|
| 1 | Add framing utilities | `framing.ts` encode/decode packets |
| 2 | Sign-on handshake (stubs added) | Scaffolded performSignOn & setContext |
| 2.5 | Phase 3 scaffold (length prefix sim) | Synthetic length-prefixed frames + timing logs |
| 3 | Context setting | Option context validated |
| 4 | Real ORWPT LIST | Live patient search replaces mock |
| 5 | Metrics & logging guardrails | Timing + RPC name only |
| 6 | Idle + reconnect logic | Stable long-lived session |
| 7 | Additional RPC families | Vitals, labs, orders |

#### Logging & Privacy Plan (Preview)
| Concern | Approach |
|---------|----------|
| PHI leakage | Only log rpcName + timing + status; redact data |
| Credentials | Never log access/verify; environment-only |
| Errors | Map internal errors to generic API errors (no raw Broker dumps) |

### Phase 2 Architecture Doc
Detailed design & roadmap for framing, sign-on, and session lifecycle:
`docs/architecture/vista-broker-framing.md`

### Admin Metrics Endpoint (Development Only)
If `ADMIN_METRICS_ENABLE=true`, the following endpoint becomes available:
```
GET /api/v1/admin/broker/metrics
```
Returns JSON snapshot:
```
{
	"rpc": {
		"ORWPT LIST": { "count": 3, "errors": 1, "avgMs": 20.1, "maxMs": 30, "p95Ms": 30 }
	},
	"signOn": { "attempts": 2, "errors": 0 },
	"frames": { "seen": 12, "complete": 4, "errors": 0, "lastError": null }
}
```
Do NOT enable in production without auth; future iteration will secure with auth & role checks.

### Broker Capture Endpoint (Development Only)
If `VISTA_BROKER_CAPTURE=true` and admin metrics are enabled, you can view the first raw bytes the server sent (typically greeting / banner):
```
GET /api/v1/admin/broker/capture
```
Example response:
```
{
	"enabled": true,
	"captured": true,
	"length": 42,
	"hex": "5b3132332e2e2e",
	"base64": "WzEyMy4uLg==",
	"asciiPreview": "[123...",
	"timestamp": 1696969999999
}
```
Privacy Note: This should contain no PHI (greeting only). Review before sharing.

#### Resetting the Capture
If you need to grab a fresh greeting (e.g., after modifying connection timing or switching environments) you can clear the in‑memory capture without restarting the backend:
```
POST /api/v1/admin/broker/capture/reset
```
Response:
```
{ "reset": true }
```
Conditions:
- `ADMIN_METRICS_ENABLE=true` AND `VISTA_BROKER_CAPTURE=true`
- Only clears the first-chunk buffer (max 512 bytes) — does not affect any other state

Safety Notes:
- Use only in development; endpoint is unauthenticated while flags gate access
- After reset, the *next* new broker connection will recapture the greeting bytes
- If no new connection occurs, `/broker/capture` will show `captured: false`

Recommended Workflow:
1. Enable flags
2. Hit a broker-backed RPC (e.g., patient search) to establish connection
3. GET capture to inspect bytes
4. POST reset
5. Trigger a new broker connection (restart experimental flag or server) if you need another sample

### Extended Frame Capture (Development Only)
When deeper protocol analysis is required (e.g., implementing real XWB framing), enable the rolling frame chunk capture:
```
VISTA_BROKER_FRAME_CAPTURE=true
```
This records a bounded ring buffer of the most recent inbound socket data chunks (after the initial greeting) with strict safety caps:
| Limit | Value | Purpose |
|-------|-------|---------|
| Max chunks stored | 25 | Prevent unbounded memory |
| Per-chunk byte cap | 256 bytes | Avoid large PHI blobs |
| Total bytes cap | 4096 bytes | Overall safety ceiling |

Endpoint (requires `ADMIN_METRICS_ENABLE=true`):
```
GET /api/v1/admin/broker/frames
```
Example response (fields abbreviated):
```
{
	"greetingEnabled": true,
	"frameCaptureEnabled": true,
	"greeting": { ... },
	"frames": {
		"count": 5,
		"totalBytes": 640,
		"dropped": 0,
		"cap": 4096,
		"chunks": [
			{ "index": 0, "length": 128, "hex": "5b3132...", "asciiPreview": "[12..", "ts": 1696970000000 },
			{ "index": 1, "length": 64, ... }
		]
	}
}
```
Notes:
1. Payloads are truncated and non-printable bytes replaced with '.' for safety.
2. Once `totalBytes` exceeds the cap, new chunks increment a `dropped` counter instead of storing data.
3. Use alongside metrics (`/broker/metrics`) to correlate frame assembly errors with raw chunk patterns.
4. Disable in normal development once real framing is stable to reduce noise and any residual PHI exposure risk.

Disable by removing the env var or setting it to anything other than `true`.

## Upcoming Work (High-Level Roadmap)
Short list of what’s being built next (each item feature-flagged & safety-first):
- Frame analyzer: print raw captured bytes with offsets (helps real protocol parsing)
- Real decode scaffold: state machine for authentic XWB frames
- Basic encodeXwb: send literal-only RPC frames
- Real sign-on: XUS SIGNON SETUP / AV CODE / XWB SET CONTEXT over socket
- Live patient search: replace mock `ORWPT LIST` with real data
- Latency histograms: better timing metrics (p50 / p95)
- Log redaction: strip SSN/name patterns before logging
- NLP → RPC mapping: intents ("recent labs") into RPC calls
- Summary endpoint: aggregated patient snapshot + optional AI summary
- Labs tab scaffold: UI ready before real lab RPC decoding
- Per-RPC feature flags: granular rollout (real vs mock)
- Capture → fixtures: turn sanitized frames into test data
- decodeXwb unit & integration tests: parser correctness + sign-on flow
- Architecture + README updates: real frame spec & credential env vars
- Security doc: rules for credentials & PHI handling

(See `docs/DEVELOPMENT_LOG.md` for detailed plain-language explanations.)


