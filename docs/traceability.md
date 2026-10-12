# Traceability (Section 21.3)

The "Test" column is filled in as each test is written. *Planned* means not built yet.

| Requirement | Prompt section | Primary test | Test (actual) |
|---|---|---|---|
| FR-01 PWA, offline capture | 5, 9.6, 9.14, 12 | e2e offline capture | `tests/e2e/smoke.spec.ts` offline banner (partial); planned |
| FR-02 code, height, sex, fit; refuse without code | 9.2 | unit validators; e2e | `tests/unit/validate.test.ts`; `CodeInput` mask in `tests/e2e/components.spec.ts`; screen e2e planned (Phase 2) |
| FR-03 bilingual consent, version recorded | 9.3, 16 | e2e EN/SW consent | planned (Phase 2) |
| FR-04 live checks, shutter disabled until pass | 9.7, 9.8, 10.3 | unit checks; e2e fixtures | planned (Phase 2–3) |
| FR-05 5-frame burst, medians | 10.4 | unit | planned (Phase 3) |
| FR-06 marker + stature scales, 4% rule | 11.1, 9.9 | unit; e2e retake | planned (Phase 4) |
| FR-07 eight measurements by Table 3.1 | 11.2 | unit synthetic body | planned (Phase 4) |
| FR-08 flags | 11.3, 9.10 | unit; e2e review | planned (Phase 4) |
| FR-09 frames discarded; no image stored/sent | 2.1, 10.2, 19 | memory + network privacy tests | `tests/unit/imageGuard.test.ts` (storage half); network/memory planned |
| FR-10 IndexedDB profile | 12.1 | unit; e2e reload | `tests/unit/imageGuard.test.ts` (schema v1); planned |
| FR-11 sync, LWW, conflicts shown | 12.2, 13.10 | unit sync; e2e conflict | contract: `tests/unit/contract.test.ts` (409, conflict list/resolve); client sync planned (Phase 2) |
| FR-12 review, retake, save/discard | 9.10 | e2e | planned |
| FR-13 tailor accounts, expiring tokens | 13.1, 19 | e2e login/expiry | `tests/unit/auth.test.ts` (transport, expiry, guards); contract login/rate-limit; screens planned (Phase 5) |
| FR-14 issue code, display name, height | 13.3 | e2e | contract `POST /clients`, rotate; screens planned (Phase 5) |
| FR-15 client list, dated profiles, sheet with flags | 13.2, 13.4, 13.5 | e2e | planned |
| FR-16 order from profile, ease, override | 13.6 | unit validators; e2e | `tests/unit/validate.test.ts` (ease, due date); contract (flag_unconfirmed, override audit); screens planned |
| FR-17 order queue by status | 13.7, 13.8 | e2e | contract (counts, filter, status history); screens planned |
| FR-18 sheet PDF/PNG, name off by default | 13.9 | e2e (mock sheet) | `tests/unit/shareText.test.ts`; contract (PDF served, name only when asked) |
| FR-19 WhatsApp via Web Share or wa.me | 13.9, 13.3 | e2e both paths | planned |
| FR-20 audit records | 13.11, 14 | e2e (mock records) | contract (profile_view, override, share, status_change, export logged; tailor sees own only) |
| FR-21 approvals, audit, retention | 14 | e2e admin | contract (approve, reject reason, settings round-trip) |
| FR-22 study CSV export | 15.5 | e2e | contract (Appendix E columns present) |
| FR-23 blind tape entry | 15.2 | e2e (no system values in DOM) | contract (locked, out-of-order, values not echoed, measurer 403 on profiles) |
| NFR-01 ≤ 20 s | 18, 21.2 | device log | planned |
| NFR-02 ≤ 30 MB first load | 18 | Lighthouse / network | planned |
| NFR-03 offline capture and auto-sync | 12.2 | e2e offline | planned |
| NFR-04 accuracy tiers | 11 | validation study (outside repo) | n/a |
| NFR-05 SUS ≥ 68 | 13 | tailor study (outside repo) | n/a |
| NFR-06 EN/SW everywhere | 16 | i18n parity test | `tests/unit/i18n.test.ts` |
| NFR-07 ≥ 80% self-capture within 3 attempts | 9.6–9.8, 10.6 | pilot logs | n/a |
| NFR-08 no profile lost | 12.2 | fault-injection e2e | planned |
| NFR-09 TLS, token expiry | 19 | config review | `docs/api-contract.md` headers (partial) |
| NFR-10 no image leaves phone | 2.1, 19 | network privacy test | planned (Phase 3) |
| NFR-11 append-only audit (server) | 13.11 | contract note | `docs/api-contract.md` audit section |
| NFR-12 platform floor (C3) | 2.2, 9.4 | device log | planned |
| NFR-13 versioned rules, unit tests | 11.2, 11.4 | coverage ≥ 90% in measure/ | planned (Phase 4) |
| NFR-14 licences | 2.3 | `LICENSES.md` check in CI | `scripts/licenses.mjs` (CI) |
| WCAG 2.2 AA contrast | 8.2, 17 | unit | `tests/unit/contrast.test.ts` |
| Accessibility (axe) | 17 | axe on every route | `tests/e2e/smoke.spec.ts` (welcome), `tests/e2e/components.spec.ts` (all components, EN + SW) |
