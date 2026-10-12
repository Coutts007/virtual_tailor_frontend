# Virtual Tailor: front end

The client-side tier of **Virtual Tailor (VT)**, a final-year Computer Science project at Mount Kenya University (*AI-Powered Remote Tailoring and Virtual Measurement System*). It is one SvelteKit + TypeScript progressive web app with four role-based surfaces: the client capture app, the tailor dashboard, the administrator screens and the validation-study screens.

The full build specification is `../VT_frontend_agent_prompt.md`. Owner decisions are in `docs/decisions.md`.

> **Status:** Phase 0 (setup) complete. See "Phases" below.

## Requirements

- Node.js 20+
- For end-to-end tests: `npx playwright install chromium`

## Getting started

```bash
cp .env.example .env     # defaults to the mock backend
npm install
npm run dev              # http://localhost:5173
```

In development with `VITE_API_MODE=mock`, a Mock Service Worker (MSW) answers every `/api/v1` request from deterministic seed data (`mocks/`).

## Environment variables

| Variable | Values | Default | Purpose |
|---|---|---|---|
| `VITE_API_MODE` | `mock` \| `http` | `mock` | `mock` starts MSW in dev; `http` talks to the real FastAPI backend |
| `VITE_API_BASE_URL` | URL or path | `/api/v1` | API base (same origin by default) |
| `VITE_FEATURE_STUDY_IMAGES` | `true` \| `false` | `false` | Study image vault (Section 15.6). Keep `false` until owner + IERC approval |

### Switching from the mock to the real backend

Set `VITE_API_MODE=http` (and `VITE_API_BASE_URL` if the API is on another origin), then rebuild. Nothing in the UI changes: every screen talks to the `ApiClient` interface (`src/lib/api/`). Production builds never include MSW.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with the mock backend |
| `npm run build` / `npm run preview` | Static SPA build into `build/` (adapter-static, `index.html` fallback) |
| `npm run check` | `svelte-check` type checking (fails on warnings) |
| `npm run lint` / `npm run format` | Prettier + ESLint / auto-format |
| `npm run test:unit` | Vitest (unit, fake IndexedDB, MSW in Node) |
| `npm run test:e2e` | Playwright (phone 360 × 800 and desktop 1280 × 800) with axe-core |
| `npm run licenses` | Regenerates `docs/LICENSES.md` and fails on prohibited licences |
| `npm run i18n:review` | Regenerates `docs/i18n-review.md` from the Kiswahili dictionary |
| `npm run ci` | Everything CI runs except e2e |

## Project layout

```
src/
  lib/
    api/       ApiClient interface, HttpApiClient, types.ts (wire types), errors.ts
    db/        Dexie schema v1, settings, image guard (no image ever stored)
    i18n/      en.ts, sw.ts, ICU-style formatter, reactive t()
    styles/    tokens.css (design tokens, light + dark), base.css
    ui/        component library (grows in Phase 1)
    capture/ vision/ measure/ device/ study/ auth/   (later phases)
  routes/      SvelteKit routes (SPA mode)
  service-worker.ts   precaches shell/models; never caches /api/
mocks/         MSW handlers, seed data, dev-only worker script
tests/unit     Vitest
tests/e2e      Playwright
docs/          decisions, design notes, API contract, traceability, licences, i18n review, device log
static/        manifest, icons; models/, wasm/, opencv/, marker/ filled in later phases
```

## Privacy invariants (enforced in code and tests)

- No image leaves the phone. `src/lib/db/imageGuard.ts` blocks image-like data from IndexedDB on every write (`tests/unit/imageGuard.test.ts`). The network privacy test arrives in Phase 3.
- The service worker never caches `/api/` responses.
- No third-party origins at runtime: no CDN, analytics or external fonts (system font stack).

## Deployment headers

See `docs/api-contract.md` → "Deployment headers" (CSP, HSTS). COOP/COEP are not needed: WebAssembly runs single-threaded SIMD.

## Updating `rules_version` after calibration

Phase 4. The measurement rules live in `src/lib/measure/rules.ts`; this section will describe the procedure.

## Phases (Section 22)

| Phase | Scope | Status |
|---|---|---|
| 0 | Setup: scaffold, tokens, i18n skeleton, Dexie, MSW, CI, docs | ✅ Done |
| 1 | Design system (`/dev/ui`) and API contract + full mock | Next |
| 2 | Client flow with fake vision | |
| 3 | Real capture pipeline | |
| 4 | Measurement module | |
| 5 | Tailor dashboard | |
| 6 | Admin and study | |
| 7 | Hardening | |
