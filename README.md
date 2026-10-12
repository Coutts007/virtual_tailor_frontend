# Virtual Tailor: front end

The client-side tier of **Virtual Tailor (VT)**, a final-year Computer Science project at Mount Kenya University (*AI-Powered Remote Tailoring and Virtual Measurement System*). It is one SvelteKit + TypeScript progressive web app with four role-based surfaces: the client capture app, the tailor dashboard, the administrator screens and the validation-study screens.

The full build specification is `../VT_frontend_agent_prompt.md`. Owner decisions are in `docs/decisions.md`.

> **Status:** Phases 0–4 complete (client flow, real capture pipeline, measurement module). Device tests on the reference phones are still to be run. See "Phases" below.

## Requirements

- Node.js 20+
- For end-to-end tests: `npx playwright install chromium`

## Getting started

```bash
cp .env.example .env     # defaults to the mock backend
npm install
npm run vendor           # once, online: self-hosts MediaPipe WASM, OpenCV.js, the pose model, builds the workers
npm run dev              # http://localhost:5173 (runs vendor again; skips files already present)
```

In development with `VITE_API_MODE=mock`, a Mock Service Worker (MSW) answers every `/api/v1` request from deterministic seed data (`mocks/`).

### Developer pages (dev builds only)

- **http://localhost:5173/dev/ui**: component gallery (every component in Section 8.4, EN/SW).
- **http://localhost:5173/dev/mock**: mock backend controls: latency on/off, force an error per endpoint, reset data to the seed.
- **http://localhost:5173/dev/capture-tuning**: choose fake vision (scripted scenarios, time scale) or the real camera, and watch every capture check's live values against its threshold.

In development the capture flow uses **simulated vision** by default, so the whole client flow (`/` → measure → review → saved) works on a laptop without a camera.

### Seed accounts (mock)

All use the password `vt-demo-2026`.

| Email | Role | Notes |
|---|---|---|
| `admin@vt.test` | admin | Researcher / operator |
| `wanjiru@vt.test` | tailor | Mama Wanjiru Tailors, Gikomba: 8 clients, Kiswahili, ease presets |
| `otieno@vt.test` | tailor | Otieno Bespoke, CBD: 3 clients, inches |
| `pending@vt.test` | tailor | Waiting for approval |
| `disabled@vt.test` | tailor | Disabled account |
| `measurer-a@vt.test`, `measurer-b@vt.test` | measurer | Study measurers A and B |

Client codes to try in the client app: `AB1234` (Amina, height pre-filled), `QT1200` (no measurements yet). Any other valid-looking code returns "code not found".

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
| `npm run test:unit` | Vitest: unit tests plus API contract tests against the mock (fake IndexedDB, MSW in Node) |
| `npm run test:e2e` | Playwright (phone 360 × 800 and desktop 1280 × 800) with axe-core |
| `npm run licenses` | Regenerates `docs/LICENSES.md` and fails on prohibited licences |
| `npm run i18n:review` | Regenerates `docs/i18n-review.md` from the Kiswahili dictionary |
| `npm run marker` | Regenerates the A4 measuring sheet PDF and preview SVG |
| `npm run vendor` | Self-hosts the vision assets (pinned SHA-256 model download) and bundles the classic vision workers |
| `npm run ci` | Everything CI runs except e2e |

## Project layout

```
src/
  lib/
    api/       ApiClient interface (every endpoint), HttpApiClient, types.ts (wire types), errors.ts
    auth/      AuthTransport (bearer + sessionStorage, or cookie), session store, role guards
    domain/    units (mm/cm/in), validators, sites and garment map, WhatsApp share text
    db/        Dexie schema v1, settings, image guard (no image ever stored)
    i18n/      en.ts, sw.ts, ICU-style formatter, reactive t()
    styles/    tokens.css (design tokens, light + dark), base.css
    ui/        component library (Section 8.4); see /dev/ui
    capture/ vision/ measure/ device/ study/ auth/   (later phases)
  routes/      SvelteKit routes (SPA mode)
  service-worker.ts   precaches shell/models; never caches /api/
mocks/         MSW handlers for every endpoint, deterministic seed, sheet renderer, dev controls
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

The measurement rules live in `src/lib/measure/rules.ts` (`RULES_VERSION = "0.1-uncalibrated"`, all correction factors 1.0).

1. Fit the calibration subset outside the app (Section 3.6). Output the new constants: girth correction factors `cf.*`, `chest_level`, `waist_level`, `acromion_offset_mm`, and optionally `neck_search_from`, `bust_search` and the thresholds.
2. Edit `DEFAULT_RULES` in `src/lib/measure/rules.ts` with the fitted values.
3. Bump `RULES_VERSION` to a new frozen name, e.g. `"1.0-ke-cal25"`. Never reuse a version string.
4. Run `npx vitest run tests/unit/measure`. The synthetic-body tolerance tests assume CF = 1, so update their expected truth or tolerances to reflect the new factors (synthetic truth × CF), and keep coverage ≥ 90 %.
5. The config hash (`configHash()`) changes automatically. Every new profile records `rules_version`, `config_hash` and the model variant, so old and new profiles stay distinguishable on the server and in the study export.
6. Note the change, the calibration date and the data set in `docs/decisions.md`.

Note that the capture thresholds in `src/lib/capture/config.ts` are hashed separately; a profile's `config_hash` is `<rules hash>.<capture hash>`.

## Phases (Section 22)

| Phase | Scope | Status |
|---|---|---|
| 0 | Setup: scaffold, tokens, i18n skeleton, Dexie, MSW, CI, docs | ✅ Done |
| 1 | Design system (`/dev/ui`) and API contract + full mock | ✅ Done |
| 2 | Client flow with fake vision | ✅ Done |
| 3 | Real capture pipeline | ✅ Done (device tests pending) |
| 4 | Measurement module | ✅ Done |
| 5 | Tailor dashboard | |
| 6 | Admin and study | |
| 7 | Hardening | |
