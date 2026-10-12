# Owner decisions (Section 3)

Recorded 2026-10-12. The owner answered **"use the defaults"** for all ten questions.

| # | Question | Decision | Status |
|---|---|---|---|
| 1 | Study image export (C5) | Build the UI and the encryption module behind `VITE_FEATURE_STUDY_IMAGES=false`. Leave it disabled. Implement the save path only after written approval from the owner **and** the MKU ethics committee (IERC). Until then the save is stubbed with "Disabled pending ethics approval". | Default |
| 2 | Offline code check | Accept a code with a valid format (`^[A-Z]{2}[0-9]{4}$`) offline, mark it `unverified`, verify at first sync. If the server rejects it, mark the profile `rejected` and tell the client in plain words to check the code with their tailor. | Default |
| 3 | Client deletion requests | The device sends the profile IDs it holds (unguessable UUIDv4) as proof of possession. Local data is deleted at once; server deletion is requested through the sync queue. | Default |
| 4 | Auth token transport | `Authorization: Bearer`, token in memory mirrored to `sessionStorage` (cleared when the tab closes), 24-hour expiry. Behind an `AuthTransport` interface so an httpOnly / Secure / SameSite=Strict cookie can replace it. **Open:** ask the backend engineer which they prefer. | Default, open item |
| 5 | Garment-to-site mapping | The table in Section 13.6. To be confirmed after the tailor interviews. | Default, [CONFIRM] |
| 6 | Tailor display unit | Centimetres by default, per-tailor setting for inches (nearest 1/8 in). Always store and send millimetres. | Default |
| 7 | Hosting | Same origin, API under `/api/v1`, configurable via `VITE_API_BASE_URL`. | Default |
| 8 | Marker | ArUco `DICT_4X4_50`, id 0, printed 150 × 150 mm centred on A4, with a 10 cm print-check line and a credit-card outline (85.6 × 54.0 mm). | Default |
| 9 | Neck girth | Included and flagged like the other girths. May be hidden later if the pilot finds the neck mask unreliable. | Default |
| 10 | Kiswahili copy | The agent writes the first draft. Every Kiswahili string is `reviewed: false` in `i18n-review.md` until a native speaker approves it. A "Kiswahili not reviewed" banner shows in development builds. | Default |

## Process decisions

- **Delivery cadence:** build one phase at a time (Section 22), stop after each phase for the owner's checks, and commit to GitHub at each checkpoint.

## Implementation choices made in Phase 0

- **SvelteKit 2** is pinned (`^2.70`) as the prompt requires, although SvelteKit 3 is now published. Vite 6, Svelte 5 (runes), TypeScript strict with `noUncheckedIndexedAccess`.
- **Mock backend seam:** in both modes the UI uses one `HttpApiClient`. In mock mode, MSW intercepts `fetch` at the network layer, so `VITE_API_MODE=http` is the only switch needed. There is no separate `MockApiClient` class; the MSW handlers *are* the mock.
- **Service-worker scope:** only one service worker can own `/`. In development with `VITE_API_MODE=mock`, MSW's worker is registered and the app worker is not. In production, the app worker is registered and MSW is not bundled (its script is served only by a dev-server middleware).
- **Language preference** is mirrored to `localStorage` (`vt.lang`) so the first paint is in the right language before IndexedDB opens. It is a UI preference, not personal data, and is allowed by Section 19 (which forbids tokens in `localStorage`).

## Implementation choices made in Phase 1

- **Contract additions beyond Section 20.2** (all documented in `api-contract.md` / `openapi.yaml`): `GET /orders` also returns `counts` per status for the queue chips; `GET /me` carries `unit_pref`, `include_name_default` and `ease_presets`; `GET /clients/{id}` embeds the client's profiles and orders; participants carry completeness (`sets_captured`, `readings` per site); reference-reading results carry `out_of_order`; account status adds `rejected` (with `reject_reason`).
- **Error codes not named in the prompt:** deleting a non-new order returns `409 validation_failed` (a dedicated `order_in_progress` code may be cleaner; backend to decide). Unconfirmed flagged rows return `422` with `errors[].code = flag_unconfirmed`. Profile bodies over 200 KB return `413`.
- **Conflicts:** a device profile that reaches the server with a version not above the server's latest becomes a conflict pair keyed by the server copy's `profile_id`.
- **Mock sheet rendering:** the mock draws the Figure 5.6 layout as SVG, rasterises it to PNG in the browser and writes a text-only PDF. The real server renders both.
- **Audit actions:** reject / disable / enable / measurer creation reuse `approve` or `settings_change` because the `AuditAction` enum has nothing more specific; conflict resolution logs `settings_change`. Backend may extend the enum.
- **Dev-only pages:** `/dev/ui` (component gallery) and `/dev/mock` (latency and per-endpoint failure toggles, reset to seed) return 404 in production builds. Their demo content is sample data and is not translated; component strings are.
- **Seed extras:** a `disabled@vt.test` tailor (to demo the disabled-account message) and study participants linked to admin-owned client codes `SP1001`–`SP1005`.

## Implementation choices made in Phase 2 (client flow)

- **Fake vision by default in development.** Dev builds use the `FakeVisionEngine` (scripted check sequences + synthetic bodies from the measurement module) unless `/dev/capture-tuning` selects the real camera. Production always uses the real pipeline. Scenarios: happy, perfect, every-check, cancel-countdown, dark-room, scale-disagree, inleg-fail, bad-burst.
- **Phone check in two stages.** `/check` runs everything that needs no permission at once. The camera rows (back camera, picture size) are completed on `/setup` right after the client taps "Allow camera", so the browser prompt always follows the priming text (9.6 step 3). A camera failure there sends the client back to `/check` with the "cannot measure" alternatives.
- **"Open camera" on the consent screen** leads through the phone check (first time or after a browser update), the sheet print check (once per sheet) and setup before the camera actually opens. The label follows Figure H.3; the camera opens two short steps later.
- **Masks are kept in memory until the review ends.** Section 2.1.2 says to release masks right after measurement, but 9.10 requires a retake of one view to recompute without redoing the other. The per-view binary masks (at mask resolution, never stored or sent) are therefore released when the client saves, discards or leaves the review; frames and stills are never held beyond the burst. The memory test asserts zero live capture buffers after Save. **Please confirm** this reading, or accept that a retake recaptures both views.
- **AB1234 conflicts by design in the mock.** A fresh phone saving for `AB1234` (which already has v2 on the server) gets version 1 and becomes a conflict for the tailor to resolve (12.2). Use `QT1200` to see a clean "Saved and sent".
- **Coming back online retries at once.** Ops that failed with a network error become due immediately on the `online` event instead of waiting for their backoff slot; saving while offline does not attempt a send.
- **Recorded audio clips:** none shipped yet ([CONFIRM] native-speaker recordings). `speechSynthesis` is used when the phone has a voice for the language; otherwise tones only. See `static/audio/README.md`.
- **Measuring sheet** is generated by `npm run marker` (no dependencies) and verified with OpenCV 4.10: marker id 0 detected, side 149.75 mm at 4 px/mm.

## Implementation choices made in Phase 3 (real capture pipeline)

- **Classic workers bundled by esbuild.** MediaPipe's WASM loader calls `importScripts`, which throws in ES-module workers, and Vite's dev server only serves module workers. The worker sources stay in TypeScript (`src/lib/vision/{pose,marker}.worker.ts`) and `npm run vendor` bundles them into classic IIFE workers at `/workers/`. Same files in dev and production; same origin; no `eval`.
- **Vision assets are vendored, not committed.** `npm run vendor` copies MediaPipe's SIMD WASM and OpenCV.js from `node_modules` and downloads `pose_landmarker_lite.task` from MediaPipe's model bucket, verified against a pinned SHA-256 (`--full` adds the Full model). It runs automatically before `dev` and `build`. Only the SIMD WASM ships: non-SIMD browsers already fail the phone check.
- **No background download.** The app service worker never precaches `/models`, `/wasm` or `/opencv`. They enter the `vt-models-v1` cache only when the client taps "Download now" (with MB progress, 3 tries per file), and the service worker serves them from that cache when offline.
- **Stock OpenCV.js 4.10 is enough** (`cv.aruco_ArucoDetector`, sub-pixel refinement); see `docs/opencv-build.md`.
- **Two bitmaps per burst frame** (one transferred to each worker) are processed one frame at a time and closed at once, so the pipeline never holds more than two working frames plus the still, below the 5 + 1 limit in 10.2.
- **Marker size for the live check** is converted to the resolution used for scale (the full-res still on Android, the stream on iOS) before the 80 px rule.
- **Test shim:** Chromium's fake camera reports no facing mode, so `tests/e2e/real.spec.ts` patches `getSettings()` to report `'environment'`, as a phone's rear camera does. The app's rear-camera check is unchanged.
- **Not verifiable here:** pose detection on a real person, lens switching, ImageCapture stills, iOS orientation permission and timings on the four reference phones. These need the device tests in `docs/device-test-log.md`.

## Implementation choices made in Phase 5 (tailor dashboard)

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
- **Version line:** Settings shows `APP_VERSION` (from `package.json`) and `RULES_VERSION` from `$lib/measure` (via `src/lib/version.ts`).
- **Header section title** is a `<p>`; each page owns the single `<h1>`.

## Implementation choices made in Phase 6 (admin and study)

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

- **Study capture (15.1)** is the client capture flow started from `/study/capture` (admin only): participant code, set number (mode defaults: sets 1 and 3 self, set 2 assisted), lighting, distance (1.5–3.5 m), observed fit, phone model (UA-CH, or a list on iPhone), optional lux, tape stature, and "Paper consent confirmed" instead of the three-box consent (`study-paper-1.0`). The saved profile carries the `study` block (C6) and the participant's linked client code; Saved offers "Start set N+1".
- **Image vault in study capture:** with `VITE_FEATURE_STUDY_IMAGES=false` (decision 1) the capture flow keeps no frames for the vault, and no photo-retention tick box is shown. Wiring frames into `StudyImageVault` is part of the approval work.
- **Mock persistence:** in the browser the MSW mock saves its database to `sessionStorage` (`vt.mock.db`) so a full reload keeps tokens and data; unit tests keep it in memory.
