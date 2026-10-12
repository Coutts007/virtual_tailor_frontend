/**
 * Contract tests: the real HttpApiClient against the MSW mock, one block per
 * endpoint group in docs/api-contract.md. If these pass against the FastAPI
 * backend too (VT_API_URL), the swap is safe.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { HttpApiClient } from '../../src/lib/api/http';
import { ApiError } from '../../src/lib/api/errors';
import { mockDb } from '../../mocks/handlers';
import { DEMO_PASSWORD, makeProfile } from '../../mocks/seed';
import type { MeasurementProfilePayload, OrderItemInput } from '../../src/lib/api/types';
import { GARMENT_SITES } from '../../src/lib/domain/sites';
import { addDays, nairobiToday } from '../../src/lib/domain/validate';

const BASE = 'http://localhost/api/v1';

function clientFor() {
	let token: string | null = null;
	const c = new HttpApiClient({
		baseUrl: BASE,
		authHeaders: (): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {})
	});
	return {
		c,
		async as(email: string) {
			const r = await c.login(email, DEMO_PASSWORD);
			token = r.access_token;
			return r;
		}
	};
}

async function problemOf(p: Promise<unknown>) {
	try {
		await p;
	} catch (e) {
		if (e instanceof ApiError) return e.problem;
		throw e;
	}
	throw new Error('expected an ApiError');
}

function payloadFor(
	code: string,
	version: number,
	label = `t-${code}-${version}`
): MeasurementProfilePayload {
	const {
		sync_status: _s,
		client_id: _c,
		created_at: _a,
		...p
	} = makeProfile({
		label,
		client_code: code,
		version,
		captured_at: new Date().toISOString(),
		sex: 'female',
		height_mm: 1650,
		scenario: 'all_pass'
	});
	return p;
}

describe('public and client app', () => {
	const { c } = clientFor();

	it('GET /settings/public', async () => {
		expect(await c.getPublicSettings()).toEqual({
			study_mode: true,
			consent_version: '1.0',
			min_app_version: '0.0.1'
		});
	});

	it('GET /client-codes/{code}: valid code shows the tailor; unknown → 404 code_not_found', async () => {
		expect(await c.checkClientCode('AB1234')).toEqual({
			valid: true,
			tailor_business_name: 'Mama Wanjiru Tailors',
			height_mm: 1650
		});
		expect(await problemOf(c.checkClientCode('ZZ9999'))).toMatchObject({
			status: 404,
			code: 'code_not_found'
		});
	});

	it('POST /profiles: 201, idempotent replay, conflict, unknown code', async () => {
		const p = payloadFor('QT1200', 1);
		expect(await c.syncProfile(p)).toEqual({ profile_id: p.profile_id, version: 1 });
		expect(await c.syncProfile(p)).toEqual({ profile_id: p.profile_id, version: 1 }); // replay
		const stale = payloadFor('AB1234', 1, 'stale');
		expect(await problemOf(c.syncProfile(stale))).toMatchObject({
			status: 409,
			code: 'profile_version_conflict',
			server_version: 2
		});
		expect(await problemOf(c.syncProfile(payloadFor('ZZ0000', 1)))).toMatchObject({
			status: 404,
			code: 'code_not_found'
		});
	});

	it('POST /profiles rejects image data (NFR-10 server side)', async () => {
		const p = payloadFor('QT1200', 5);
		(p as unknown as Record<string, unknown>).thumb = 'data:image/png;base64,AAAA';
		expect(await problemOf(c.syncProfile(p))).toMatchObject({ status: 422 });
	});

	it('POST /deletion-requests → 202', async () => {
		const r = await c.requestDeletion({
			client_code: 'AB1234',
			profile_ids: ['x'],
			reason: 'delete'
		});
		expect(r.request_id).toMatch(/^[0-9a-f-]{36}$/);
	});
});

describe('auth', () => {
	it('logs in each seeded role', async () => {
		for (const [email, role] of [
			['admin@vt.test', 'admin'],
			['wanjiru@vt.test', 'tailor'],
			['measurer-a@vt.test', 'measurer']
		]) {
			const { as } = clientFor();
			const r = await as(email!);
			expect(r.user.role).toBe(role);
			expect(Date.parse(r.expires_at) - Date.now()).toBeGreaterThan(23 * 3600_000);
		}
	});

	it('wrong password is generic; pending logs in with status pending; disabled is refused', async () => {
		const { c } = clientFor();
		expect(await problemOf(c.login('nobody@vt.test', 'x'))).toMatchObject({
			code: 'invalid_credentials'
		});
		expect(await problemOf(c.login('wanjiru@vt.test', 'wrong-password'))).toMatchObject({
			code: 'invalid_credentials'
		});
		expect((await c.login('pending@vt.test', DEMO_PASSWORD)).user.status).toBe('pending');
		expect(await problemOf(c.login('disabled@vt.test', DEMO_PASSWORD))).toMatchObject({
			code: 'account_disabled'
		});
	});

	it('rate-limits after 5 failures with Retry-After', async () => {
		const { c } = clientFor();
		for (let i = 0; i < 5; i++) await problemOf(c.login('otieno@vt.test', 'bad'));
		const p = await problemOf(c.login('otieno@vt.test', DEMO_PASSWORD));
		expect(p).toMatchObject({ status: 429, code: 'rate_limited' });
		expect(p.retry_after_s).toBeGreaterThan(0);
	});

	it('register → pending; rejects short and common passwords', async () => {
		const { c } = clientFor();
		const ok = {
			email: 'new@vt.test',
			password: 'long enough pw',
			business_name: 'New',
			phone: '0712000000',
			area: 'Ngara',
			locale: 'en' as const
		};
		expect(await c.register(ok)).toEqual({ status: 'pending' });
		const p = await problemOf(c.register({ ...ok, password: 'Nairobi123' }));
		expect(p.errors).toContainEqual({ field: 'password', code: 'too_common' });
	});

	it('unauthenticated dashboard call → 401; wrong role → 403', async () => {
		const { c, as } = clientFor();
		expect(await problemOf(c.listClients())).toMatchObject({ status: 401 });
		await as('measurer-a@vt.test');
		expect(await problemOf(c.listClients())).toMatchObject({ status: 403, code: 'forbidden' });
	});

	it('GET/PATCH /me and password change', async () => {
		const { c, as } = clientFor();
		await as('wanjiru@vt.test');
		const me = await c.getMe();
		expect(me).toMatchObject({ business_name: 'Mama Wanjiru Tailors', unit_pref: 'cm' });
		expect(me).not.toHaveProperty('password');
		expect((await c.updateMe({ unit_pref: 'in' })).unit_pref).toBe('in');
		expect(await problemOf(c.changePassword('wrong', 'another long one'))).toMatchObject({
			code: 'invalid_credentials'
		});
		await c.changePassword(DEMO_PASSWORD, 'another long one');
	});
});

describe('tailor: clients and profiles', () => {
	let api: ReturnType<typeof clientFor>;
	beforeEach(async () => {
		api = clientFor();
		await api.as('wanjiru@vt.test');
	});

	it('lists only own clients (8), searchable and filterable', async () => {
		const all = await api.c.listClients();
		expect(all.total).toBe(8);
		expect(all.items.every((x) => x.client_code !== 'OB1001')).toBe(true);
		expect((await api.c.listClients({ search: 'amina' })).items.map((x) => x.client_code)).toEqual([
			'AB1234'
		]);
		expect((await api.c.listClients({ filter: 'none' })).items.map((x) => x.client_code)).toEqual([
			'QT1200'
		]);
		const flagged = await api.c.listClients({ filter: 'flags' });
		expect(flagged.items.length).toBeGreaterThan(0);
		expect((await api.c.listClients({ page_size: 3, page: 2 })).items).toHaveLength(3);
	});

	it('issues a code and logs code_issue', async () => {
		const r = await api.c.issueClientCode({ display_name: 'Zawadi', height_mm: 1600 });
		expect(r.client_code).toMatch(/^[A-Z]{2}[0-9]{4}$/);
		expect(r.deep_link).toContain(`/start?code=${r.client_code}`);
		expect(mockDb().audit[0]).toMatchObject({
			action: 'code_issue',
			user_email: 'wanjiru@vt.test'
		});
	});

	it('client detail embeds profiles and orders; profile view is audited', async () => {
		const amina = (await api.c.listClients({ search: 'AB1234' })).items[0]!;
		const d = await api.c.getClient(amina.client_id);
		expect(d.profiles.map((p) => p.version)).toEqual([2, 1]);
		expect(d.orders.length).toBeGreaterThan(0);
		const p = await api.c.getProfile(d.profiles[0]!.profile_id);
		expect(p.measurements).toHaveLength(9);
		expect(p.measurements.find((m) => m.site_code === 'waist')).toMatchObject({
			confidence_flag: 'check',
			flag_reasons: ['scale_disagree']
		});
		expect(mockDb().audit[0]).toMatchObject({ action: 'profile_view', entity_id: p.profile_id });
	});

	it('seed covers failed inside leg with value_mm = null (C4)', async () => {
		const anon = (await api.c.listClients({ search: 'MW3310' })).items[0]!;
		const p = await api.c.getProfile(anon.latest_profile_id!);
		expect(p.measurements.find((m) => m.site_code === 'inleg')).toMatchObject({
			value_mm: null,
			confidence_flag: 'fail'
		});
	});

	it('cannot delete a client with open orders (409 client_has_orders)', async () => {
		const amina = (await api.c.listClients({ search: 'AB1234' })).items[0]!;
		expect(await problemOf(api.c.deleteClient(amina.client_id))).toMatchObject({
			status: 409,
			code: 'client_has_orders'
		});
	});

	it('rotates a code; the old code stops working', async () => {
		const qt = (await api.c.listClients({ search: 'QT1200' })).items[0]!;
		const { client_code } = await api.c.rotateClientCode(qt.client_id);
		expect(client_code).not.toBe('QT1200');
		expect(await problemOf(api.c.checkClientCode('QT1200'))).toMatchObject({
			code: 'code_not_found'
		});
	});

	it('lists and resolves the seeded conflict', async () => {
		const list = await api.c.listConflicts();
		expect(list).toHaveLength(1);
		expect(list[0]!.server.version).toBe(2);
		expect(list[0]!.device.version).toBe(3);
		await api.c.resolveConflict(list[0]!.profile_id, 'newer');
		expect(await api.c.listConflicts()).toHaveLength(0);
	});
});

describe('tailor: orders and sheets', () => {
	let api: ReturnType<typeof clientFor>;
	beforeEach(async () => {
		api = clientFor();
		await api.as('wanjiru@vt.test');
	});

	it('order queue: counts per status, filter, overdue present, sorted by due date', async () => {
		const r = await api.c.listOrders();
		expect(Object.keys(r.counts).sort()).toEqual([
			'collected',
			'cutting',
			'fitting',
			'new',
			'ready'
		]);
		expect(r.items.map((o) => o.due_date)).toEqual([...r.items.map((o) => o.due_date)].sort());
		expect(r.items.some((o) => o.due_date < nairobiToday() && o.status !== 'collected')).toBe(true);
		const fitting = await api.c.listOrders({ status: 'fitting' });
		expect(fitting.items.every((o) => o.status === 'fitting')).toBe(true);
	});

	it('flagged rows must be confirmed or overridden; override is audited', async () => {
		const amina = (await api.c.listClients({ search: 'AB1234' })).items[0]!;
		const profile = await api.c.getProfile(amina.latest_profile_id!);
		const items: OrderItemInput[] = GARMENT_SITES.shirt.map((s) => ({
			site_code: s,
			body_mm: profile.measurements.find((m) => m.site_code === s)!.value_mm,
			ease_mm: 20,
			overridden: false
		}));
		const input = {
			client_id: amina.client_id,
			profile_id: profile.profile_id,
			garment_type: 'shirt' as const,
			due_date: addDays(nairobiToday(), 10),
			notes: '',
			items
		};
		const p = await problemOf(api.c.createOrder(input));
		expect(p.errors).toContainEqual({ field: 'items[2]', code: 'flag_unconfirmed' }); // waist (check)

		const fixed = items.map((i) =>
			i.site_code === 'waist'
				? { ...i, overridden: true, body_mm: 870, override_reason: 'Taped' }
				: i
		);
		const o = await api.c.createOrder({ ...input, items: fixed });
		expect(o.order_no).toMatch(/^ORD-\d{4}$/);
		expect(o.items.find((i) => i.site_code === 'waist')).toMatchObject({
			finished_mm: 890,
			overridden: true
		});
		expect(mockDb().audit[0]).toMatchObject({ action: 'override' });
	});

	it('rejects a past due date and out-of-range ease', async () => {
		const amina = (await api.c.listClients({ search: 'AB1234' })).items[0]!;
		const base = {
			client_id: amina.client_id,
			profile_id: amina.latest_profile_id!,
			garment_type: 'other' as const,
			notes: '',
			items: []
		};
		expect(
			await problemOf(api.c.createOrder({ ...base, due_date: addDays(nairobiToday(), -1) }))
		).toMatchObject({ code: 'due_date_past' });
		const bad = [{ site_code: 'hip' as const, body_mm: 900, ease_mm: 301, overridden: false }];
		expect(
			await problemOf(api.c.createOrder({ ...base, due_date: nairobiToday(), items: bad }))
		).toMatchObject({ code: 'ease_out_of_range' });
	});

	it('status change is recorded in history and audit', async () => {
		const { items } = await api.c.listOrders({ status: 'new' });
		const o = await api.c.updateOrder(items[0]!.order_id, { status: 'cutting' });
		expect(o.status_history.at(-1)!.status).toBe('cutting');
		expect(mockDb().audit[0]).toMatchObject({ action: 'status_change' });
	});

	it('sheet: share text without name by default, PNG and PDF served, share logged', async () => {
		const { items } = await api.c.listOrders({ status: 'new' });
		const s = await api.c.generateSheet(items[0]!.order_id, false);
		expect(s.share_text).toMatch(/^Virtual Tailor · Client [A-Z]{2}\d{4} · Profile v\d/);
		expect(s.share_text).not.toContain('Amina');
		expect(s.share_text.endsWith('No photo is stored.')).toBe(true);
		const pdf = await fetch(new URL(s.pdf_url, 'http://localhost'));
		expect(pdf.headers.get('Content-Type')).toBe('application/pdf');
		expect((await pdf.text()).startsWith('%PDF-1.4')).toBe(true);
		await api.c.logShare(s.sheet_id, 'wa_link');
		expect(mockDb().audit[0]).toMatchObject({ action: 'share' });
		const named = await api.c.generateSheet(items[0]!.order_id, true);
		expect(named.share_text).toContain('· Amina ·');
	});

	it('only new orders can be deleted', async () => {
		const { items } = await api.c.listOrders({ status: 'ready' });
		expect(await problemOf(api.c.deleteOrder(items[0]!.order_id))).toMatchObject({ status: 409 });
	});

	it('audit shows only own entries for tailors', async () => {
		const page = await api.c.listAudit({ page_size: 100 });
		expect(page.items.every((e) => e.user_email === 'wanjiru@vt.test')).toBe(true);
	});
});

describe('admin', () => {
	let api: ReturnType<typeof clientFor>;
	beforeEach(async () => {
		api = clientFor();
		await api.as('admin@vt.test');
	});

	it('approves a pending tailor, who can then work', async () => {
		const pending = await api.c.listAccounts('pending');
		expect(pending.map((a) => a.email)).toEqual(['pending@vt.test']);
		expect(pending[0]).not.toHaveProperty('password');
		expect((await api.c.approveAccount(pending[0]!.user_id)).status).toBe('active');
		const t = clientFor();
		await t.as('pending@vt.test');
		expect((await t.c.listClients()).total).toBe(0);
	});

	it('reject needs a reason', async () => {
		const [p] = await api.c.listAccounts('pending');
		expect(await problemOf(api.c.rejectAccount(p!.user_id, ' '))).toMatchObject({ status: 422 });
		expect((await api.c.rejectAccount(p!.user_id, 'Not a tailor')).status).toBe('rejected');
	});

	it('settings round-trip; study mode off hides study endpoints', async () => {
		expect(await api.c.getAdminSettings()).toEqual({ retention_months: 24, study_mode: true });
		await api.c.putAdminSettings({ retention_months: 36, study_mode: false });
		expect(await problemOf(api.c.listParticipants())).toMatchObject({ code: 'study_mode_off' });
		expect((await api.c.getPublicSettings()).study_mode).toBe(false);
	});

	it('audit CSV export is logged; deletion requests listed', async () => {
		const body = await api.c.exportAuditCsv({ action: 'login' });
		expect(body.split('\n')[0]).toBe(
			'log_id,occurred_at,user_email,role,action,entity_type,entity_id,summary'
		);
		expect(mockDb().audit[0]).toMatchObject({ action: 'export' });
		expect((await api.c.listDeletionRequests()).length).toBe(2);
	});

	it('creates a measurer', async () => {
		const m = await api.c.createMeasurer({
			email: 'mc@vt.test',
			password: 'long enough pw',
			measurer_code: 'C',
			trained_on: '2026-09-01'
		});
		expect(m).toMatchObject({ role: 'measurer', measurer_code: 'C' });
	});
});

describe('study', () => {
	it('participants with completeness; enrol creates a client code', async () => {
		const { c, as } = clientFor();
		await as('admin@vt.test');
		const list = await c.listParticipants();
		expect(list.map((p) => p.participant_code)).toEqual(['P001', 'P002', 'P003', 'P004', 'P005']);
		expect(list[0]).toMatchObject({ sets_captured: 3 });
		expect(list[0]!.readings.waist).toBe(4);
		const r = await c.enrolParticipant({
			participant_code: 'P006',
			sex: 'female',
			age_band: '25-34',
			venue: 'MKU'
		});
		expect(r.client_code).toMatch(/^SP\d{4}$/);
	});

	it('reference readings: locked after submit, out-of-order flagged, values never echoed', async () => {
		const { c, as } = clientFor();
		await as('measurer-b@vt.test');
		const r = await c.submitReferenceReading({
			participant_code: 'P003',
			reading_no: 2,
			values: { waist: 812 },
			taken_at: new Date().toISOString()
		});
		expect(r).toEqual({
			reading_id: r.reading_id,
			participant_code: 'P003',
			reading_no: 2,
			measurer_code: 'B',
			locked: true,
			out_of_order: true
		});
		expect(
			await problemOf(
				c.submitReferenceReading({
					participant_code: 'P003',
					reading_no: 2,
					values: { waist: 813 },
					taken_at: new Date().toISOString()
				})
			)
		).toMatchObject({ status: 409, code: 'reading_locked' });
	});

	it('measurers cannot read profiles (blind to system values)', async () => {
		const { c, as } = clientFor();
		await as('measurer-a@vt.test');
		expect(await problemOf(c.getProfile(mockDb().profiles[0]!.profile_id))).toMatchObject({
			status: 403
		});
	});

	it('captures CSV carries the Appendix E fields', async () => {
		const { c, as } = clientFor();
		await as('admin@vt.test');
		const csv = await c.exportStudyCsv('captures');
		const [head, ...rows] = csv.trim().split('\n');
		for (const col of [
			'participant_code',
			'set_no',
			'front_level',
			'side_marker',
			'scale_disagreement_pct',
			'waist_cm',
			'waist_flag',
			'processing_s',
			'retake_count',
			'lighting',
			'distance_m',
			'clothing_fit_observed',
			'phone_model',
			'model_variant',
			'rules_version',
			'lux'
		])
			expect(head!.split(','), col).toContain(col);
		expect(rows).toHaveLength(6);
		const ref = await c.exportStudyCsv('reference');
		expect(ref.split('\n')[0]).toBe(
			'participant_code,site_code,measurer_code,reading_no,value_cm,taken_at,out_of_order'
		);
	});
});

describe('error simulation', () => {
	it('?__fail=<status> forces a problem on any endpoint', async () => {
		const c = new HttpApiClient({
			baseUrl: BASE,
			fetchImpl: (u, i) => fetch(`${u}?__fail=503`, i)
		});
		expect(await problemOf(c.getPublicSettings())).toMatchObject({ status: 503 });
	});
});
