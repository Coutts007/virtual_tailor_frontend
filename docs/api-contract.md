# API contract (draft)

> **Status: Phase 0 stub.** The full contract (every endpoint in Section 20.2, errors, pagination, the DB change list and the integration checklist) is delivered in **Phase 1**, together with `openapi.yaml` and the complete MSW mock.

## Conventions (Section 20.1)

- Base path `/api/v1`, JSON UTF-8, timestamps ISO 8601 UTC.
- Lengths are **integer millimetres** on the wire.
- IDs are UUIDs; `client_code` matches `^[A-Z]{2}[0-9]{4}$`; `participant_code` matches `^P[0-9]{3}$`.
- Errors use RFC 9457 `application/problem+json` with a stable `code`.
- Pagination: `?page=1&page_size=25` → `{ items, page, page_size, total }`.

## Implemented in the mock so far

| Method & path | Response |
|---|---|
| `GET /settings/public` | `{ study_mode, consent_version, min_app_version }` |

Any mock endpoint accepts `?__fail=<status>` to simulate an error.

## Deployment headers (for the deployer)

```
Strict-Transport-Security: max-age=63072000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self' <api-origin>; img-src 'self' blob: data:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'
```

The SPA fallback (`index.html`) must be served for unknown paths. `service-worker.js` must be served with `Cache-Control: no-cache`.
