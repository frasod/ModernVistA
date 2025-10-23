# ModernVista Frontend (POC)

Minimal, Braun-inspired React + Vite + Tailwind proof-of-concept.

## Features (Current)
- Vite + React 18 + TypeScript
- Tailwind minimal theme (brand palette)
- Basic layout shell (MinimalShell)
- Patient search (debounced, mock or backend depending on env)
- Patient Explorer panel (summary + labs + meds + vitals tabs)
- RPC Activity log (endpoint, rpcName, status, event, duration) with:
  - Session persistence (sessionStorage)
  - Text filter (endpoint / rpc / event)
  - Duration severity coloring

## Run
```bash
npm install
npm run dev
```
Open: http://localhost:3000

## Structure
```
src/
  components/layout/MinimalShell.tsx
  modules/app/App.tsx
  modules/patients/PatientSearch.tsx
  styles.css
```

## Next Steps
- Allergies / orders tabs
- Global command bar (NLP placeholder)
- Auth flow (token / session broker state)
- Correlation IDs & export activity

Keep it lean. Build only what proves value.

## Patient Explorer & Activity Log
The explorer shows patient demographics plus tabbed clinical domains. When you:
1. Search patients: each API call logs latency and rpcName.
2. Select a row: logs a semantic `select` event.
3. Open Labs or Meds tab: triggers a one-time fetch per patient/tab and logs it.

Activity items retain up to 200 most recent events (newest first). Colored badges:
- Green: successful HTTP status
- Orange: 4xx/5xx status
- Red: error field present
- Blue: semantic event (e.g., select)

Schema (internal): `{ endpoint, rpcName?, statusCode?, event?, durationMs, error? }`.

Filter: matches substring (case-insensitive) in endpoint, rpcName, or event.

Latency coloring thresholds (ms): 300 (yellow), 750 (orange), 1500 (red).
