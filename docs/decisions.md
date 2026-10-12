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
