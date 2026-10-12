# Virtual Tailor: front end

The client-side tier of **Virtual Tailor (VT)**, a final-year Computer Science project at Mount Kenya University (*AI-Powered Remote Tailoring and Virtual Measurement System*). It is one SvelteKit 2 + Svelte 5 + TypeScript progressive web app with four role-based surfaces:

- **Client capture app** (no login, EN/SW, works offline): the phone measures the client in the browser and sends only numbers.
- **Tailor dashboard**: clients, profiles, orders, specification sheets, WhatsApp sharing, audit, settings.
- **Administrator**: account approval, audit log and CSV, retention, study mode, deletion requests.
- **Validation study**: researcher-run capture with covariates, participant enrolment, blind tape entry, exports.

The build specification is `../VT_frontend_agent_prompt.md`. Owner decisions and every interpretation made while building are in `docs/decisions.md`.

> **Status:** all phases (0–7) are built and tested in this environment. Still outstanding: the **device tests** on the four reference phones (`docs/device-test-log.md`), the **Kiswahili review** (`docs/i18n-review.md`), the **[CONFIRM]** items in the decisions log, and one **open decision** about OpenCV.js and the CSP (see "Open items" below).

## Requirements

- Node.js 20+
- Internet once, for `npm install` and `npm run vendor` (downloads the pose model, pinned by SHA-256)
- For end-to-end tests: `npx playwright install chromium`

## Getting started

```bash
cp .env.example .env     # defaults to the mock backend
npm install
npm run vendor           # self-hosts MediaPipe WASM, OpenCV.js and the pose model; bundles the vision workers
npm run dev              # http://localhost:5173
```

In development with `VITE_API_MODE=mock`, a Mock Service Worker (MSW) answers every `/api/v1` request from deterministic seed data (`mocks/`). The capture flow uses **simulated vision** by default, so the whole client flow works on a laptop without a camera. Choose the real camera on `/dev/capture-tuning`.

### Developer pages (dev builds only; removed from production builds)

- **/dev/ui**: component gallery (Section 8.4), EN/SW.
- **/dev/mock**: mock backend controls: latency on/off, force an error per endpoint, reset data to the seed.
- **/dev/capture-tuning**: fake vision scenarios (every check state, scale disagreement, failed site, bad burst) or the real camera, with each check's live value against its threshold.

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
| `VITE_API_BASE_URL` | URL or path | `/api/v1` | API base (same origin by default). An absolute URL is added to the CSP `connect-src` at build time |
| `VITE_FEATURE_STUDY_IMAGES` | `true` \| `false` | `false` | Study image vault (Section 15.6). Keep `false` until owner + IERC approval (decision 1) |

### Switching from the mock to the real backend

1. Set `VITE_API_MODE=http` (and `VITE_API_BASE_URL` if the API is on another origin; enable CORS on the API for the app origin).
2. `npm run build`. Production builds never include MSW, whatever the mode.
3. Run the contract tests against the real API to confirm the swap (they drive the same `HttpApiClient` the UI uses): see `tests/unit/contract.test.ts`.

Nothing in the UI changes: every screen talks to the `ApiClient` interface (`src/lib/api/`). The backend engineer's guide is `docs/api-contract.md` (with the DB change list and the integration checklist) and `docs/openapi.yaml`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with the mock backend (runs `vendor` first; skips files already present) |
| `npm run build` | Static SPA build into `build/` (adapter-static, `index.html` fallback) + `build/_headers` (security headers) |
| `npm run vendor` | Self-hosts the vision assets (pinned model SHA-256) and bundles the classic vision workers into `static/workers/` |
| `npm run check` | `svelte-check` type checking (fails on warnings) |
| `npm run lint` / `npm run format` | Prettier + ESLint / auto-format |
| `npm run test:unit` | Vitest: unit tests, API contract tests against the mock, i18n parity and no-hard-coded-strings checks |
| `npm run test:coverage` | Measurement module coverage (gate ≥ 90%) |
| `npm run test:e2e` | Playwright: phone 360 × 800, desktop 1280 × 800, real camera (fake device + generated Y4M); axe on every route |
| `npm run test:prod` | Production build served like a static host: CSP, offline shell, service-worker cache rules, vision workers under CSP |
| `npm run budget` | Bundle budgets (Section 18) → `docs/budget-report.md` |
| `npm run lighthouse` | Lighthouse CI on the production build (TTI ≤ 3.5 s mobile, accessibility ≥ 0.95) |
| `npm run licenses` | Regenerates `docs/LICENSES.md` and fails on prohibited licences (NFR-14) |
| `npm run audit` | `npm audit` of deployed dependencies with `audit-allowlist.json` |
| `npm run i18n:review` | Regenerates `docs/i18n-review.md` from the Kiswahili dictionaries |
| `npm run marker` | Regenerates the A4 measuring sheet PDF and preview SVG |
| `npm run ci` | Everything the CI `checks` job runs |

CI: `ci/github-actions-ci.yml` (see `ci/README.md` for enabling it on GitHub).

## Project layout

```
src/
  lib/
    api/       ApiClient interface (every endpoint), HttpApiClient, wire types, problem errors
    auth/      AuthTransport (bearer + sessionStorage, or cookie), session store, role guards
    capture/   thresholds (config.ts), checks + hysteresis, state machine, audio, orientation, wake lock
    client/    client flow store, presentation helpers, client screen components
    dashboard/ tailor/admin stores, guards, order items logic, sharing
    db/        Dexie schema v1, settings, profiles, sync queue, image guard
    device/    phone check (platform floor), device info, network state
    domain/    units (mm/cm/in), validators, sites and garment map, WhatsApp share text
    i18n/      per-area EN/SW dictionaries (lazy for dashboard/admin/study), consent text, protocol card
    measure/   measurement module (Section 11), synthetic bodies
    study/     tape-entry queue, image vault (flag off)
    ui/        component library (Section 8.4)
    vision/    camera, frame ops, workers (pose, marker), burst reduction, fake engine, assets
  routes/      (client)/ · (auth)/ · (tailor)/t/ · (admin)/admin/ · (study)/study/ · dev/
  service-worker.ts   precaches the shell; never caches /api/; vision assets only after "Download now"
mocks/         MSW handlers for every endpoint, deterministic seed, sheet renderer, dev controls
scripts/       vendor, budget, audit, licences, security headers, static server, marker sheet, screenshots
tests/unit · tests/e2e · tests/prod
docs/          decisions, design notes, API contract + OpenAPI, traceability, licences, i18n review,
               OpenCV build, device test log, budget report, checkpoint screenshots per phase
static/        manifest, icons, marker sheet, audio manifest; models/ wasm/ opencv/ workers/ are vendored
```

## Privacy invariants (enforced in code and tests)

- **No image leaves the phone.** Workers reply with numbers (and, for bursts, the binary mask in memory); nothing image-like can be written to IndexedDB (`imageGuard.ts` hooks); network interception tests fail on any image, binary or large body, or any third-party origin (`client.spec.ts`, `real.spec.ts`).
- **Frames are released** right after use: every ImageBitmap is closed and canvases reset; the e2e tests assert zero live bitmaps and capture buffers afterwards.
- **No third-party requests at runtime:** models, WASM and fonts are self-hosted; the CSP allows only the app and API origins.
- **The service worker never caches API responses** (`tests/prod/prod.spec.ts`).

## Deployment

Serve `build/` over HTTPS with the headers in `build/_headers` (details and host notes in `docs/api-contract.md` → Deployment headers): SPA fallback to `index.html`, compression for JS and WASM, `service-worker.js` uncached. `node scripts/serve-build.mjs` serves the build the same way for local checks.

## Updating `rules_version` after calibration

The measurement rules live in `src/lib/measure/rules.ts` (`RULES_VERSION = "0.1-uncalibrated"`, all correction factors 1.0).

1. Fit the calibration subset outside the app (Section 3.6). Output the new constants: girth correction factors `cf.*`, `chest_level`, `waist_level`, `acromion_offset_mm`, and optionally `neck_search_from`, `bust_search` and the thresholds.
2. Edit `DEFAULT_RULES` in `src/lib/measure/rules.ts` with the fitted values.
3. Bump `RULES_VERSION` to a new frozen name, e.g. `"1.0-ke-cal25"`. Never reuse a version string.
4. Run `npx vitest run tests/unit/measure`. The synthetic-body tolerance tests assume CF = 1, so update their expected truth or tolerances to reflect the new factors (synthetic truth × CF), and keep coverage ≥ 90 %.
5. The config hash (`configHash()`) changes automatically. Every new profile records `rules_version`, `config_hash` and the model variant, so old and new profiles stay distinguishable on the server and in the study export.
6. Note the change, the calibration date and the data set in `docs/decisions.md`.

Note that the capture thresholds in `src/lib/capture/config.ts` are hashed separately; a profile's `config_hash` is `<rules hash>.<capture hash>`.

## Open items

- **OpenCV.js and the CSP (owner decision):** keep the marker worker's scoped `'unsafe-eval'`, or build OpenCV.js with `-s DYNAMIC_EXECUTION=0` (`docs/opencv-build.md`).
- **Masks kept until the review ends** so a single-view retake can recompute (`docs/decisions.md`, Phase 2): confirm or switch to recapturing both views.
- **Device tests** on the Tecno Spark 30C, Samsung A16, iPhone 11 and the 3 GB floor phone: pose on real people, lens choice, ImageCapture, iOS motion permission, timings (NFR-01), memory.
- **Kiswahili review** of 900+ strings, the consent text and the protocol card; Appendix C tape instructions; recorded audio clips.
- **[CONFIRM]** items: garment → sites map, retention period, contacts and DPA details, height returned by the code check, pending order items, order deletion rule, "sign out everywhere".

## Phases (Section 22)

| Phase | Scope | Status |
|---|---|---|
| 0 | Setup: scaffold, tokens, i18n skeleton, Dexie, MSW, CI, docs | ✅ |
| 1 | Design system (`/dev/ui`) and API contract + full mock | ✅ |
| 2 | Client flow with fake vision | ✅ |
| 3 | Real capture pipeline | ✅ (device tests pending) |
| 4 | Measurement module | ✅ (calibration pending, `0.1-uncalibrated`) |
| 5 | Tailor dashboard | ✅ |
| 6 | Admin and study | ✅ (image vault disabled pending approval) |
| 7 | Hardening: accessibility, budgets, Lighthouse, CSP, offline, licences, audit, docs | ✅ |

Checkpoint screenshots: `docs/checkpoints/phase-*/`.
