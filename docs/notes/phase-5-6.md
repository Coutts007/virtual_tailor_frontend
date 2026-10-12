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

## Decisions and deviations (Phase 6)

- **Accounts tabs:** Pending · Active · Disabled. Rejected accounts appear under Disabled with "rejected: <reason>", and can be re-enabled. The list is loaded once (`GET /admin/accounts`) and filtered on the client; the `status` query still exists in the contract. Tabs are a real ARIA tablist (arrow keys move between tabs).
- **Bulk approve** calls `POST /admin/accounts/{id}/approve` per account (no bulk endpoint in the contract). Failures are reflected in the "N accounts approved" count.
- **An admin cannot disable their own account** (button hidden; the mock also returns 403).
- **Measurer accounts** can be created from Accounts (dialog) and from Study › Measurers. The measurer code is one letter A–Z; a taken code shows a field error from the 422 response.
- **Admin audit** uses Previous/Next paging (25 per page), as a "paginated table" (Section 14). The tailor's own audit uses "Load more".
- **Study mode switch** asks for confirmation with an explanation. After saving, the public-settings cache is refreshed so the admin's Study nav item, and the study route guards, follow at once.
- **Study › Capture** links to `/study/capture` (15.1, owned by the capture app). Participant cards link to `/study/capture?participant=P00n` ("Start set n").
- **Tape entry (15.2):**
  - Blank sites are allowed; the confirmation dialog lists them ("7 measurements are empty") alongside implausible values ("You entered 12.0 cm for waist. Is that correct?").
  - Values must have at most one decimal.
  - The page makes no request that could return system values (asserted in e2e).
  - Readings go to a separate Dexie DB (`vt-study`, table `readings`, image-guard hooks) when the server cannot be reached (network error or 5xx). They are sent on `online`, every 30 s and via "Send now". A queued reading that turns out to be locked or invalid is dropped and reported.
  - A browser `beforeunload` prompt guards unsaved typed readings.
  - The Appendix C instructions behind (i) are drafts: `study.instr.*` in `src/lib/i18n/messages/study.*.ts`. **[CONFIRM against the study protocol.]**
- **Image vault (15.6):** `src/lib/study/imageVault.ts`, AES-GCM-256 with a key from PBKDF2-SHA-256 at 310,000 iterations (a lower count is refused).
  - Random 16-byte salt and 12-byte IV. File format `VTIMG1 | salt | iv | ciphertext`. File name `P001-set2.vtimg`.
  - `saveVault` throws `VaultDisabledError` unless `VITE_FEATURE_STUDY_IMAGES=true`.
  - UI: `src/lib/ui/StudyImageVault.svelte`, shown on Study › Exports in its disabled state. The capture flow (15.1) should pass the frames and meta to it after the burst, then release the frames.
  - `decryptVault` exists for the study-laptop tooling and tests.

## Traceability rows (Phase 6)

| Requirement | Test |
|---|---|
| FR-20 audit records (admin, all users, CSV) | `tests/e2e/admin.spec.ts` "audit: filter and export CSV (download is logged)" |
| FR-21 approvals, audit, retention | `admin.spec.ts` "approve a pending tailor", "reject needs a reason…", "bulk approve via selection", "settings: retention, study mode off hides the Study section", "deletion requests are listed" |
| FR-22 study CSV export | `admin.spec.ts` "study: enrol next participant, create measurer, download both exports" |
| FR-23 blind tape entry | `tests/e2e/study.spec.ts` "measurer enters a reading blind to system values; it locks", "reading 2 before reading 1 is accepted and flagged", "server unreachable: reading is queued…"; `tests/unit/study.test.ts` (queue, helpers) |
| 7.2 role guards / study 404 | `study.spec.ts` "a tailor cannot open tape entry (403)", "study routes return 404 when study mode is off"; `auth.spec.ts` "wrong role gets a 403 screen" |
| 15.6 image vault (flag off) | `tests/unit/study.test.ts` "study image vault" (round trip, wrong passphrase, iteration floor, file name, disabled by default) |
| 17 accessibility | `admin.spec.ts` "axe: admin routes (en/sw)", `study.spec.ts` "axe: tape entry (en/sw)" |

Screenshots: `docs/checkpoints/phase-6/` (EN + SW, 360 × 800 and 1280 × 800).

## Test totals at the end of Phase 6

- Unit (Vitest): 128 passed.
- E2E (Playwright, phone 360 × 800 and desktop 1280 × 800, `VT_PORT=5190`): 102 passed, including the Phase 0 and 1 specs.

## No API contract changes

All screens use the Phase 1 endpoints as documented. Mock-only behaviour changed: browser persistence, described above.
