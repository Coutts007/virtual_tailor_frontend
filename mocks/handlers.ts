/**
 * MSW mock of every endpoint in Section 20.2, backed by the deterministic seed.
 * Behaviour mirrors docs/api-contract.md: roles, problem+json errors, audit
 * side effects, pagination. Not a security boundary; a stand-in for the server.
 */
import { http, HttpResponse, delay, type HttpResponseResolver } from 'msw';
import { createSeed, uid, DEMO_PASSWORD, type MockUser, type Seed, type MockClient } from './seed';
import { readControl } from './control';
import { sheetPdf, sheetPng, sheetSvg, type SheetModel } from './sheetRender';
import type {
	Account,
	AuditAction,
	AuditEntry,
	ClientDetail,
	ClientSummary,
	FlagSummary,
	GarmentType,
	MeasurementProfile,
	MeasurementProfilePayload,
	Order,
	OrderCreateInput,
	OrderItem,
	OrderPatch,
	OrderStatus,
	OrderSummary,
	ProfileSummary,
	Role,
	SiteCode
} from '../src/lib/api/types';
import type { ProblemCode } from '../src/lib/api/errors';
import { summariseFlags, GARMENT_SITES, REFERENCE_ORDER, SITES } from '../src/lib/domain/sites';
import { buildShareText } from '../src/lib/domain/shareText';
import {
	CLIENT_CODE_RE,
	PARTICIPANT_CODE_RE,
	normaliseKenyanPhone,
	validateDueDate,
	validateEmail,
	validatePassword,
	EASE_MAX_CM
} from '../src/lib/domain/validate';

export const API = '*/api/v1';
const TOKEN_TTL_MS = 24 * 3600_000;

/* ---------------- state, latency, failures ---------------- */

let latency = { min: 150, max: 600 };
export function setLatency(min: number, max: number) {
	latency = { min, max };
}

let db: Seed = createSeed();
export function resetMockDb(now?: number) {
	db = createSeed(now);
}
export function mockDb(): Seed {
	return db;
}

function problem(
	status: number,
	code: ProblemCode,
	extra: Record<string, unknown> = {},
	headers: Record<string, string> = {}
) {
	return HttpResponse.json(
		{
			type: `https://vt.example/problems/${code}`,
			title: code.replace(/_/g, ' '),
			status,
			code,
			...extra
		},
		{ status, headers: { 'Content-Type': 'application/problem+json', ...headers } }
	);
}

/** Wraps a resolver with latency, `?__fail=` and dev-panel failures. */
function route(key: string, resolver: HttpResponseResolver): HttpResponseResolver {
	return async (info) => {
		const control = readControl();
		if (control.latency && latency.max > 0) {
			await delay(latency.min + Math.random() * (latency.max - latency.min));
		}
		const q = new URL(info.request.url).searchParams.get('__fail');
		const forced = q ? Number(q) : control.failures[key];
		if (forced) {
			const code: ProblemCode =
				forced === 401
					? 'token_expired'
					: forced === 403
						? 'forbidden'
						: forced === 404
							? key.includes('client-codes') || key === 'POST /profiles'
								? 'code_not_found'
								: 'not_found'
							: forced === 409
								? key === 'POST /profiles'
									? 'profile_version_conflict'
									: key.includes('reference')
										? 'reading_locked'
										: 'client_has_orders'
								: forced === 422
									? 'validation_failed'
									: forced === 429
										? 'rate_limited'
										: 'unknown';
			return problem(
				forced,
				code,
				forced === 409 ? { server_version: 3 } : {},
				forced === 429 ? { 'Retry-After': '30' } : {}
			);
		}
		return resolver(info);
	};
}

/* ---------------- auth helpers ---------------- */

function currentUser(request: Request): MockUser | null {
	const h = request.headers.get('Authorization');
	const token = h?.startsWith('Bearer ') ? h.slice(7) : null;
	if (!token) return null;
	const t = db.tokens.get(token);
	if (!t || t.expires_at <= Date.now()) return null;
	return db.users.find((u) => u.user_id === t.user_id) ?? null;
}

type Authed = { user: MockUser } | { error: Response };
function requireRole(request: Request, roles: Role[]): Authed {
	const h = request.headers.get('Authorization');
	const user = currentUser(request);
	if (!user) return { error: problem(401, h ? 'token_expired' : 'forbidden') };
	if (user.status !== 'active')
		return {
			error: problem(403, user.status === 'pending' ? 'account_pending' : 'account_disabled')
		};
	if (!roles.includes(user.role)) return { error: problem(403, 'forbidden') };
	return { user };
}

function log(
	user: MockUser,
	action: AuditAction,
	entity_type: string,
	entity_id: string,
	summary: string
) {
	const entry: AuditEntry = {
		log_id: uid(`audit-${db.audit.length}-${Date.now()}`),
		occurred_at: new Date().toISOString(),
		user_email: user.email,
		role: user.role,
		action,
		entity_type,
		entity_id,
		summary
	};
	db.audit.unshift(entry);
}

function page<T>(items: T[], url: URL) {
	const p = Math.max(1, Number(url.searchParams.get('page') ?? 1));
	const size = Math.min(100, Math.max(1, Number(url.searchParams.get('page_size') ?? 25)));
	return {
		items: items.slice((p - 1) * size, p * size),
		page: p,
		page_size: size,
		total: items.length
	};
}

async function json<T>(request: Request): Promise<T | null> {
	try {
		return (await request.json()) as T;
	} catch {
		return null;
	}
}

/* ---------------- projections ---------------- */

const ownClients = (u: MockUser) =>
	db.clients.filter((c) => u.role === 'admin' || c.tailor_id === u.user_id);
const profilesOf = (c: MockClient) =>
	db.profiles
		.filter((p) => p.client_id === c.client_id)
		.sort((a, b) => b.captured_at.localeCompare(a.captured_at));
const ordersOf = (c: MockClient) => db.orders.filter((o) => o.client_id === c.client_id);
const flagsOf = (p: MeasurementProfile): FlagSummary => summariseFlags(p.measurements);

function deepLink(request: Request, code: string) {
	return `${new URL(request.url).origin}/start?code=${code}`;
}

function profileSummary(p: MeasurementProfile): ProfileSummary {
	return {
		profile_id: p.profile_id,
		version: p.version,
		captured_at: p.captured_at,
		capture_mode: p.session.capture_mode,
		flags: flagsOf(p),
		sync_status: p.sync_status,
		has_conflict: db.conflicts.has(p.profile_id)
	};
}

function clientSummary(c: MockClient): ClientSummary {
	const latest = profilesOf(c)[0];
	const open = ordersOf(c).filter((o) => o.status !== 'collected').length;
	return {
		client_id: c.client_id,
		client_code: c.client_code,
		display_name: c.display_name,
		height_mm: c.height_mm,
		created_at: c.created_at,
		last_capture_at: latest?.captured_at ?? null,
		latest_profile_id: latest?.profile_id ?? null,
		latest_sync_status: latest?.sync_status ?? null,
		flags: latest ? flagsOf(latest) : null,
		open_orders: open,
		has_new: !!latest && !db.orders.some((o) => o.profile_id === latest.profile_id)
	};
}

function orderSummary(o: Order): OrderSummary {
	return {
		order_id: o.order_id,
		order_no: o.order_no,
		client_id: o.client_id,
		client_code: o.client_code,
		display_name: o.display_name,
		profile_id: o.profile_id,
		profile_version: o.profile_version,
		garment_type: o.garment_type,
		status: o.status,
		due_date: o.due_date,
		created_at: o.created_at,
		flagged_sites: o.items.filter((i) => i.confidence_flag !== 'pass').length,
		has_conflict: db.conflicts.has(o.profile_id)
	};
}

const GARMENT_EN: Record<GarmentType, string> = {
	shirt: 'Shirt',
	dress: 'Dress',
	trousers: 'Trousers',
	suit_jacket: 'Suit jacket',
	skirt: 'Skirt',
	other: 'Other'
};
const SITE_EN: Record<SiteCode, string> = {
	stature: 'Height',
	shoulder: 'Shoulder',
	chest: 'Chest',
	waist: 'Waist',
	hip: 'Hip',
	sleeve: 'Sleeve',
	outleg: 'Outside leg',
	inleg: 'Inside leg',
	neck: 'Neck'
};

function validateItems(items: OrderCreateInput['items'], profile: MeasurementProfile) {
	const errors: { field: string; code: string }[] = [];
	items.forEach((it, i) => {
		if (!Number.isInteger(it.ease_mm) || it.ease_mm < 0 || it.ease_mm > EASE_MAX_CM * 10)
			errors.push({ field: `items[${i}].ease_mm`, code: 'ease_out_of_range' });
		const m = profile.measurements.find((x) => x.site_code === it.site_code);
		if (
			m &&
			m.confidence_flag !== 'pass' &&
			!it.overridden &&
			!it.flag_confirmed &&
			!it.pending_fitting
		)
			errors.push({ field: `items[${i}]`, code: 'flag_unconfirmed' });
		if (it.body_mm == null && !it.pending_fitting)
			errors.push({ field: `items[${i}].body_mm`, code: 'value_required' });
	});
	return errors;
}

function toItems(items: OrderCreateInput['items'], profile: MeasurementProfile): OrderItem[] {
	return items.map((it) => {
		const m = profile.measurements.find((x) => x.site_code === it.site_code);
		return {
			...it,
			finished_mm: it.body_mm == null ? null : it.body_mm + it.ease_mm,
			confidence_flag: m?.confidence_flag ?? 'pass'
		};
	});
}

function csv(rows: (string | number | null | undefined)[][]): string {
	return (
		rows
			.map((r) =>
				r
					.map((v) =>
						v == null
							? ''
							: /[",\n]/.test(String(v))
								? `"${String(v).replace(/"/g, '""')}"`
								: String(v)
					)
					.join(',')
			)
			.join('\n') + '\n'
	);
}

function sheetModel(sheetId: string): SheetModel | null {
	const s = db.sheets.find((x) => x.sheet_id === sheetId);
	if (!s) return null;
	const [title, ...lines] = s.share_text.split('\n');
	const o = db.orders.find((x) => x.order_id === s.order_id)!;
	return {
		title: title!,
		lines: lines.slice(0, -1),
		footer: 'No photograph is stored. Data Protection Act, 2019.',
		qrLabel: o.profile_id
	};
}

/* ---------------- handlers ---------------- */

export const handlers = [
	// Public
	http.get(
		`${API}/settings/public`,
		route('GET /settings/public', () => {
			const { study_mode, consent_version, min_app_version } = db.settings;
			return HttpResponse.json({ study_mode, consent_version, min_app_version });
		})
	),

	// Client app
	http.get(
		`${API}/client-codes/:code`,
		route('GET /client-codes/:code', ({ params }) => {
			const code = String(params.code).toUpperCase();
			const c = db.clients.find((x) => x.client_code === code);
			if (!c || !CLIENT_CODE_RE.test(code)) return problem(404, 'code_not_found');
			const tailor = db.users.find((u) => u.user_id === c.tailor_id)!;
			return HttpResponse.json({
				valid: true,
				tailor_business_name: tailor.business_name ?? 'Virtual Tailor study',
				height_mm: c.height_mm
			});
		})
	),

	http.post(
		`${API}/profiles`,
		route('POST /profiles', async ({ request }) => {
			const body = await json<MeasurementProfilePayload>(request);
			const raw = body ? JSON.stringify(body) : '';
			if (raw.length > 200_000)
				return problem(413, 'validation_failed', {
					errors: [{ field: 'body', code: 'too_large' }]
				});
			if (!body || raw.includes('data:image'))
				return problem(422, 'validation_failed', { errors: [{ field: 'body', code: 'invalid' }] });
			if (request.headers.get('Idempotency-Key') !== body.profile_id)
				return problem(422, 'validation_failed', {
					errors: [{ field: 'Idempotency-Key', code: 'mismatch' }]
				});
			if (
				!Array.isArray(body.measurements) ||
				body.measurements.length !== 9 ||
				body.landmarks_front?.length !== 33
			)
				return problem(422, 'validation_failed', {
					errors: [{ field: 'measurements', code: 'invalid' }]
				});
			const c = db.clients.find((x) => x.client_code === body.client_code);
			if (!c) return problem(404, 'code_not_found');
			const existing = db.profiles.find((p) => p.profile_id === body.profile_id);
			if (existing && existing.version === body.version) {
				return HttpResponse.json(
					{ profile_id: existing.profile_id, version: existing.version },
					{ status: 201 }
				);
			}
			const serverMax = Math.max(0, ...profilesOf(c).map((p) => p.version));
			if (existing || body.version <= serverMax) {
				const stored: MeasurementProfile = {
					...body,
					client_id: c.client_id,
					sync_status: 'conflict'
				};
				db.conflicts.set(body.profile_id, stored);
				const serverCopy = existing ?? profilesOf(c)[0]!;
				if (!existing) db.conflicts.set(serverCopy.profile_id, stored);
				serverCopy.sync_status = 'conflict';
				return problem(409, 'profile_version_conflict', { server_version: serverMax });
			}
			db.profiles.push({
				...body,
				client_id: c.client_id,
				sync_status: 'synced',
				created_at: new Date().toISOString()
			});
			return HttpResponse.json(
				{ profile_id: body.profile_id, version: body.version },
				{ status: 201 }
			);
		})
	),

	http.post(
		`${API}/deletion-requests`,
		route('POST /deletion-requests', async ({ request }) => {
			const body = await json<{
				client_code: string;
				profile_ids: string[];
				reason: 'delete' | 'withdraw_consent';
			}>(request);
			if (!body || !CLIENT_CODE_RE.test(body.client_code) || !Array.isArray(body.profile_ids))
				return problem(422, 'validation_failed');
			const request_id = uid(`del-${Date.now()}-${Math.random()}`);
			db.deletionRequests.unshift({
				request_id,
				client_code: body.client_code,
				profile_ids: body.profile_ids,
				reason: body.reason,
				received_at: new Date().toISOString(),
				status: 'received'
			});
			return HttpResponse.json({ request_id }, { status: 202 });
		})
	),

	// Auth
	http.post(
		`${API}/auth/register`,
		route('POST /auth/register', async ({ request }) => {
			const b = await json<{
				email: string;
				password: string;
				business_name: string;
				phone: string;
				area: string;
				locale: 'en' | 'sw';
			}>(request);
			const errors: { field: string; code: string }[] = [];
			if (!b) return problem(422, 'validation_failed');
			if (validateEmail(b.email)) errors.push({ field: 'email', code: 'invalid' });
			const pw = validatePassword(b.password ?? '');
			if (pw)
				errors.push({
					field: 'password',
					code: pw === 'validate.passwordShort' ? 'too_short' : 'too_common'
				});
			if (!b.business_name?.trim()) errors.push({ field: 'business_name', code: 'required' });
			const phone = normaliseKenyanPhone(b.phone ?? '');
			if (!phone) errors.push({ field: 'phone', code: 'invalid' });
			if (errors.length) return problem(422, 'validation_failed', { errors });
			// No account enumeration: an existing email still answers "pending".
			if (!db.users.some((u) => u.email.toLowerCase() === b.email.toLowerCase())) {
				db.users.push({
					user_id: uid(`user-${b.email}`),
					email: b.email.toLowerCase(),
					role: 'tailor',
					status: 'pending',
					registered_at: new Date().toISOString(),
					password: b.password,
					locale: b.locale === 'sw' ? 'sw' : 'en',
					unit_pref: 'cm',
					include_name_default: false,
					ease_presets: {},
					business_name: b.business_name.trim(),
					phone: phone!,
					area: b.area?.trim()
				});
			}
			return HttpResponse.json({ status: 'pending' }, { status: 201 });
		})
	),

	http.post(
		`${API}/auth/login`,
		route('POST /auth/login', async ({ request }) => {
			const b = await json<{ email: string; password: string }>(request);
			const email = b?.email?.toLowerCase().trim() ?? '';
			const attempts = db.loginAttempts.get(email);
			if (attempts && attempts.until > Date.now()) {
				return problem(
					429,
					'rate_limited',
					{},
					{ 'Retry-After': String(Math.ceil((attempts.until - Date.now()) / 1000)) }
				);
			}
			const u = db.users.find((x) => x.email === email);
			if (!u || u.password !== b?.password) {
				const count = (attempts?.count ?? 0) + 1;
				db.loginAttempts.set(email, { count, until: count >= 5 ? Date.now() + 60_000 : 0 });
				return problem(401, 'invalid_credentials');
			}
			db.loginAttempts.delete(email);
			if (u.status === 'disabled' || u.status === 'rejected')
				return problem(403, 'account_disabled');
			const access_token = `mock.${u.user_id}.${Math.random().toString(36).slice(2)}`;
			const expires_at = Date.now() + TOKEN_TTL_MS;
			db.tokens.set(access_token, { user_id: u.user_id, expires_at });
			if (u.status === 'active') log(u, 'login', 'session', u.user_id, 'Signed in');
			return HttpResponse.json({
				access_token,
				expires_at: new Date(expires_at).toISOString(),
				user: {
					user_id: u.user_id,
					email: u.email,
					role: u.role,
					status: u.status,
					locale: u.locale,
					measurer_code: u.measurer_code
				}
			});
		})
	),

	http.post(
		`${API}/auth/logout`,
		route('POST /auth/logout', ({ request }) => {
			const h = request.headers.get('Authorization');
			if (h?.startsWith('Bearer ')) db.tokens.delete(h.slice(7));
			return new HttpResponse(null, { status: 204 });
		})
	),

	http.get(
		`${API}/me`,
		route('GET /me', ({ request }) => {
			const u = currentUser(request);
			if (!u) return problem(401, 'token_expired');
			const { password: _p, ...me } = u;
			return HttpResponse.json(me);
		})
	),

	http.patch(
		`${API}/me`,
		route('PATCH /me', async ({ request }) => {
			const u = currentUser(request);
			if (!u) return problem(401, 'token_expired');
			const b = (await json<Partial<MockUser>>(request)) ?? {};
			if (b.phone !== undefined) {
				const phone = normaliseKenyanPhone(b.phone ?? '');
				if (!phone)
					return problem(422, 'validation_failed', {
						errors: [{ field: 'phone', code: 'invalid' }]
					});
				b.phone = phone;
			}
			for (const k of [
				'business_name',
				'phone',
				'area',
				'locale',
				'unit_pref',
				'include_name_default',
				'ease_presets'
			] as const) {
				if (b[k] !== undefined) (u as unknown as Record<string, unknown>)[k] = b[k];
			}
			log(u, 'settings_change', 'account', u.user_id, 'Updated own settings');
			const { password: _p, ...me } = u;
			return HttpResponse.json(me);
		})
	),

	http.post(
		`${API}/me/password`,
		route('POST /me/password', async ({ request }) => {
			const u = currentUser(request);
			if (!u) return problem(401, 'token_expired');
			const b = await json<{ current_password: string; new_password: string }>(request);
			if (!b || b.current_password !== u.password) return problem(401, 'invalid_credentials');
			const pw = validatePassword(b.new_password ?? '');
			if (pw)
				return problem(422, 'validation_failed', {
					errors: [
						{
							field: 'new_password',
							code: pw === 'validate.passwordShort' ? 'too_short' : 'too_common'
						}
					]
				});
			u.password = b.new_password;
			log(u, 'settings_change', 'account', u.user_id, 'Changed password');
			return new HttpResponse(null, { status: 204 });
		})
	),

	// Clients
	http.get(
		`${API}/clients`,
		route('GET /clients', ({ request }) => {
			const a = requireRole(request, ['tailor', 'admin']);
			if ('error' in a) return a.error;
			const url = new URL(request.url);
			const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
			const sort = url.searchParams.get('sort') ?? 'last_capture';
			const filter = url.searchParams.get('filter');
			let list = ownClients(a.user).map(clientSummary);
			if (search)
				list = list.filter(
					(c) =>
						c.client_code.toLowerCase().includes(search) ||
						(c.display_name ?? '').toLowerCase().includes(search)
				);
			if (filter === 'new') list = list.filter((c) => c.has_new);
			if (filter === 'flags')
				list = list.filter((c) => !!c.flags && c.flags.check + c.flags.fail > 0);
			if (filter === 'none') list = list.filter((c) => !c.last_capture_at);
			list.sort((x, y) =>
				sort === 'code'
					? x.client_code.localeCompare(y.client_code)
					: sort === 'name'
						? (x.display_name ?? '￿').localeCompare(y.display_name ?? '￿')
						: (y.last_capture_at ?? '').localeCompare(x.last_capture_at ?? '')
			);
			return HttpResponse.json(page(list, url));
		})
	),

	http.post(
		`${API}/clients`,
		route('POST /clients', async ({ request }) => {
			const a = requireRole(request, ['tailor']);
			if ('error' in a) return a.error;
			const b = (await json<{ display_name?: string; height_mm?: number }>(request)) ?? {};
			if (b.height_mm != null && (b.height_mm < 1200 || b.height_mm > 2200))
				return problem(422, 'validation_failed', {
					errors: [{ field: 'height_mm', code: 'out_of_range' }]
				});
			const code = nextCode();
			const c: MockClient = {
				client_id: uid(`client-${code}-${Date.now()}`),
				tailor_id: a.user.user_id,
				client_code: code,
				display_name: b.display_name?.trim() || null,
				height_mm: b.height_mm ?? null,
				created_at: new Date().toISOString(),
				old_codes: []
			};
			db.clients.push(c);
			log(a.user, 'code_issue', 'client', c.client_id, `Code ${code}`);
			return HttpResponse.json(
				{ client_id: c.client_id, client_code: code, deep_link: deepLink(request, code) },
				{ status: 201 }
			);
		})
	),

	http.get(
		`${API}/clients/:id/profiles`,
		route('GET /clients/:id/profiles', ({ request, params }) => {
			const a = requireRole(request, ['tailor', 'admin']);
			if ('error' in a) return a.error;
			const c = ownClients(a.user).find((x) => x.client_id === params.id);
			if (!c) return problem(404, 'not_found');
			return HttpResponse.json(profilesOf(c).map(profileSummary));
		})
	),

	http.get(
		`${API}/clients/:id`,
		route('GET /clients/:id', ({ request, params }) => {
			const a = requireRole(request, ['tailor', 'admin']);
			if ('error' in a) return a.error;
			const c = ownClients(a.user).find((x) => x.client_id === params.id);
			if (!c) return problem(404, 'not_found');
			const detail: ClientDetail = {
				...clientSummary(c),
				deep_link: deepLink(request, c.client_code),
				profiles: profilesOf(c).map(profileSummary),
				orders: ordersOf(c).map(orderSummary)
			};
			return HttpResponse.json(detail);
		})
	),

	http.patch(
		`${API}/clients/:id`,
		route('PATCH /clients/:id', async ({ request, params }) => {
			const a = requireRole(request, ['tailor']);
			if ('error' in a) return a.error;
			const c = ownClients(a.user).find((x) => x.client_id === params.id);
			if (!c) return problem(404, 'not_found');
			const b =
				(await json<{ display_name?: string | null; height_mm?: number | null }>(request)) ?? {};
			if (b.display_name !== undefined) c.display_name = b.display_name?.trim() || null;
			if (b.height_mm !== undefined) {
				if (b.height_mm != null && (b.height_mm < 1200 || b.height_mm > 2200))
					return problem(422, 'validation_failed', {
						errors: [{ field: 'height_mm', code: 'out_of_range' }]
					});
				c.height_mm = b.height_mm;
			}
			return HttpResponse.json({
				...clientSummary(c),
				deep_link: deepLink(request, c.client_code),
				profiles: profilesOf(c).map(profileSummary),
				orders: ordersOf(c).map(orderSummary)
			});
		})
	),

	http.post(
		`${API}/clients/:id/rotate-code`,
		route('POST /clients/:id/rotate-code', ({ request, params }) => {
			const a = requireRole(request, ['tailor']);
			if ('error' in a) return a.error;
			const c = ownClients(a.user).find((x) => x.client_id === params.id);
			if (!c) return problem(404, 'not_found');
			c.old_codes.push(c.client_code);
			c.client_code = nextCode();
			for (const o of ordersOf(c)) o.client_code = c.client_code;
			log(a.user, 'code_issue', 'client', c.client_id, `Code rotated to ${c.client_code}`);
			return HttpResponse.json({ client_code: c.client_code });
		})
	),

	http.delete(
		`${API}/clients/:id`,
		route('DELETE /clients/:id', ({ request, params }) => {
			const a = requireRole(request, ['tailor', 'admin']);
			if ('error' in a) return a.error;
			const c = ownClients(a.user).find((x) => x.client_id === params.id);
			if (!c) return problem(404, 'not_found');
			if (ordersOf(c).some((o) => o.status !== 'collected'))
				return problem(409, 'client_has_orders');
			db.profiles = db.profiles.filter((p) => p.client_id !== c.client_id);
			db.orders = db.orders.filter((o) => o.client_id !== c.client_id);
			db.clients = db.clients.filter((x) => x !== c);
			log(a.user, 'deletion', 'client', c.client_id, `Deleted client ${c.client_code}`);
			return new HttpResponse(null, { status: 204 });
		})
	),

	// Profiles and conflicts
	http.get(
		`${API}/profiles/:id`,
		route('GET /profiles/:id', ({ request, params }) => {
			const a = requireRole(request, ['tailor', 'admin']);
			if ('error' in a) return a.error;
			const p = db.profiles.find((x) => x.profile_id === params.id);
			const c = p && ownClients(a.user).find((x) => x.client_id === p.client_id);
			if (!p || !c) return problem(404, 'not_found');
			log(
				a.user,
				'profile_view',
				'profile',
				p.profile_id,
				`Profile ${p.client_code} v${p.version}`
			);
			return HttpResponse.json(p);
		})
	),

	http.get(
		`${API}/conflicts`,
		route('GET /conflicts', ({ request }) => {
			const a = requireRole(request, ['tailor']);
			if ('error' in a) return a.error;
			const mine = new Set(ownClients(a.user).map((c) => c.client_id));
			const out = [];
			for (const [id, device] of db.conflicts) {
				const server = db.profiles.find((p) => p.profile_id === id);
				if (!server || !mine.has(server.client_id!)) continue;
				const c = db.clients.find((x) => x.client_id === server.client_id)!;
				out.push({
					profile_id: id,
					client_id: c.client_id,
					client_code: c.client_code,
					display_name: c.display_name ?? undefined,
					server,
					device
				});
			}
			return HttpResponse.json(out);
		})
	),

	http.post(
		`${API}/conflicts/:id/resolve`,
		route('POST /conflicts/:id/resolve', async ({ request, params }) => {
			const a = requireRole(request, ['tailor']);
			if ('error' in a) return a.error;
			const id = String(params.id);
			const device = db.conflicts.get(id);
			const idx = db.profiles.findIndex((p) => p.profile_id === id);
			if (!device || idx < 0) return problem(404, 'not_found');
			const b = await json<{ keep: 'newer' | 'server' }>(request);
			const server = db.profiles[idx]!;
			const keepDevice = b?.keep !== 'server' && device.version > server.version;
			db.profiles[idx] = keepDevice
				? { ...device, sync_status: 'synced' }
				: { ...server, sync_status: 'synced' };
			db.conflicts.delete(id);
			log(
				a.user,
				'settings_change',
				'profile',
				id,
				`Conflict resolved: kept ${keepDevice ? 'device' : 'server'} version`
			);
			return new HttpResponse(null, { status: 204 });
		})
	),

	// Orders
	http.get(
		`${API}/orders`,
		route('GET /orders', ({ request }) => {
			const a = requireRole(request, ['tailor']);
			if ('error' in a) return a.error;
			const url = new URL(request.url);
			const statuses = url.searchParams.getAll('status') as OrderStatus[];
			const sort = url.searchParams.get('sort') ?? 'due';
			const mine = new Set(ownClients(a.user).map((c) => c.client_id));
			const all = db.orders.filter((o) => mine.has(o.client_id));
			const counts: Record<string, number> = {
				new: 0,
				cutting: 0,
				fitting: 0,
				ready: 0,
				collected: 0
			};
			for (const o of all) counts[o.status]!++;
			const list = all
				.filter((o) => !statuses.length || statuses.includes(o.status))
				.sort((x, y) =>
					sort === 'created'
						? y.created_at.localeCompare(x.created_at)
						: x.due_date.localeCompare(y.due_date)
				)
				.map(orderSummary);
			return HttpResponse.json({ ...page(list, url), counts });
		})
	),

	http.post(
		`${API}/orders`,
		route('POST /orders', async ({ request }) => {
			const a = requireRole(request, ['tailor']);
			if ('error' in a) return a.error;
			const b = await json<OrderCreateInput>(request);
			if (!b) return problem(422, 'validation_failed');
			const c = ownClients(a.user).find((x) => x.client_id === b.client_id);
			const p = db.profiles.find(
				(x) => x.profile_id === b.profile_id && x.client_id === b.client_id
			);
			if (!c || !p) return problem(404, 'not_found');
			const due = validateDueDate(b.due_date);
			if (due === 'validate.duePast')
				return problem(422, 'due_date_past', {
					errors: [{ field: 'due_date', code: 'due_date_past' }]
				});
			if (due)
				return problem(422, 'validation_failed', {
					errors: [{ field: 'due_date', code: 'invalid' }]
				});
			if (!GARMENT_SITES[b.garment_type])
				return problem(422, 'validation_failed', {
					errors: [{ field: 'garment_type', code: 'invalid' }]
				});
			if ((b.notes ?? '').length > 1000)
				return problem(422, 'validation_failed', {
					errors: [{ field: 'notes', code: 'too_long' }]
				});
			const errors = validateItems(b.items ?? [], p);
			if (errors.some((e) => e.code === 'ease_out_of_range'))
				return problem(422, 'ease_out_of_range', { errors });
			if (errors.length) return problem(422, 'validation_failed', { errors });
			const now = new Date().toISOString();
			const o: Order = {
				order_id: uid(`order-${Date.now()}-${Math.random()}`),
				order_no: `ORD-${String(++db.seq.order).padStart(4, '0')}`,
				client_id: c.client_id,
				client_code: c.client_code,
				display_name: c.display_name ?? undefined,
				profile_id: p.profile_id,
				profile_version: p.version,
				garment_type: b.garment_type,
				status: 'new',
				due_date: b.due_date,
				notes: b.notes ?? '',
				items: toItems(b.items, p),
				created_at: now,
				updated_at: now,
				status_history: [{ status: 'new', at: now }]
			};
			db.orders.push(o);
			for (const it of o.items.filter((i) => i.overridden))
				log(
					a.user,
					'override',
					'order',
					o.order_id,
					`${o.order_no} ${SITE_EN[it.site_code]} overridden${it.override_reason ? `: ${it.override_reason}` : ''}`
				);
			return HttpResponse.json(o, { status: 201 });
		})
	),

	http.get(
		`${API}/orders/:id`,
		route('GET /orders/:id', ({ request, params }) => {
			const a = requireRole(request, ['tailor']);
			if ('error' in a) return a.error;
			const mine = new Set(ownClients(a.user).map((c) => c.client_id));
			const o = db.orders.find((x) => x.order_id === params.id && mine.has(x.client_id));
			return o ? HttpResponse.json(o) : problem(404, 'not_found');
		})
	),

	http.patch(
		`${API}/orders/:id`,
		route('PATCH /orders/:id', async ({ request, params }) => {
			const a = requireRole(request, ['tailor']);
			if ('error' in a) return a.error;
			const mine = new Set(ownClients(a.user).map((c) => c.client_id));
			const o = db.orders.find((x) => x.order_id === params.id && mine.has(x.client_id));
			if (!o) return problem(404, 'not_found');
			const b = (await json<OrderPatch>(request)) ?? {};
			if (b.due_date !== undefined) {
				const due = validateDueDate(b.due_date);
				if (due === 'validate.duePast') return problem(422, 'due_date_past');
				if (due)
					return problem(422, 'validation_failed', {
						errors: [{ field: 'due_date', code: 'invalid' }]
					});
				o.due_date = b.due_date;
			}
			if (b.notes !== undefined) o.notes = b.notes.slice(0, 1000);
			if (b.items) {
				const p = db.profiles.find((x) => x.profile_id === o.profile_id)!;
				const errors = validateItems(b.items, p);
				if (errors.length)
					return problem(
						422,
						errors.some((e) => e.code === 'ease_out_of_range')
							? 'ease_out_of_range'
							: 'validation_failed',
						{ errors }
					);
				const before = new Map(o.items.map((i) => [i.site_code, i]));
				o.items = toItems(b.items, p);
				for (const it of o.items)
					if (
						it.overridden &&
						(!before.get(it.site_code)?.overridden ||
							before.get(it.site_code)?.body_mm !== it.body_mm)
					)
						log(
							a.user,
							'override',
							'order',
							o.order_id,
							`${o.order_no} ${SITE_EN[it.site_code]} overridden`
						);
			}
			if (b.status && b.status !== o.status) {
				const from = o.status;
				o.status = b.status;
				o.status_history.push({ status: b.status, at: new Date().toISOString() });
				log(a.user, 'status_change', 'order', o.order_id, `${o.order_no} ${from} → ${b.status}`);
			}
			o.updated_at = new Date().toISOString();
			return HttpResponse.json(o);
		})
	),

	http.delete(
		`${API}/orders/:id`,
		route('DELETE /orders/:id', ({ request, params }) => {
			const a = requireRole(request, ['tailor']);
			if ('error' in a) return a.error;
			const mine = new Set(ownClients(a.user).map((c) => c.client_id));
			const o = db.orders.find((x) => x.order_id === params.id && mine.has(x.client_id));
			if (!o) return problem(404, 'not_found');
			if (o.status !== 'new')
				return problem(409, 'validation_failed', { detail: 'Only new orders can be deleted' });
			db.orders = db.orders.filter((x) => x !== o);
			log(a.user, 'deletion', 'order', o.order_id, `Deleted ${o.order_no}`);
			return new HttpResponse(null, { status: 204 });
		})
	),

	// Sheets
	http.post(
		`${API}/orders/:id/sheets`,
		route('POST /orders/:id/sheets', async ({ request, params }) => {
			const a = requireRole(request, ['tailor']);
			if ('error' in a) return a.error;
			const mine = new Set(ownClients(a.user).map((c) => c.client_id));
			const o = db.orders.find((x) => x.order_id === params.id && mine.has(x.client_id));
			if (!o) return problem(404, 'not_found');
			const b = (await json<{ include_name: boolean }>(request)) ?? { include_name: false };
			const p = db.profiles.find((x) => x.profile_id === o.profile_id)!;
			const share_text = buildShareText({
				client_code: o.client_code,
				display_name: o.display_name,
				include_name: !!b.include_name,
				profile_version: o.profile_version,
				captured_at: p.captured_at,
				garment_label: GARMENT_EN[o.garment_type],
				due_date: o.due_date,
				unit: a.user.unit_pref,
				lines: o.items.map((i) => ({
					label: SITE_EN[i.site_code],
					site_code: i.site_code,
					value_mm: i.finished_mm,
					flag: i.overridden ? 'pass' : i.confidence_flag
				}))
			});
			const sheet_id = uid(`sheet-${Date.now()}-${Math.random()}`);
			const generated_at = new Date().toISOString();
			db.sheets.push({
				sheet_id,
				order_id: o.order_id,
				include_name: !!b.include_name,
				share_text,
				generated_at
			});
			if (b.include_name)
				log(a.user, 'share', 'sheet', sheet_id, `${o.order_no} sheet with client name`);
			const base = new URL(request.url).pathname.replace(/\/orders\/.*$/, '');
			return HttpResponse.json(
				{
					sheet_id,
					png_url: `${base}/sheets/${sheet_id}/sheet.png`,
					pdf_url: `${base}/sheets/${sheet_id}/sheet.pdf`,
					share_text,
					generated_at
				},
				{ status: 201 }
			);
		})
	),

	http.get(`${API}/sheets/:id/sheet.png`, async ({ params }) => {
		const m = sheetModel(String(params.id));
		if (!m) return problem(404, 'not_found');
		const { body, type } = await sheetPng(m);
		return new HttpResponse(body, {
			headers: { 'Content-Type': type, 'Cache-Control': 'no-store' }
		});
	}),
	http.get(`${API}/sheets/:id/sheet.svg`, ({ params }) => {
		const m = sheetModel(String(params.id));
		return m
			? new HttpResponse(sheetSvg(m), { headers: { 'Content-Type': 'image/svg+xml' } })
			: problem(404, 'not_found');
	}),
	http.get(`${API}/sheets/:id/sheet.pdf`, ({ params }) => {
		const m = sheetModel(String(params.id));
		return m
			? new HttpResponse(sheetPdf(m), {
					headers: { 'Content-Type': 'application/pdf', 'Cache-Control': 'no-store' }
				})
			: problem(404, 'not_found');
	}),

	http.post(
		`${API}/sheets/:id/shares`,
		route('POST /sheets/:id/shares', async ({ request, params }) => {
			const a = requireRole(request, ['tailor']);
			if ('error' in a) return a.error;
			const s = db.sheets.find((x) => x.sheet_id === params.id);
			if (!s) return problem(404, 'not_found');
			const b = await json<{ via: string }>(request);
			if (!b || !['whatsapp_share', 'wa_link', 'download', 'print'].includes(b.via))
				return problem(422, 'validation_failed');
			const o = db.orders.find((x) => x.order_id === s.order_id)!;
			log(a.user, 'share', 'sheet', s.sheet_id, `${o.order_no} sheet via ${b.via}`);
			return new HttpResponse(null, { status: 204 });
		})
	),

	// Audit
	http.get(
		`${API}/audit`,
		route('GET /audit', ({ request }) => {
			const a = requireRole(request, ['tailor', 'admin']);
			if ('error' in a) return a.error;
			const url = new URL(request.url);
			return HttpResponse.json(page(filterAudit(a.user, url), url));
		})
	),

	http.get(
		`${API}/admin/audit.csv`,
		route('GET /admin/audit.csv', ({ request }) => {
			const a = requireRole(request, ['admin']);
			if ('error' in a) return a.error;
			const rows = filterAudit(a.user, new URL(request.url));
			log(a.user, 'export', 'export', 'audit.csv', `Audit CSV (${rows.length} rows)`);
			const body = csv([
				[
					'log_id',
					'occurred_at',
					'user_email',
					'role',
					'action',
					'entity_type',
					'entity_id',
					'summary'
				],
				...rows.map((r) => [
					r.log_id,
					r.occurred_at,
					r.user_email,
					r.role,
					r.action,
					r.entity_type,
					r.entity_id,
					r.summary
				])
			]);
			return new HttpResponse(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
		})
	),

	// Admin
	http.get(
		`${API}/admin/accounts`,
		route('GET /admin/accounts', ({ request }) => {
			const a = requireRole(request, ['admin']);
			if ('error' in a) return a.error;
			const status = new URL(request.url).searchParams.get('status');
			return HttpResponse.json(db.users.filter((u) => !status || u.status === status).map(account));
		})
	),

	...(['approve', 'reject', 'disable', 'enable'] as const).map((verb) =>
		http.post(
			`${API}/admin/accounts/:id/${verb}`,
			route(`POST /admin/accounts/:id/${verb}`, async ({ request, params }) => {
				const a = requireRole(request, ['admin']);
				if ('error' in a) return a.error;
				const u = db.users.find((x) => x.user_id === params.id);
				if (!u) return problem(404, 'not_found');
				if (u.user_id === a.user.user_id) return problem(403, 'forbidden');
				if (verb === 'reject') {
					const b = await json<{ reason: string }>(request);
					if (!b?.reason?.trim())
						return problem(422, 'validation_failed', {
							errors: [{ field: 'reason', code: 'required' }]
						});
					u.reject_reason = b.reason.trim();
				}
				u.status =
					verb === 'approve' || verb === 'enable'
						? 'active'
						: verb === 'reject'
							? 'rejected'
							: 'disabled';
				if (u.status !== 'active')
					for (const [k, t] of db.tokens) if (t.user_id === u.user_id) db.tokens.delete(k);
				log(
					a.user,
					verb === 'approve' || verb === 'reject' ? 'approve' : 'settings_change',
					'account',
					u.user_id,
					`${verb} ${u.email}`
				);
				return HttpResponse.json(account(u));
			})
		)
	),

	http.post(
		`${API}/admin/measurers`,
		route('POST /admin/measurers', async ({ request }) => {
			const a = requireRole(request, ['admin']);
			if ('error' in a) return a.error;
			const b = await json<{
				email: string;
				password: string;
				measurer_code: string;
				trained_on: string;
			}>(request);
			const errors: { field: string; code: string }[] = [];
			if (!b || validateEmail(b.email)) errors.push({ field: 'email', code: 'invalid' });
			if (!b || validatePassword(b.password)) errors.push({ field: 'password', code: 'too_short' });
			if (!b || !/^[A-Z]$/.test(b.measurer_code))
				errors.push({ field: 'measurer_code', code: 'invalid' });
			else if (db.users.some((u) => u.measurer_code === b.measurer_code))
				errors.push({ field: 'measurer_code', code: 'taken' });
			if (errors.length || !b) return problem(422, 'validation_failed', { errors });
			const u: MockUser = {
				user_id: uid(`user-${b.email}`),
				email: b.email.toLowerCase(),
				role: 'measurer',
				status: 'active',
				registered_at: new Date().toISOString(),
				password: b.password,
				locale: 'en',
				unit_pref: 'cm',
				include_name_default: false,
				ease_presets: {},
				measurer_code: b.measurer_code,
				trained_on: b.trained_on
			};
			db.users.push(u);
			log(a.user, 'settings_change', 'account', u.user_id, `Created measurer ${u.measurer_code}`);
			return HttpResponse.json(account(u), { status: 201 });
		})
	),

	http.get(
		`${API}/admin/settings`,
		route('GET /admin/settings', ({ request }) => {
			const a = requireRole(request, ['admin']);
			if ('error' in a) return a.error;
			return HttpResponse.json({
				retention_months: db.settings.retention_months,
				study_mode: db.settings.study_mode
			});
		})
	),

	http.put(
		`${API}/admin/settings`,
		route('PUT /admin/settings', async ({ request }) => {
			const a = requireRole(request, ['admin']);
			if ('error' in a) return a.error;
			const b = await json<{ retention_months: number; study_mode: boolean }>(request);
			if (
				!b ||
				!Number.isInteger(b.retention_months) ||
				b.retention_months < 1 ||
				b.retention_months > 120
			)
				return problem(422, 'validation_failed', {
					errors: [{ field: 'retention_months', code: 'out_of_range' }]
				});
			db.settings.retention_months = b.retention_months;
			db.settings.study_mode = !!b.study_mode;
			log(
				a.user,
				'settings_change',
				'settings',
				'global',
				`Retention ${b.retention_months} months, study mode ${b.study_mode ? 'on' : 'off'}`
			);
			return HttpResponse.json({
				retention_months: db.settings.retention_months,
				study_mode: db.settings.study_mode
			});
		})
	),

	http.get(
		`${API}/admin/deletion-requests`,
		route('GET /admin/deletion-requests', ({ request }) => {
			const a = requireRole(request, ['admin']);
			if ('error' in a) return a.error;
			return HttpResponse.json(db.deletionRequests);
		})
	),

	// Study
	http.get(
		`${API}/study/participants`,
		route('GET /study/participants', ({ request }) => {
			const a = requireRole(request, ['admin']);
			if ('error' in a) return a.error;
			if (!db.settings.study_mode) return problem(404, 'study_mode_off');
			return HttpResponse.json(
				db.participants.map(({ client_id, ...p }) => {
					const sets = db.profiles.filter(
						(x) => x.client_id === client_id && x.session.study
					).length;
					const readings: Partial<Record<SiteCode, number>> = {};
					for (const r of db.readings.filter((x) => x.participant_code === p.participant_code))
						for (const s of Object.keys(r.values) as SiteCode[])
							readings[s] = (readings[s] ?? 0) + 1;
					return { ...p, sets_captured: sets, readings };
				})
			);
		})
	),

	http.post(
		`${API}/study/participants`,
		route('POST /study/participants', async ({ request }) => {
			const a = requireRole(request, ['admin']);
			if ('error' in a) return a.error;
			if (!db.settings.study_mode) return problem(404, 'study_mode_off');
			const b = await json<{
				participant_code: string;
				sex: 'female' | 'male';
				age_band: string;
				venue: string;
			}>(request);
			const errors: { field: string; code: string }[] = [];
			if (!b || !PARTICIPANT_CODE_RE.test(b.participant_code))
				errors.push({ field: 'participant_code', code: 'invalid' });
			else if (db.participants.some((p) => p.participant_code === b.participant_code))
				errors.push({ field: 'participant_code', code: 'taken' });
			if (!b || !['female', 'male'].includes(b.sex)) errors.push({ field: 'sex', code: 'invalid' });
			if (!b || !['18-24', '25-34', '35-44', '45-54', '55+'].includes(b.age_band))
				errors.push({ field: 'age_band', code: 'invalid' });
			if (errors.length || !b) return problem(422, 'validation_failed', { errors });
			const code = nextCode('SP');
			const c: MockClient = {
				client_id: uid(`client-${code}`),
				tailor_id: a.user.user_id,
				client_code: code,
				display_name: null,
				height_mm: null,
				created_at: new Date().toISOString(),
				old_codes: []
			};
			db.clients.push(c);
			const participant_id = uid(`participant-${b.participant_code}`);
			db.participants.push({
				participant_id,
				participant_code: b.participant_code,
				sex: b.sex,
				age_band: b.age_band as never,
				venue: b.venue?.trim() ?? '',
				client_code: code,
				client_id: c.client_id,
				enrolled_at: new Date().toISOString()
			});
			return HttpResponse.json({ participant_id, client_code: code }, { status: 201 });
		})
	),

	http.post(
		`${API}/study/reference-readings`,
		route('POST /study/reference-readings', async ({ request }) => {
			const a = requireRole(request, ['measurer']);
			if ('error' in a) return a.error;
			if (!db.settings.study_mode) return problem(404, 'study_mode_off');
			const b = await json<{
				participant_code: string;
				reading_no: 1 | 2;
				values: Partial<Record<SiteCode, number>>;
				taken_at: string;
			}>(request);
			if (!b || !db.participants.some((p) => p.participant_code === b.participant_code))
				return problem(422, 'validation_failed', {
					errors: [{ field: 'participant_code', code: 'unknown' }]
				});
			if (b.reading_no !== 1 && b.reading_no !== 2)
				return problem(422, 'validation_failed', {
					errors: [{ field: 'reading_no', code: 'invalid' }]
				});
			const bad = Object.entries(b.values ?? {}).filter(
				([s, v]) => !REFERENCE_ORDER.includes(s as SiteCode) || !Number.isInteger(v)
			);
			if (bad.length || !Object.keys(b.values ?? {}).length)
				return problem(422, 'validation_failed', {
					errors: bad.map(([s]) => ({ field: `values.${s}`, code: 'invalid' }))
				});
			const m = a.user.measurer_code!;
			const mine = db.readings.filter(
				(r) => r.participant_code === b.participant_code && r.measurer_code === m
			);
			if (mine.some((r) => r.reading_no === b.reading_no)) return problem(409, 'reading_locked');
			const out_of_order = b.reading_no === 2 && !mine.some((r) => r.reading_no === 1);
			const reading_id = uid(`reading-${b.participant_code}-${m}-${b.reading_no}-${Date.now()}`);
			db.readings.push({
				reading_id,
				participant_code: b.participant_code,
				measurer_code: m,
				reading_no: b.reading_no,
				values: b.values,
				taken_at: b.taken_at,
				out_of_order
			});
			// Never echo values back: measurers must stay blind (FR-23).
			return HttpResponse.json(
				{
					reading_id,
					participant_code: b.participant_code,
					reading_no: b.reading_no,
					measurer_code: m,
					locked: true,
					out_of_order
				},
				{ status: 201 }
			);
		})
	),

	http.get(
		`${API}/study/export/:kind`,
		route('GET /study/export/:kind', ({ request, params }) => {
			const a = requireRole(request, ['admin']);
			if ('error' in a) return a.error;
			if (!db.settings.study_mode) return problem(404, 'study_mode_off');
			const kind = String(params.kind);
			let body: string;
			if (kind === 'captures.csv') body = capturesCsv();
			else if (kind === 'reference.csv')
				body = csv([
					[
						'participant_code',
						'site_code',
						'measurer_code',
						'reading_no',
						'value_cm',
						'taken_at',
						'out_of_order'
					],
					...db.readings.flatMap((r) =>
						REFERENCE_ORDER.filter((s) => r.values[s] != null).map((s) => [
							r.participant_code,
							s,
							r.measurer_code,
							r.reading_no,
							(r.values[s]! / 10).toFixed(1),
							r.taken_at,
							r.out_of_order ? 1 : 0
						])
					)
				]);
			else return problem(404, 'not_found');
			log(a.user, 'export', 'export', kind, `Study export ${kind}`);
			return new HttpResponse(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
		})
	)
];

/* ---------------- helpers that read db ---------------- */

function nextCode(prefix?: string): string {
	const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
	for (;;) {
		const n = ++db.seq.code;
		const code =
			(prefix ?? letters[(n * 7) % letters.length]! + letters[(n * 13 + 5) % letters.length]!) +
			String((4000 + n * 97) % 10000).padStart(4, '0');
		if (!db.clients.some((c) => c.client_code === code || c.old_codes.includes(code))) return code;
	}
}

function account(u: MockUser): Account {
	const {
		password: _p,
		locale: _l,
		unit_pref: _u,
		include_name_default: _i,
		ease_presets: _e,
		...a
	} = u;
	return a;
}

function filterAudit(user: MockUser, url: URL) {
	const sp = url.searchParams;
	let rows = user.role === 'admin' ? db.audit : db.audit.filter((e) => e.user_email === user.email);
	const by = (k: string, f: (e: AuditEntry, v: string) => boolean) => {
		const v = sp.get(k);
		if (v) rows = rows.filter((e) => f(e, v));
	};
	by('user', (e, v) => e.user_email.includes(v.toLowerCase()));
	by('role', (e, v) => e.role === v);
	by('action', (e, v) => e.action === v);
	by('entity_type', (e, v) => e.entity_type === v);
	by('from', (e, v) => e.occurred_at.slice(0, 10) >= v);
	by('to', (e, v) => e.occurred_at.slice(0, 10) <= v);
	return [...rows].sort((x, y) => y.occurred_at.localeCompare(x.occurred_at));
}

/** Appendix E application fields, one row per capture set. */
function capturesCsv(): string {
	const header = [
		'participant_code',
		'set_no',
		'captured_at',
		...['level', 'frame', 'marker', 'symmetry', 'arms', 'light'].flatMap((c) => [
			`front_${c}`,
			`side_${c}`
		]),
		'scale_front_mm_px',
		'scale_side_mm_px',
		'scale_stature_mm_px',
		'scale_disagreement_pct',
		...SITES.flatMap((s) => [`${s}_cm`, `${s}_flag`]),
		'processing_s',
		'retake_count',
		'capture_mode',
		'lighting',
		'distance_m',
		'clothing_fit_observed',
		'phone_model',
		'os',
		'browser',
		'model_variant',
		'rules_version',
		'lux'
	];
	const rows = db.profiles
		.filter((p) => p.session.study)
		.map((p) => {
			const s = p.session;
			const st = s.study!;
			const m = (site: SiteCode) => p.measurements.find((x) => x.site_code === site);
			return [
				st.participant_code,
				st.set_no,
				p.captured_at,
				...(['level', 'frame', 'marker', 'symmetry', 'arms', 'light'] as const).flatMap((c) => [
					s.front_checks[c],
					s.side_checks[c]
				]),
				s.scale_front_mm_px,
				s.scale_side_mm_px,
				s.scale_stature_mm_px,
				s.scale_disagreement_pct,
				...SITES.flatMap((site) => {
					const x = m(site);
					return [
						x?.value_mm == null ? '' : (x.value_mm / 10).toFixed(1),
						x?.confidence_flag ?? ''
					];
				}),
				(s.processing_ms / 1000).toFixed(1),
				s.retake_count,
				s.capture_mode,
				st.lighting,
				st.distance_m,
				st.clothing_fit_observed,
				s.device_model,
				s.os,
				s.browser,
				s.model_variant,
				p.rules_version,
				st.lux ?? ''
			];
		});
	return csv([header, ...rows]);
}

export { DEMO_PASSWORD };
