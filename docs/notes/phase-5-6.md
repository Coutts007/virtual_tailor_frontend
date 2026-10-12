# Notes from Phases 5 and 6 (for merging into the main docs)

Branch `phase-5-6-dashboard`. This file lists decisions, deviations, shared-file changes and traceability rows. The parent folds them into `decisions.md`, `design-notes.md`, `traceability.md` and the README.

## Shared files touched (outside the owned folders)

| File | Change | Why |
|---|---|---|
| `src/lib/api/index.ts` | `onUnauthorized` ends the session only when the problem code is not `invalid_credentials`. `fetchImpl` now awaits `mockReady()`. | A wrong *current* password on `POST /me/password` is also a 401 and signed the tailor out. In dev mock mode, pages that load data before the root layout mounts hit the dev server (404) before MSW started. |
| `src/lib/api/mockReady.ts` (new) | Starts MSW once, idempotently, in dev + mock mode. Production: resolves immediately (dynamic import behind `import.meta.env.DEV`). | As above. The client app needs this too. |
| `src/lib/sw/register.svelte.ts` | Uses `mockReady()` instead of importing `mocks/browser` directly. | Single start path. |
| `mocks/handlers.ts` | In the browser, the mock database is saved to `sessionStorage` (`vt.mock.db`) after every request and restored on load. `resetMockDb()` clears it. Node tests stay in memory. | A full page reload recreated the seed and lost tokens (401 on every reload) and changes. A real server keeps state, so the mock now does too, per tab. |
| `tests/e2e/helpers.ts` | Added `login`, `loginEn`, `fastMock`, `PASSWORD`. | Shared e2e helpers. |

**Not changed but worth knowing:** the root layout's offline banner is client-oriented ("You can still measure…"). The dashboard shell shows its own banner ("changes are off until you reconnect"), so a dashboard page currently shows **both** when offline. Suggest scoping the root banner to the `(client)` group.

## Decisions and deviations (Phase 5)

- **Login applies the account's preferred language** (`user.locale`) to the UI. Wanjiru's seed locale is `sw`, so after signing in her dashboard is in Kiswahili; the EN | SW toggle still switches instantly.
- **Mock login of a pending account** returns 200 with `status: 'pending'` (as in Phase 1). The UI routes to `/register/pending` on either that or a `403 account_pending`.
- **Sign-out redirect:** an expired session (timer or 401) sends the tailor to `/login?next=<where they were>` with "Your session ended". A deliberate sign-out goes to `/login` without `next`.
- **13.5 "Preview sheet"** without an order is implemented as **"Print measurements"** (print view of the measurement table). Specification sheets belong to orders (13.9), and the server only renders them for an order.
- **13.4 "Compare profiles"** (Could) is not built.
- **13.2 infinite scroll** uses an IntersectionObserver on the "Load more" button, which stays as the fallback.
- **Ease in inches:** entered to the nearest ⅛ in (three decimals allowed); validated as 0–300 mm rather than "one decimal", because inches do not map onto 0.1 cm steps.
- **Sheet files** (`png_url`, `pdf_url`) are fetched with the auth header and shown via an object URL, because an `<img>` cannot send `Authorization`. Works the same with a cookie transport.
- **Share via WhatsApp:** `navigator.canShare({ files })` → `navigator.share({ files, text })` → logs `whatsapp_share`; otherwise the PNG is downloaded, `https://wa.me/?text=…` opens in a new tab, the "Attach the downloaded picture in WhatsApp" hint shows, and `wa_link` is logged. Download PDF logs `download`; Print opens the PDF and logs `print`.
- **New-order picker (FAB):** `/t/orders/new` without `profileId` shows client search → profile list (`?clientId=`), then the form (`?profileId=`). "Change profile" returns to the profile list for the same client.
- **Leaving a dirty new order** (in-app navigation) asks "Leave without saving?". Closing the tab is not intercepted (no `beforeunload` prompt, to avoid annoying shared-phone users).
- **Settings → Privacy notice** links to `/privacy` (client route, Section 9.13).
- **Version line:** `src/lib/version.ts` exports `APP_VERSION` (from `package.json`) and `RULES_VERSION_FALLBACK = '0.1-uncalibrated'`. Repoint the settings page to `RULES_VERSION` from `$lib/measure` once Phase 4 is merged.
- **Header section title** is a `<p>`; each page owns the single `<h1>`.

## Traceability rows (Phase 5)

| Requirement | Test |
|---|---|
| FR-13 tailor accounts, expiring tokens | `tests/e2e/auth.spec.ts`: sign in by role, generic wrong-password message, pending → waiting screen, disabled message, `next=` round trip, expired session message, sign out clears session, registration validation; `tests/unit/auth.test.ts` |
| FR-14 issue code, display name, height | `tests/e2e/tailor.spec.ts` "issue code → share card with QR → WhatsApp fallback (wa.me)" |
| FR-15 client list, dated profiles, sheet with flags | `tailor.spec.ts` "search clients (debounced) and open a measurement sheet" |
| FR-16 order from profile, ease, override | `tailor.spec.ts` "create order: flagged row must be confirmed, override is audited…", "keyboard-only order flow"; `tests/unit/orderItems.test.ts` |
| FR-17 order queue by status | `tailor.spec.ts` "status change from the queue, backwards needs confirmation", "order queue: overdue tag and collected hidden by default" |
| FR-18 sheet PDF/PNG, name off by default | `tailor.spec.ts` create-order test (generate, preview, name absent from share text) |
| FR-19 WhatsApp via Web Share or wa.me | `tailor.spec.ts` (wa.me fallback for code card and sheet) |
| FR-20 audit records (tailor view) | `tailor.spec.ts` create-order test (override + share visible in My activity) |
| FR-11 conflicts shown and resolved | `tailor.spec.ts` "conflicts: badge → resolve → none left" |
| 13 offline: banner, mutations off | `tailor.spec.ts` "offline: banner and mutating actions disabled" |
| 17 accessibility | `tailor.spec.ts` "axe: every tailor route (en/sw)", `auth.spec.ts` "axe: login and register (en/sw)" |

Screenshots: `docs/checkpoints/phase-5/` (EN + SW, 360 × 800 and 1280 × 800).
