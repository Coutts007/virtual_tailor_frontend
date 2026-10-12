# Traceability (Section 21.3)

The "Test" column is filled in as each test is written. *Planned* means not built yet.

| Requirement | Prompt section | Primary test | Test (actual) |
|---|---|---|---|
| FR-01 PWA, offline capture | 5, 9.6, 9.14, 12 | e2e offline capture | `client.spec.ts` save-while-send-fails → pending → sends; offline shell on the production build in Phase 7 |
| FR-02 code, height, sex, fit; refuse without code | 9.2 | unit validators; e2e | `validate.test.ts`; `client.spec.ts` details form (mask, range, feet), full flows |
| FR-03 bilingual consent, version recorded | 9.3, 16 | e2e EN/SW consent | `client.spec.ts` consent required + version line; full flow EN and SW |
| FR-04 live checks, shutter disabled until pass | 9.7, 9.8, 10.3 | unit checks; e2e fixtures | `capture/checks.test.ts` (24); `vision.test.ts` frame stats; `client.spec.ts` every correction + shutter disabled; `real.spec.ts` live marker/pose checks |
| FR-05 5-frame burst, medians | 10.4 | unit | `vision.test.ts` (medians, majority mask, marker confidence); `capture/stateMachine.test.ts`; `client.spec.ts` bad burst |
| FR-06 marker + stature scales, 4% rule | 11.1, 9.9 | unit; e2e retake | `measure/scale.test.ts`; `client.spec.ts` scale disagreement → retake front |
| FR-07 eight measurements by Table 3.1 | 11.2 | unit synthetic body | `measure/profile.test.ts` full synthetic bodies (6 bodies, ±1.5% lengths / ±3% girths); `sites.test.ts` |
| FR-08 flags | 11.3, 9.10 | unit; e2e review | `measure/flags.test.ts`; `client.spec.ts` inside leg Not measured with reason |
| FR-09 frames discarded; no image stored/sent | 2.1, 10.2, 19 | memory + network privacy tests | `imageGuard.test.ts`; `client.spec.ts` buffers released + IndexedDB dump; `real.spec.ts` zero live ImageBitmaps after capture |
| FR-10 IndexedDB profile | 12.1 | unit; e2e reload | `sync.test.ts` (save, version); `client.spec.ts` My measurements survives reload; nothing image-like in IndexedDB |
| FR-11 sync, LWW, conflicts shown | 12.2, 13.10 | unit sync; e2e conflict | `sync.test.ts` (201/404/409/422/backoff/24 h/online); contract; tailor conflicts screen in Phase 5; `tailor.spec.ts` "conflicts: badge → resolve → none left" |
| FR-12 review, retake, save/discard | 9.10 | e2e | `client.spec.ts` full flows, retake, delete my data |
| FR-13 tailor accounts, expiring tokens | 13.1, 19 | e2e login/expiry | `tests/unit/auth.test.ts` (transport, expiry, guards); contract login/rate-limit; screens planned (Phase 5); `tests/e2e/auth.spec.ts`: sign in by role, generic wrong-password message, pending → waiting screen, disabled message, `next=` round trip, expired session message, sign out clears session, registration validation; `tests/unit/auth.test.ts` |
| FR-14 issue code, display name, height | 13.3 | e2e | contract `POST /clients`, rotate; screens planned (Phase 5); `tests/e2e/tailor.spec.ts` "issue code → share card with QR → WhatsApp fallback (wa.me)" |
| FR-15 client list, dated profiles, sheet with flags | 13.2, 13.4, 13.5 | e2e | planned; `tailor.spec.ts` "search clients (debounced) and open a measurement sheet" |
| FR-16 order from profile, ease, override | 13.6 | unit validators; e2e | `tests/unit/validate.test.ts` (ease, due date); contract (flag_unconfirmed, override audit); screens planned; `tailor.spec.ts` "create order: flagged row must be confirmed, override is audited…", "keyboard-only order flow"; `tests/unit/orderItems.test.ts` |
| FR-17 order queue by status | 13.7, 13.8 | e2e | contract (counts, filter, status history); screens planned; `tailor.spec.ts` "status change from the queue, backwards needs confirmation", "order queue: overdue tag and collected hidden by default" |
| FR-18 sheet PDF/PNG, name off by default | 13.9 | e2e (mock sheet) | `tests/unit/shareText.test.ts`; contract (PDF served, name only when asked); `tailor.spec.ts` create-order test (generate, preview, name absent from share text) |
| FR-19 WhatsApp via Web Share or wa.me | 13.9, 13.3 | e2e both paths | planned; `tailor.spec.ts` (wa.me fallback for code card and sheet) |
| FR-20 audit records | 13.11, 14 | e2e (mock records) | contract (profile_view, override, share, status_change, export logged; tailor sees own only); `tests/e2e/admin.spec.ts` "audit: filter and export CSV (download is logged)" |
| FR-21 approvals, audit, retention | 14 | e2e admin | contract (approve, reject reason, settings round-trip); `admin.spec.ts` "approve a pending tailor", "reject needs a reason…", "bulk approve via selection", "settings: retention, study mode off hides the Study section", "deletion requests are listed" |
| FR-22 study CSV export | 15.5 | e2e | contract (Appendix E columns present); `admin.spec.ts` "study: enrol next participant, create measurer, download both exports" |
| FR-23 blind tape entry | 15.2 | e2e (no system values in DOM) | contract (locked, out-of-order, values not echoed, measurer 403 on profiles); `tests/e2e/study.spec.ts` "measurer enters a reading blind to system values; it locks", "reading 2 before reading 1 is accepted and flagged", "server unreachable: reading is queued…"; `tests/unit/study.test.ts` (queue, helpers) |
| NFR-01 ≤ 20 s | 18, 21.2 | device log | planned |
| NFR-02 ≤ 30 MB first load | 18 | Lighthouse / network | vendor report: 29.5 MB raw, ≈ 12.3 MB gzip (`docs/device-test-log.md`); Lighthouse in Phase 7 |
| NFR-03 offline capture and auto-sync | 12.2 | e2e offline | `sync.test.ts` online wake; `client.spec.ts` pending → sent |
| NFR-04 accuracy tiers | 11 | validation study (outside repo) | n/a |
| NFR-05 SUS ≥ 68 | 13 | tailor study (outside repo) | n/a |
| NFR-06 EN/SW everywhere | 16 | i18n parity test | `tests/unit/i18n.test.ts` |
| NFR-07 ≥ 80% self-capture within 3 attempts | 9.6–9.8, 10.6 | pilot logs | n/a |
| NFR-08 no profile lost | 12.2 | fault-injection e2e | `client.spec.ts` send fails → reload → still pending → sent; `sync.test.ts` write-before-Saved |
| NFR-09 TLS, token expiry | 19 | config review | `docs/api-contract.md` headers (partial) |
| NFR-10 no image leaves phone | 2.1, 19 | network privacy test | `client.spec.ts` (fake vision) and `real.spec.ts` (real camera + workers) network interception |
| NFR-11 append-only audit (server) | 13.11 | contract note | `docs/api-contract.md` audit section |
| NFR-12 platform floor (C3) | 2.2, 9.4 | device log | planned |
| NFR-13 versioned rules, unit tests | 11.2, 11.4 | coverage ≥ 90% in measure/ | `measure/rules.test.ts`; coverage 99.25% statements of `src/lib/measure` (CI gate) |
| NFR-14 licences | 2.3 | `LICENSES.md` check in CI | `scripts/licenses.mjs` (CI) |
| WCAG 2.2 AA contrast | 8.2, 17 | unit | `tests/unit/contrast.test.ts` |
| Accessibility (axe) | 17 | axe on every route | `smoke.spec.ts`, `components.spec.ts`, `client.spec.ts` (every client route incl. capture and review, EN + SW) |
| 7.2 role guards / study 404 | 7.2 | e2e | `study.spec.ts` (tailor 403 on tape entry, 404 when study mode off), `auth.spec.ts` (403 screen), `studyCapture.spec.ts` (measurer 403 on study capture) |
| 15.1 study capture | 15.1, C6 | e2e | `studyCapture.spec.ts` (covariates, paper consent, study block saved, next-set shortcut) |
| 15.6 image vault (flag off) | 15.6, C5 | unit | `study.test.ts` (AES-GCM round trip, wrong passphrase, ≥ 310k iterations, file name, disabled by default) |
| 13 offline: banner, mutations off | 13 | e2e | `tailor.spec.ts` offline test |
