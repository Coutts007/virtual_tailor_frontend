# Virtual Tailor API contract (v1)

This is the contract between the Virtual Tailor front end (SvelteKit PWA) and the FastAPI + PostgreSQL backend. The machine-readable version is `openapi.yaml` (OpenAPI 3.1). The front end talks only to the `ApiClient` interface in `src/lib/api/client.ts`; every method there maps to exactly one row below. TypeScript wire types are in `src/lib/api/types.ts`.

When this document and the code disagree, raise it. Do not silently follow either.

---

## 1. Conventions

| Topic | Rule |
|---|---|
| Base path | `/api/v1` (same origin by default; `VITE_API_BASE_URL` configurable, decision 7) |
| Format | JSON, UTF-8. CSV exports are `text/csv; charset=utf-8` |
| Timestamps | ISO 8601 UTC with `Z`, e.g. `2027-05-12T07:42:00Z`. The UI displays them in Africa/Nairobi |
| Dates | Calendar dates (due date, trained-on, filter ranges) are `YYYY-MM-DD`, interpreted as Nairobi dates |
| Lengths | **Integer millimetres** on the wire. The UI converts to cm or inches |
| IDs | UUIDs (v4). `profile_id` and `session_id` are generated on the phone (`crypto.randomUUID()`) |
| `client_code` | `^[A-Z]{2}[0-9]{4}$`, e.g. `AB1234` |
| `participant_code` | `^P[0-9]{3}$`, e.g. `P001` |
| `order_no` | Human-readable, server-assigned, e.g. `ORD-0231` |
| Phone | E.164, Kenyan mobile, e.g. `+254712345678` (UI normalises `07XXXXXXXX`) |
| Pagination | `?page=1&page_size=25` → `{ items, page, page_size, total }`. `page` is 1-based; default `page_size` 25, max 100 |
| Nulls | Optional fields that the server knows are empty are sent as `null`, not omitted, where the type says `X \| null` |

### 1.1 Errors: RFC 9457 problem details

Every non-2xx response has `Content-Type: application/problem+json` and a stable `code` that the UI maps to an i18n string. The `title` and `detail` text is for logs only; the UI never shows it.

```json
{ "type": "https://vt.example/problems/profile_version_conflict",
  "title": "Profile version conflict", "status": 409,
  "code": "profile_version_conflict", "server_version": 3 }
```

| `code` | HTTP | Emitted by | Extra fields |
|---|---|---|---|
| `invalid_credentials` | 401 | `POST /auth/login`, `POST /me/password` (wrong current password) | — |
| `account_pending` | 403 | `POST /auth/login` | — |
| `account_disabled` | 403 | `POST /auth/login`; any authenticated call after disabling | — |
| `rate_limited` | 429 | `POST /auth/login`, all client-app endpoints | `Retry-After` header (seconds); `retry_after_s` in body |
| `token_expired` | 401 | Any authenticated endpoint with an expired or revoked token | — |
| `forbidden` | 403 | Wrong role, or a tailor touching another tailor's data | — |
| `not_found` | 404 | Any `/{id}` path | — |
| `code_not_found` | 404 | `GET /client-codes/{code}`, `POST /profiles`, `POST /deletion-requests` | — |
| `validation_failed` | 422 | Any request body or query | `errors: [{ field, code }]` (`field` is a JSON pointer-ish dotted path, `code` e.g. `required`, `pattern`, `range`, `too_short`, `common_password`, `email_taken`, `participant_unknown`, `participant_exists`, `measurer_code_taken`) |
| `profile_version_conflict` | 409 | `POST /profiles` | `server_version: number` |
| `client_has_orders` | 409 | `DELETE /clients/{id}` | — |
| `due_date_past` | 422 | `POST /orders`, `PATCH /orders/{id}` | — |
| `ease_out_of_range` | 422 | `POST /orders`, `PATCH /orders/{id}` (ease outside 0–300 mm) | `errors` with the item `site_code` |
| `study_mode_off` | 404 | All `/study/*` endpoints and `/admin/study`-backed endpoints when study mode is off | — |
| `reading_locked` | 409 | `POST /study/reference-readings` (same participant, measurer and reading number already saved) | — |

The front end also uses two client-side codes that the server never sends: `network_error` (fetch failed, status 0) and `unknown` (non-JSON error body).

### 1.2 Authentication

- `POST /auth/login` returns `{ access_token, expires_at, user }`. The token is a JWT sent as `Authorization: Bearer <token>`. **Expiry: 24 hours** (decision 4).
- On expiry or revocation the server returns `401 token_expired`. The UI signs out, shows "Your session ended" and redirects to `/login?next=…`.
- The UI keeps the token in memory, mirrored to `sessionStorage` (cleared when the tab closes). Never in `localStorage` or IndexedDB.
- **Open question for the backend engineer:** the UI's `AuthTransport` can switch to an httpOnly, Secure, `SameSite=Strict` cookie instead of the bearer header. If you prefer the cookie, say so; the login response then omits `access_token` and the UI sends `credentials: 'same-origin'` (it already does).
- `account_pending` and `account_disabled` on login must not reveal whether the password was right for a non-existent email. Wrong email and wrong password both return `invalid_credentials` (no account enumeration).
- "Sign out everywhere" is **[CONFIRM]**: if supported, add `POST /auth/logout?all=true`.

### 1.3 Roles

| Role | Who | Lands on |
|---|---|---|
| (none) | Client app on a phone; no account | — |
| `tailor` | Approved tailor (status `active`) | `/t/orders` |
| `admin` | Researcher / platform operator | `/admin/accounts` |
| `measurer` | Study tape measurer | `/study/reference` |

Account `status ∈ { pending, active, disabled, rejected }`. Only `active` accounts may call authenticated endpoints. A tailor only ever sees their own clients, profiles, orders, sheets and audit entries. The server must enforce this; the UI hides what a role cannot do but is not the guard.

### 1.4 Client-app endpoints

`GET /settings/public`, `GET /client-codes/{code}`, `POST /profiles` and `POST /deletion-requests` are **unauthenticated** and must be **rate-limited per IP and per client code** (suggested: 30/min per IP for code checks, 10/min per code for profile posts). Return `429 rate_limited` with `Retry-After`.

---

## 2. Endpoints

Legend: **Role** = who may call it. **Audit** = event the server must append to the audit log (`AuditEntry.action`).

### 2.1 Public

| `ApiClient` | Method & path | Role | Request | Response | Errors |
|---|---|---|---|---|---|
| `getPublicSettings` | `GET /settings/public` | anyone | — | `PublicSettings { study_mode, consent_version, min_app_version }` | — |

`study_mode` gates every study route in the UI (they return 404 when off). `consent_version` is the version currently served (`"1.0"`). `min_app_version`: if the installed app is older, the UI asks the user to refresh.

### 2.2 Client app

| `ApiClient` | Method & path | Role | Request | Response | Errors |
|---|---|---|---|---|---|
| `checkClientCode` | `GET /client-codes/{code}` | anyone | — | `{ valid: true, tailor_business_name, height_mm \| null }` | 404 `code_not_found`, 429 |
| `syncProfile` | `POST /profiles` | anyone | `MeasurementProfilePayload` + header `Idempotency-Key: <profile_id>` | 201 `{ profile_id, version }` | 409 `profile_version_conflict`, 404 `code_not_found`, 422 `validation_failed`, 429 |
| `requestDeletion` | `POST /deletion-requests` | anyone | `{ client_code, profile_ids: uuid[], reason: 'delete' \| 'withdraw_consent' }` | 202 `{ request_id }` | 404 `code_not_found`, 422, 429 |

**`GET /client-codes/{code}`** — returning `height_mm` (the height the tailor measured when issuing the code) is **[CONFIRM]**. It is pseudonymous but is still personal data; drop it if the owner prefers and return `null`.

**`POST /profiles` (sync):**
- The phone retries with exponential backoff. `Idempotency-Key` equals `profile_id`; a repeat of an already-stored identical payload must return **201 with the same body**, not a conflict.
- `version` is chosen by the phone: (highest local version for this `client_code`) + 1.
- If the server already holds a profile for this client with `version ≥` the posted version (and a different `profile_id`), return `409 profile_version_conflict` with `server_version`. **Store the posted profile anyway** as a conflict candidate so the tailor can resolve it at `/t/conflicts` (Section 2.4).
- If the code does not exist (or was rotated away): `404 code_not_found`. The phone marks the profile `rejected` and tells the client to check the code with their tailor.
- `422` on schema failures. The phone keeps the profile `pending`, and after 3 attempts tells the client to contact their tailor.
- `measurements[]` has 9 rows including the `stature` check row. A failed site has `value_mm: null` and `confidence_flag: 'fail'` (correction C4).
- `landmarks_front` / `landmarks_side` have 33 normalised landmarks each. They are coordinates, not images.
- **The server must reject** any body containing image data (base64 `data:image`, binary). Bodies over 200 KB are a bug: return 413.
- Server sets `sync_status` and `created_at`; links `client_id` from `client_code`.

**`POST /deletion-requests`:** proof of possession is the list of profile UUIDs held by the phone (decision 3). The server deletes those profiles if they belong to `client_code` and records the request (see `GET /admin/deletion-requests`). Audit: `deletion`. Withdrawal of consent also sets `consent.withdrawn_at` on the stored profiles before deletion.

### 2.3 Auth and own account

| `ApiClient` | Method & path | Role | Request | Response | Errors | Audit |
|---|---|---|---|---|---|---|
| `register` | `POST /auth/register` | anyone | `RegisterInput { email, password, business_name, phone, area, locale }` | 201 `{ status: 'pending' }` | 422 (`email_taken`, `too_short`, `common_password`, `pattern` on phone), 429 | — |
| `login` | `POST /auth/login` | anyone | `{ email, password }` | `LoginResponse { access_token, expires_at, user: SessionUser }` | 401 `invalid_credentials`, 403 `account_pending` / `account_disabled`, 429 `rate_limited` | `login` |
| `logout` | `POST /auth/logout` | logged in | — | 204 | — | — |
| `getMe` | `GET /me` | logged in | — | `Me` | 401 | — |
| `updateMe` | `PATCH /me` | logged in | `MePatch` | `Me` | 422 | `settings_change` |
| `changePassword` | `POST /me/password` | logged in | `{ current_password, new_password }` | 204 | 401 `invalid_credentials`, 422 | `settings_change` |

- Password rule: minimum 10 characters, no composition rules, rejected if on a common-password list. The UI checks a small bundled list; the server should check a larger one.
- `SessionUser { user_id, email, role, status, locale, measurer_code? }`.
- `Me` extends `SessionUser` with `business_name?`, `phone?`, `area?`, **`unit_pref: 'cm' | 'in'`** (decision 6, default `cm`), **`include_name_default: boolean`** (default `false`) and **`ease_presets: { [garment]: { [site_code]: ease_mm } }`** (default `{}`).

### 2.4 Clients and profiles (tailor)

| `ApiClient` | Method & path | Role | Request | Response | Errors | Audit |
|---|---|---|---|---|---|---|
| `listClients` | `GET /clients?search=&sort=&filter=&page=&page_size=` | tailor (own), admin (all) | — | `Page<ClientSummary>` | — | — |
| `issueClientCode` | `POST /clients` | tailor | `{ display_name?, height_mm? }` | 201 `{ client_id, client_code, deep_link }` | 422 | `code_issue` |
| `getClient` | `GET /clients/{id}` | tailor (own), admin | — | `ClientDetail` | 403, 404 | — |
| `updateClient` | `PATCH /clients/{id}` | tailor (own) | `{ display_name?: string \| null, height_mm?: number \| null }` | `ClientDetail` | 422 | — |
| `rotateClientCode` | `POST /clients/{id}/rotate-code` | tailor (own) | — | `{ client_code }` | 404 | `code_issue` |
| `deleteClient` | `DELETE /clients/{id}` | tailor (own), admin | — | 204 | 409 `client_has_orders` | `deletion` |
| `listClientProfiles` | `GET /clients/{id}/profiles` | tailor (own), admin | — | `ProfileSummary[]` (newest first) | 404 | — |
| `getProfile` | `GET /profiles/{id}` | tailor (own), admin | — | `MeasurementProfile` | 403, 404 | **`profile_view`** |
| `listConflicts` | `GET /conflicts` | tailor (own) | — | `ConflictPair[]` | — | — |
| `resolveConflict` | `POST /conflicts/{profile_id}/resolve` | tailor (own) | `{ keep: 'newer' \| 'server' }` | 204 | 404 | `override` (summary "conflict resolved: keep …") |

Query parameters for `GET /clients`:
- `search`: case-insensitive match on `client_code` prefix or `display_name` substring.
- `sort`: `last_capture` (default, newest first, never-captured last) · `code` · `name`.
- `filter`: `new` (has a profile the tailor has not opened yet) · `flags` (latest profile has any `check`/`fail`) · `none` (no profiles yet).

`ClientSummary`: `client_id, client_code, display_name | null, height_mm | null, created_at, last_capture_at | null, latest_profile_id | null, latest_sync_status | null, flags: { pass, check, fail } | null, open_orders, has_new`.

`ClientDetail` extends `ClientSummary` with `deep_link` (`https://<app-origin>/start?code=AB1234`), `profiles: ProfileSummary[]` and `orders: OrderSummary[]`, so the client page loads in one request.

`ProfileSummary`: `profile_id, version, captured_at, capture_mode, flags, sync_status, has_conflict`.

- `display_name` is the **only** name the system stores, typed by the tailor, optional. Never store a phone number, real name or ID number for a client.
- **Rotate code** [CONFIRM backend]: issues a new code; the old one returns `code_not_found` from then on.
- **Delete client**: blocked with `409 client_has_orders` while any order references one of the client's profiles. Otherwise hard-delete the client, its profiles, measurements and capture sessions.

**Conflicts (FR-11):** a `ConflictPair` holds the stored `server` profile and the posted `device` profile for the same client. `keep: 'newer'` (default in the UI) keeps the one with the higher `version` (last-write-wins by version) and discards the other; `keep: 'server'` discards the device copy. Afterwards the remaining profile is `synced`.

### 2.5 Orders and sheets (tailor)

| `ApiClient` | Method & path | Role | Request | Response | Errors | Audit |
|---|---|---|---|---|---|---|
| `listOrders` | `GET /orders?status=&sort=&page=&page_size=` | tailor (own) | — | `Page<OrderSummary> & { counts: Record<OrderStatus, number> }` | — | — |
| `createOrder` | `POST /orders` | tailor | `OrderCreateInput` | 201 `Order` | 422 `validation_failed` / `due_date_past` / `ease_out_of_range` | `override` per overridden item |
| `getOrder` | `GET /orders/{id}` | tailor (own) | — | `Order` | 404 | — |
| `updateOrder` | `PATCH /orders/{id}` | tailor (own) | `OrderPatch` | `Order` | 422 | `status_change` on status change; `override` on body value changes |
| `deleteOrder` | `DELETE /orders/{id}` | tailor (own) | — | 204 | 409 `validation_failed` if status is not `new` | `deletion` |
| `generateSheet` | `POST /orders/{id}/sheets` | tailor (own) | `{ include_name: boolean }` | 201 `SheetResponse { sheet_id, png_url, pdf_url, share_text, generated_at }` | 404 | `export` |
| `logShare` | `POST /sheets/{id}/shares` | tailor (own) | `{ via: 'whatsapp_share' \| 'wa_link' \| 'download' \| 'print' }` | 204 | 404 | `share` |

`GET /orders`:
- `status` may repeat (`?status=new&status=cutting`). With no `status`, return every status **except** `collected`.
- `sort`: `due` (default, ascending) · `created` (newest first).
- `counts` gives the number of orders in each of the five statuses, ignoring the `status` filter, for the status chips.

`OrderSummary`: `order_id, order_no, client_id, client_code, display_name?, profile_id, profile_version, garment_type, status, due_date, created_at, flagged_sites, has_conflict`. `flagged_sites` counts items whose `confidence_flag` is `check` or `fail`. `has_conflict` is true when the client has an unresolved conflict newer than the order's profile.

`OrderCreateInput { client_id, profile_id, garment_type, due_date, notes, items: OrderItemInput[] }`:
- `garment_type ∈ shirt, dress, trousers, suit_jacket, skirt, other`.
- `due_date`: today (Nairobi) to today + 180 days; past → `422 due_date_past`.
- `notes`: ≤ 1,000 characters.
- `OrderItemInput { site_code, body_mm | null, ease_mm, overridden, override_reason?, flag_confirmed?, pending_fitting? }`.
  - `ease_mm`: integer 0–300 (UI: 0–30 cm, one decimal) else `422 ease_out_of_range`.
  - `overridden: true` means `body_mm` differs from the profile value; record `override_reason`, the user and the time. Audit `override`.
  - Every item whose profile flag is `check` or `fail` must have `flag_confirmed: true`, `overridden: true` or `pending_fitting: true`, else `422 validation_failed` (`code: 'flag_unconfirmed'`).
  - `pending_fitting: true` (body value to be taken at the fitting) allows `body_mm: null` [CONFIRM backend support].
- The server computes `finished_mm = body_mm + ease_mm` (null if `body_mm` is null), copies `confidence_flag` from the profile measurement, assigns `order_no`, sets `status: 'new'` and starts `status_history`.

`OrderPatch`: any of `status`, `due_date`, `notes`, `items` (full replacement). Status may move backwards (the UI confirms). Item edits after status `new` are allowed and audited. Each status change appends `{ status, at }` to `status_history`.

`DELETE /orders/{id}` is allowed only while `status = 'new'` [CONFIRM].

#### Specification sheet rendering (FR-18, Figure 5.6)

The **server renders** the sheet; the UI only previews, downloads and shares it.

- Two files per generation: `png_url` (for WhatsApp, A4 portrait at about 1240 × 1754 px, ≤ 400 KB) and `pdf_url` (A4 for printing). URLs must be fetchable by the authenticated tailor (signed short-lived URL or same-origin with the bearer token). The UI fetches the PNG as a `File` for Web Share.
- Layout of Figure 5.6: business name; client code (and display name only if `include_name`); garment; due date; profile version and capture date; a table of the order's sites (tailor term + ISO 8559-1 term, body, ease, finished, flag as **icon + word**); notes; a **QR code of `profile_id`**; footer **"No photograph is stored. Data Protection Act, 2019."**
- Units follow the tailor's `unit_pref` (cm to 0.1, or inches to the nearest 1/8).
- `include_name` defaults to **off** in the UI. When on, the name appears on the sheet and in `share_text`, and the audit `export` entry records it.
- `share_text` template (the mock builds it the same way; see `src/lib/sheets/shareText.ts`):

```
Virtual Tailor · Client AB1234[ · Amina] · Profile v2 (12 May 2027) · Shirt · Due 26 May 2027
Chest 98.5 cm ✓
Waist 86.0 cm ▲ check
Inside leg — not measured
No photo is stored.
```

One line per order item, in the order of the items. There is no link to the profile. The language of the labels follows the tailor's `locale`.

### 2.6 Audit

| `ApiClient` | Method & path | Role | Response |
|---|---|---|---|
| `listAudit` | `GET /audit?user=&role=&action=&entity_type=&from=&to=&page=&page_size=` | tailor (own entries only; `user`/`role` ignored), admin (all) | `Page<AuditEntry>`, newest first |
| `exportAuditCsv` | `GET /admin/audit.csv?…` (same filters) | admin | `text/csv`; audit `export` |

`AuditEntry { log_id, occurred_at, user_email, role, action, entity_type, entity_id, summary }`. `action ∈ login, profile_view, export, share, override, deletion, status_change, code_issue, approve, settings_change`. `entity_type` examples: `order`, `profile`, `client`, `sheet`, `account`, `settings`, `participant`. `summary` is a short human-readable line such as `Order ORD-0231 → cutting`; it must not contain measurements or names.

The audit log is **append-only** (NFR-11): no update or delete endpoint, and the database role used by the API should not have UPDATE/DELETE on the table.

### 2.7 Administrator

| `ApiClient` | Method & path | Role | Request | Response | Audit |
|---|---|---|---|---|---|
| `listAccounts` | `GET /admin/accounts?status=` | admin | — | `Account[]` | — |
| `approveAccount` | `POST /admin/accounts/{id}/approve` | admin | — | `Account` | `approve` |
| `rejectAccount` | `POST /admin/accounts/{id}/reject` | admin | `{ reason }` | `Account` (status `rejected`, `reject_reason`) | `approve` (summary "rejected") |
| `disableAccount` | `POST /admin/accounts/{id}/disable` | admin | — | `Account` | `settings_change` |
| `enableAccount` | `POST /admin/accounts/{id}/enable` | admin | — | `Account` | `settings_change` |
| `createMeasurer` | `POST /admin/measurers` | admin | `MeasurerInput { email, password, measurer_code, trained_on }` | 201 `Account` (role `measurer`, status `active`) | `settings_change` |
| `getAdminSettings` | `GET /admin/settings` | admin | — | `AdminSettings { retention_months, study_mode }` | — |
| `putAdminSettings` | `PUT /admin/settings` | admin | `AdminSettings` | `AdminSettings` | `settings_change` |
| `listDeletionRequests` | `GET /admin/deletion-requests` | admin | — | `DeletionRequest[]` | — |

- `Account { user_id, email, role, status, business_name?, phone?, area?, registered_at, measurer_code?, trained_on?, reject_reason? }`.
- `retention_months`: default 24 months after the client's last order [CONFIRM]; range 1–120. The server runs the retention job.
- Disabling an account revokes its tokens; subsequent calls return `403 account_disabled`.
- `measurer_code` is a short letter (`A`, `B`, …), unique; duplicate → `422` (`measurer_code_taken`).
- `DeletionRequest { request_id, client_code, profile_ids, reason, received_at, status: received | completed | rejected, completed_at? }`.

### 2.8 Study (validation study, study mode on)

All endpoints here return `404 study_mode_off` when study mode is off.

| `ApiClient` | Method & path | Role | Request | Response | Errors | Audit |
|---|---|---|---|---|---|---|
| `listParticipants` | `GET /study/participants` | admin | — | `Participant[]` | — | — |
| `enrolParticipant` | `POST /study/participants` | admin | `ParticipantInput { participant_code, sex, age_band, venue }` | 201 `{ participant_id, client_code }` | 422 (`participant_exists`, `pattern`) | `code_issue` |
| `submitReferenceReading` | `POST /study/reference-readings` | measurer | `ReferenceReadingInput { participant_code, reading_no: 1 \| 2, values: { site_code: mm }, taken_at }` | 201 `ReferenceReadingResult` | 409 `reading_locked`, 422 (`participant_unknown`) | — |
| `exportStudyCsv('captures')` | `GET /study/export/captures.csv` | admin | — | `text/csv` | — | `export` |
| `exportStudyCsv('reference')` | `GET /study/export/reference.csv` | admin | — | `text/csv` | — | `export` |

- **Enrolment** creates a linked client code automatically (owned by the admin account). Never store name, phone, weight or the paper key list (Regulation 33). `sex ∈ female, male`; `age_band ∈ 18-24, 25-34, 35-44, 45-54, 55+`.
- `Participant` adds `participant_id, client_code, enrolled_at`, **`sets_captured`** (0–3 profiles with a `session.study` block) and **`readings`** (per site, how many readings exist, 0–4 = 2 measurers × 2 readings).
- **Blinding (FR-23):** a measurer must **never** receive system measurement values or another measurer's readings from any endpoint. `GET /profiles/{id}` and every client/profile/participant list is `403 forbidden` for role `measurer`.
- **Reference readings** are identified by (participant, measurer from the token, `reading_no`). They are locked once saved: a second submission returns `409 reading_locked`. Corrections only by an admin, outside this API, with audit.
- Values are integer mm (the UI collects 0.1 cm). Nine sites: `stature, shoulder, chest, waist, hip, sleeve, outleg, inleg, neck`.
- `ReferenceReadingResult { reading_id, participant_code, reading_no, measurer_code, locked: true, out_of_order }`. `out_of_order` is true when reading 2 is saved before reading 1 by that measurer (accepted and flagged).
- **Study captures** are ordinary `POST /profiles` calls whose `session.study` block is present (correction C6) and whose `consent.consent_version` is `"study-paper-1.0"` with scope `["study_paper"]`.

**`captures.csv` columns** (one row per capture set, Appendix E): `participant_code, set_no, captured_at, front_level, front_frame, front_marker, front_symmetry, front_arms, front_light, side_level, side_frame, side_marker, side_symmetry, side_arms, side_light, scale_front_mm_px, scale_side_mm_px, scale_stature_mm_px, scale_disagreement_pct, stature_cm, stature_flag, shoulder_cm, shoulder_flag, chest_cm, chest_flag, waist_cm, waist_flag, hip_cm, hip_flag, sleeve_cm, sleeve_flag, outleg_cm, outleg_flag, inleg_cm, inleg_flag, neck_cm, neck_flag, processing_s, retake_count, capture_mode, lighting, distance_m, clothing_fit_observed, device_model, os, browser, model_variant, rules_version, lux`.

**`reference.csv` columns:** `participant_code, site_code, measurer_code, reading_no, value_cm, taken_at` (value to 0.1 cm).

---

## 3. Type reference

The full shapes are in `src/lib/api/types.ts` and mirrored in `openapi.yaml#/components/schemas`. Key enums:

| Type | Values |
|---|---|
| `SiteCode` | `stature, shoulder, chest, waist, hip, sleeve, outleg, inleg, neck` |
| `Flag` | `pass, check, fail` |
| `FlagReason` | `scale_disagree, level_unchecked, loose_clothing, landmark_low, mask_gap, out_of_range, crotch_not_found, marker_weak, waist_level_mismatch, view_failed` |
| `CheckState` | `pass, fail, skipped` |
| `SyncStatus` | `pending, synced, conflict, rejected` |
| `GarmentType` | `shirt, dress, trousers, suit_jacket, skirt, other` |
| `OrderStatus` | `new, cutting, fitting, ready, collected` |
| `Role` | `tailor, admin, measurer` |
| `AccountStatus` | `pending, active, disabled, rejected` |
| `ShareVia` | `whatsapp_share, wa_link, download, print` |

---

## 4. Database changes relative to Chapter 5

The front end depends on these. Please add them to the DDL.

| Table | Change | Why |
|---|---|---|
| `measurement` | `value_mm` **nullable** | C4: a failed site has `value_mm = null`, `confidence_flag = 'fail'` |
| `measurement` | `flag_reasons text[]` (or a join table) | Machine-readable reasons (FR-08) |
| `measurement` | optional `correction_factor`, `level_fraction`, `half_width_mm`, `half_depth_mm` | Provenance for calibration (NFR-13) |
| `measurement_profile` | `rules_version`, `version`, `status`, `sync_status`, `code_verified`, `height_mm_entered`, `sex`, `clothing_fit`, landmark and marker JSON (`landmarks_front/side`, `marker_front/side`) | Provenance; payload fields |
| `measurement_profile` | consent columns or a `consent_record` table: `consent_version`, `language`, `scope[]`, `given_at`, `withdrawn_at` | FR-03, withdrawal |
| `capture_session` | `config_hash`, `still_source`, `stream_w`, `stream_h`, `level_unchecked`, `capture_fallback`, `memory_gb`, `model_variant`, `processing_ms`, `retake_count`, front/side check states, scales and `scale_disagreement_pct` | Payload fields |
| `capture_session` | Study columns: `participant_code`, `set_no`, `lighting`, `distance_m`, `clothing_fit_observed`, `lux` (all nullable) | C6, Appendix E |
| `order_item` | `override_reason`, `flag_confirmed`, `pending_fitting`; `body_mm` nullable when `pending_fitting` | FR-16 |
| `order` | `order_no` (unique, human-readable) | Order queue, share text |
| `order_status_history` | new table: `order_id`, `status`, `at`, `user_id` | Status stepper, audit |
| `user_account` | `unit_pref` (`cm`/`in`, default `cm`), `include_name_default` (bool, default false), `ease_presets` (JSONB), `locale`, `measurer_code`, `trained_on`, `reject_reason`; status adds `rejected` | Settings, admin |
| `client` | `display_name` nullable, `height_mm` nullable, `last_opened_profile_at` (for the "has new" filter) | FR-14, FR-15 |
| `profile_conflict` | new table (or `measurement_profile.conflict_of`) holding the device copy until resolved | FR-11 |
| `sheet` + `sheet_share` | new tables: `sheet_id`, `order_id`, `include_name`, `generated_at`; shares with `via`, `at` | FR-18, FR-19 audit |
| `deletion_request` | new table: `request_id`, `client_code`, `profile_ids uuid[]`, `reason`, `received_at`, `status`, `completed_at` | Decision 3 |
| `participant` | new table: `participant_id`, `participant_code` unique, `sex`, `age_band`, `venue`, `client_id`, `enrolled_at` | Section 15.3 |
| `reference_reading` | new table: `reading_id`, `participant_id`, `measurer_id`, `reading_no`, `site_code`, `value_mm`, `taken_at`, `locked`, `out_of_order`; unique (`participant_id`, `measurer_id`, `reading_no`, `site_code`) | FR-23 |
| `app_settings` | `retention_months`, `study_mode` | Section 14 |

---

## 5. Mock backend (front-end development)

- MSW 2 handlers in `mocks/handlers.ts`, deterministic seed in `mocks/seed.ts`. They implement every endpoint above with 150–600 ms latency.
- Any request accepts `?__fail=<status>` to force an error response; the `/dev/mock` panel can force failures per endpoint without editing URLs.
- Seed accounts (password `vt-demo-2026` for all): `admin@vt.test` (admin), `wanjiru@vt.test` (tailor, Mama Wanjiru Tailors, Gikomba), `otieno@vt.test` (tailor, Otieno Bespoke, CBD), `pending@vt.test` (tailor, pending), `disabled@vt.test` (tailor, disabled), `measurer-a@vt.test` and `measurer-b@vt.test` (measurers A and B).
- The mock's sheet `png_url` / `pdf_url` return a simplified stand-in of the Figure 5.6 layout (an SVG rasterised to PNG in the browser, and a text-only PDF), not the real server rendering.

---

## 6. Integration checklist for the backend engineer

1. Implement every endpoint in Section 2 at `/api/v1`, matching `openapi.yaml`.
2. Return RFC 9457 problem+json with the `code` values in 1.1; include `server_version` on `profile_version_conflict`, `errors[]` on 422, `Retry-After` on 429.
3. Auth: JWT bearer, 24 h expiry, `401 token_expired` on expiry; tell the front end if you prefer the httpOnly cookie transport (Section 1.2).
4. Same origin under `/api/v1` (default). If the API is on another origin, enable CORS for the app origin only, allow `Authorization`, `Content-Type`, `Idempotency-Key`, and expose `Retry-After`.
5. Rate-limit the four client-app endpoints and login (Section 1.4).
6. Honour `Idempotency-Key` on `POST /profiles`; store conflicting profiles for tailor resolution.
7. Reject image data and oversized bodies on `POST /profiles` (privacy, NFR-10).
8. Enforce ownership (tailor sees only own data) and measurer blinding on the server.
9. Render specification sheets (PNG + PDF, Figure 5.6 layout, QR of `profile_id`, footer "No photograph is stored. Data Protection Act, 2019.", name only when `include_name`), and build `share_text` exactly as in 2.5.
10. Write audit events: `login`; `profile_view` on every `GET /profiles/{id}`; `code_issue` (issue, rotate, participant enrolment); `override` (order item overrides, conflict resolution); `status_change`; `export` (sheet generation, CSV exports); `share` (`POST /sheets/{id}/shares`); `deletion` (client, order, client deletion requests); `approve` (approve and reject); `settings_change` (`PATCH /me`, password, admin settings, account disable/enable, measurer creation). Keep the log append-only.
11. Apply the DB changes in Section 4.
12. Run the retention job using `retention_months`; process deletion requests and update their status.
13. Serve `GET /settings/public` with `study_mode` and `consent_version`.
14. Generate the two study CSV exports with the columns in 2.8.
15. Swap test: run the front end with `VITE_API_MODE=http` and `VITE_API_BASE_URL` pointing at your server; the Playwright suite should pass unchanged.

---

## 7. Deployment headers (for the deployer)

`npm run build` writes **`build/_headers`** (Netlify / Cloudflare Pages format; copy the values for nginx, Caddy or others) and `build/security-headers.json`. Use those files: the CSP contains the SHA-256 of SvelteKit's one inline bootstrap script, which changes with each build.

```
/*
  Content-Security-Policy: default-src 'self'; worker-src 'self' blob:; connect-src 'self' <api-origin>; img-src 'self' blob: data:; media-src 'self' blob:; object-src 'none'; script-src 'self' 'wasm-unsafe-eval' 'sha256-<from the build>'; style-src 'self' 'unsafe-inline'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
  Strict-Transport-Security: max-age=63072000; includeSubDomains
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(self), microphone=(), geolocation=(), payment=()

/workers/marker.worker.js
  Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval'; connect-src 'self'

/service-worker.js
  Cache-Control: no-cache

/_app/immutable/*
  Cache-Control: public, max-age=31536000, immutable
```

- `<api-origin>` is added to `connect-src` automatically when `VITE_API_BASE_URL` is an absolute URL at build time; same-origin `/api/v1` needs nothing.
- **Marker worker exception (open decision):** the stock OpenCV.js build evaluates generated code at start-up, so only the marker worker's script gets `'unsafe-eval'` (a worker's policy comes from its own response). The pages keep the strict policy. The rule must **replace**, not add to, the `/*` policy for that path; on hosts that merge headers, configure it so the worker response carries only this policy. A custom OpenCV.js built with `-s DYNAMIC_EXECUTION=0` removes the need (see `docs/opencv-build.md`).
- Serve the SPA fallback (`index.html`) for unknown paths (app routes), and real 404s for missing files with an extension.
- Compress text, JavaScript and **`.wasm`** responses (gzip or Brotli): the vision assets are 29.5 MB raw but about 12.3 MB compressed.
- HTTPS only (the camera and service worker need a secure context).
- COOP/COEP are **not** needed: WebAssembly runs single-threaded SIMD (Section 2.2). Add them only if threads are enabled later.
- `node scripts/serve-build.mjs [port]` serves `build/` exactly like this, for local checks and the production tests.
