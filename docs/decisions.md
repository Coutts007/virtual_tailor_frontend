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
