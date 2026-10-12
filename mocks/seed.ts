/**
 * Deterministic seed data for the MSW mock (Section 20.4). Everything is derived
 * from a fixed PRNG seed; dates are relative to the moment the seed is created
 * so that "overdue" and "due soon" stay meaningful.
 */
import type {
	Account,
	AuditAction,
	AuditEntry,
	CaptureSession,
	ClothingFit,
	DeletionRequest,
	Flag,
	FlagReason,
	GarmentType,
	Landmark,
	MarkerObs,
	Measurement,
	MeasurementProfile,
	Order,
	OrderItem,
	OrderStatus,
	Participant,
	Role,
	Sex,
	SiteCode,
	SyncStatus,
	ViewChecks,
	EasePresets,
	UnitPref
} from '../src/lib/api/types';
import { GARMENT_SITES } from '../src/lib/domain/sites';

export const CONSENT_VERSION = '1.0';
export const DEMO_PASSWORD = 'vt-demo-2026';
export const RULES_VERSION = '0.1-uncalibrated';

/** mulberry32: small deterministic PRNG. */
export function prng(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Deterministic UUIDv4-shaped id from a label. */
export function uid(label: string): string {
	let h1 = 0x811c9dc5,
		h2 = 0x01000193;
	for (let i = 0; i < label.length; i++) {
		h1 = Math.imul(h1 ^ label.charCodeAt(i), 16777619) >>> 0;
		h2 = Math.imul(h2 ^ label.charCodeAt(i), 2246822519) >>> 0;
	}
	const r = prng(h1 ^ h2);
	const hex = Array.from({ length: 32 }, () => Math.floor(r() * 16).toString(16)).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${'89ab'[Math.floor(r() * 4)]}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export interface MockUser extends Account {
	password: string;
	locale: 'en' | 'sw';
	unit_pref: UnitPref;
	include_name_default: boolean;
	ease_presets: EasePresets;
}
export interface MockClient {
	client_id: string;
	tailor_id: string;
	client_code: string;
	display_name: string | null;
	height_mm: number | null;
	created_at: string;
	old_codes: string[];
}
export interface MockParticipant extends Omit<Participant, 'sets_captured' | 'readings'> {
	client_id: string;
}
export interface MockReading {
	reading_id: string;
	participant_code: string;
	measurer_code: string;
	reading_no: 1 | 2;
	values: Partial<Record<SiteCode, number>>;
	taken_at: string;
	out_of_order: boolean;
}
export interface MockSheet {
	sheet_id: string;
	order_id: string;
	include_name: boolean;
	share_text: string;
	generated_at: string;
}

const HOUR = 3600_000;
const DAY = 24 * HOUR;

function iso(ms: number) {
	return new Date(ms).toISOString();
}
function isoDate(ms: number) {
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date(ms));
}

/* ---------------- synthetic capture data ---------------- */

/** A standing figure, arms ~30° out, normalised to a 1080×1920 portrait frame. */
export function syntheticLandmarks(
	view: 'front' | 'side',
	heightFrac = 0.5,
	rand = prng(1)
): Landmark[] {
	const top = 0.25;
	const H = heightFrac;
	const cx = 0.5;
	const j = () => (rand() - 0.5) * 0.002;
	const pt = (x: number, y: number, v = 0.95): Landmark => ({
		x: +(x + j()).toFixed(5),
		y: +(top + y * H + j()).toFixed(5),
		z: 0,
		visibility: v
	});
	const s = view === 'front' ? 1 : 0.15; // side view collapses widths
	const L: Landmark[] = [];
	// 0 nose, 1-10 face
	L[0] = pt(cx, 0.06);
	for (let i = 1; i <= 10; i++)
		L[i] = pt(cx + (i % 2 ? -1 : 1) * 0.01 * s * (1 + (i % 4)), 0.04 + (i > 8 ? 0.05 : 0));
	L[11] = pt(cx + 0.075 * s, 0.18);
	L[12] = pt(cx - 0.075 * s, 0.18);
	L[13] = pt(cx + 0.12 * s, 0.33);
	L[14] = pt(cx - 0.12 * s, 0.33);
	L[15] = pt(cx + 0.16 * s, 0.46);
	L[16] = pt(cx - 0.16 * s, 0.46);
	for (let i = 17; i <= 22; i++) L[i] = pt(cx + (i % 2 ? 1 : -1) * 0.17 * s, 0.49, 0.8);
	L[23] = pt(cx + 0.045 * s, 0.52);
	L[24] = pt(cx - 0.045 * s, 0.52);
	L[25] = pt(cx + 0.045 * s, 0.73);
	L[26] = pt(cx - 0.045 * s, 0.73);
	L[27] = pt(cx + 0.045 * s, 0.94);
	L[28] = pt(cx - 0.045 * s, 0.94);
	L[29] = pt(cx + 0.04 * s, 0.97);
	L[30] = pt(cx - 0.04 * s, 0.97);
	L[31] = pt(cx + 0.06 * s, 0.98);
	L[32] = pt(cx - 0.06 * s, 0.98);
	return L;
}

export function syntheticMarker(side_px: number, cx = 540, cy = 760, confidence = 0.95): MarkerObs {
	const h = side_px / 2;
	return {
		corners: [
			[cx - h, cy - h],
			[cx + h, cy - h],
			[cx + h, cy + h],
			[cx - h, cy + h]
		],
		image_w: 1080,
		image_h: 1920,
		side_px,
		confidence
	};
}

const PASS_CHECKS: ViewChecks = {
	level: 'pass',
	frame: 'pass',
	distance: 'pass',
	symmetry: 'pass',
	arms: 'pass',
	marker: 'pass',
	light: 'pass',
	sharpness: 'pass'
};

/** Body proportions (mm) from height and sex; rough anthropometric ratios. */
function bodyFromHeight(height: number, sex: Sex, r: () => number): Record<SiteCode, number> {
	const k = sex === 'female' ? 1 : 1.04;
	const v = (ratio: number, spread = 0.03) =>
		Math.round(height * ratio * (1 + (r() - 0.5) * spread) * k);
	return {
		stature: height,
		shoulder: v(0.245),
		chest: v(0.56, 0.08),
		waist: v(0.48, 0.12),
		hip: v(0.6, 0.08),
		sleeve: v(0.355),
		outleg: v(0.605),
		inleg: v(0.455),
		neck: v(0.215, 0.05)
	};
}

export type ProfileScenario =
	'all_pass' | 'waist_check' | 'inleg_fail' | 'level_unchecked' | 'loose' | 'marker_weak';

export interface ProfileSpec {
	label: string;
	client_code: string;
	version: number;
	captured_at: string;
	sex: Sex;
	height_mm: number;
	fit?: ClothingFit;
	scenario: ProfileScenario;
	capture_mode?: 'self' | 'assisted';
	sync_status?: SyncStatus;
	study?: CaptureSession['study'];
}

export function makeProfile(spec: ProfileSpec): MeasurementProfile {
	const r = prng(spec.label.length * 7919 + spec.version * 104729 + spec.height_mm);
	const body = bodyFromHeight(spec.height_mm, spec.sex, r);
	const fit: ClothingFit = spec.fit ?? (spec.scenario === 'loose' ? 'loose' : 'fitted');
	const levelUnchecked = spec.scenario === 'level_unchecked';
	const disagreement = spec.scenario === 'waist_check' ? 3.2 : +(0.4 + r() * 1.2).toFixed(1);
	const scaleFront = +(1.82 + r() * 0.1).toFixed(4);
	const markerConf = spec.scenario === 'marker_weak' ? 0.72 : +(0.88 + r() * 0.1).toFixed(2);

	const measurements: Measurement[] = (Object.keys(body) as SiteCode[]).map((site) => {
		const reasons: FlagReason[] = [];
		let flag: Flag = 'pass';
		let value: number | null = body[site];
		if (site === 'stature') {
			value = Math.round(spec.height_mm * (1 - (r() * 0.012 - 0.006)));
		}
		if (spec.scenario === 'waist_check' && site === 'waist') {
			flag = 'check';
			reasons.push('scale_disagree');
		}
		if (spec.scenario === 'inleg_fail' && site === 'inleg') {
			flag = 'fail';
			value = null;
			reasons.push('crotch_not_found');
		}
		if (levelUnchecked && site !== 'stature') {
			flag = 'check';
			reasons.push('level_unchecked');
		}
		if (fit === 'loose' && ['chest', 'waist', 'hip', 'neck'].includes(site)) {
			flag = 'check';
			reasons.push('loose_clothing');
		}
		if (spec.scenario === 'marker_weak' && ['chest', 'waist', 'hip'].includes(site)) {
			flag = 'check';
			reasons.push('marker_weak');
		}
		const girth = ['chest', 'waist', 'hip', 'neck'].includes(site);
		return {
			site_code: site,
			value_mm: value,
			method: 'auto',
			confidence_flag: flag,
			flag_reasons: reasons,
			correction_factor: girth ? 1 : undefined,
			level_fraction: site === 'waist' ? 0.6 : site === 'chest' ? 0.25 : undefined,
			half_width_mm: girth && value ? Math.round(value / 6.2) : undefined,
			half_depth_mm: girth && value ? Math.round(value / 8.4) : undefined
		};
	});

	const session: CaptureSession = {
		session_id: uid(`${spec.label}-session`),
		started_at: iso(Date.parse(spec.captured_at) - 4 * 60_000),
		capture_mode: spec.capture_mode ?? 'self',
		device_model: ['TECNO KL8', 'SM-A165F', 'iPhone', 'Infinix X6528'][Math.floor(r() * 4)]!,
		os: 'Android 14',
		browser: 'Chrome 128',
		memory_gb: 4,
		model_variant: 'lite',
		stream_w: 1080,
		stream_h: 1920,
		still_source: 'imagecapture',
		level_unchecked: levelUnchecked,
		capture_fallback: false,
		front_checks: { ...PASS_CHECKS, level: levelUnchecked ? 'skipped' : 'pass' },
		side_checks: { ...PASS_CHECKS, level: levelUnchecked ? 'skipped' : 'pass' },
		scale_front_mm_px: scaleFront,
		scale_side_mm_px: +(scaleFront * (1 + (r() - 0.5) * 0.02)).toFixed(4),
		scale_stature_mm_px: +(scaleFront * (1 + disagreement / 100)).toFixed(4),
		scale_disagreement_pct: disagreement,
		processing_ms: Math.round(9000 + r() * 8000),
		retake_count: spec.scenario === 'waist_check' ? 1 : 0,
		config_hash: 'cfg-0a1b2c3d',
		study: spec.study
	};

	return {
		profile_id: uid(`${spec.label}-profile`),
		client_code: spec.client_code,
		version: spec.version,
		captured_at: spec.captured_at,
		status: 'final',
		rules_version: RULES_VERSION,
		covariates: {
			height_mm_entered: spec.height_mm,
			sex: spec.sex,
			clothing_fit: fit,
			code_verified: true
		},
		consent: {
			consent_version: spec.study ? 'study-paper-1.0' : CONSENT_VERSION,
			language: r() > 0.5 ? 'sw' : 'en',
			scope: spec.study ? ['study_paper'] : ['measure', 'measurements_only', 'retention'],
			given_at: iso(Date.parse(spec.captured_at) - 6 * 60_000)
		},
		session,
		landmarks_front: syntheticLandmarks('front', 0.49, r),
		landmarks_side: syntheticLandmarks('side', 0.49, r),
		marker_front: syntheticMarker(82, 540, 760, markerConf),
		marker_side: syntheticMarker(81, 560, 1010, markerConf),
		measurements,
		sync_status: spec.sync_status ?? 'synced',
		created_at: iso(Date.parse(spec.captured_at) + 2 * 60_000)
	};
}

/* ---------------- the seed ---------------- */

export function createSeed(now = Date.now()) {
	const ago = (d: number, h = 0) => iso(now - d * DAY - h * HOUR);
	const inDays = (d: number) => isoDate(now + d * DAY);

	const presets: EasePresets = {
		shirt: { chest: 100, waist: 80, shoulder: 10, sleeve: 20, neck: 20 },
		trousers: { waist: 20, hip: 40, outleg: 0, inleg: 0 }
	};
	const user = (
		label: string,
		email: string,
		role: Role,
		status: Account['status'],
		extra: Partial<MockUser> = {}
	): MockUser => ({
		user_id: uid(`user-${label}`),
		email,
		role,
		status,
		registered_at: ago(120 - email.length),
		password: DEMO_PASSWORD,
		locale: 'en',
		unit_pref: 'cm',
		include_name_default: false,
		ease_presets: {},
		...extra
	});

	const users: MockUser[] = [
		user('admin', 'admin@vt.test', 'admin', 'active'),
		user('wanjiru', 'wanjiru@vt.test', 'tailor', 'active', {
			business_name: 'Mama Wanjiru Tailors',
			phone: '+254712345678',
			area: 'Gikomba',
			locale: 'sw',
			ease_presets: presets
		}),
		user('otieno', 'otieno@vt.test', 'tailor', 'active', {
			business_name: 'Otieno Bespoke',
			phone: '+254722000111',
			area: 'CBD',
			unit_pref: 'in'
		}),
		user('pending', 'pending@vt.test', 'tailor', 'pending', {
			business_name: 'Kamau Fashions',
			phone: '+254733222333',
			area: 'Kawangware',
			registered_at: ago(1)
		}),
		user('disabled', 'disabled@vt.test', 'tailor', 'disabled', {
			business_name: 'Old Shop',
			phone: '+254700999888',
			area: 'Ngara'
		}),
		user('measurer-a', 'measurer-a@vt.test', 'measurer', 'active', {
			measurer_code: 'A',
			trained_on: inDays(-30)
		}),
		user('measurer-b', 'measurer-b@vt.test', 'measurer', 'active', {
			measurer_code: 'B',
			trained_on: inDays(-28)
		})
	];
	const wanjiru = users[1]!;
	const otieno = users[2]!;

	const client = (
		label: string,
		tailor: MockUser,
		code: string,
		name: string | null,
		height: number | null,
		createdDaysAgo: number
	): MockClient => ({
		client_id: uid(`client-${label}`),
		tailor_id: tailor.user_id,
		client_code: code,
		display_name: name,
		height_mm: height,
		created_at: ago(createdDaysAgo),
		old_codes: []
	});

	const clients: MockClient[] = [
		client('amina', wanjiru, 'AB1234', 'Amina', 1650, 40),
		client('baraka', wanjiru, 'KE2048', 'Baraka', 1780, 35),
		client('anon1', wanjiru, 'MW3310', null, null, 30),
		client('chebet', wanjiru, 'NR5521', 'Chebet', 1620, 25),
		client('anon2', wanjiru, 'GK7788', null, 1710, 20),
		client('dennis', wanjiru, 'DK4402', 'Dennis', 1820, 14),
		client('esther', wanjiru, 'ES9001', 'Esther', null, 6),
		client('anon3', wanjiru, 'QT1200', null, null, 1),
		client('fatuma', otieno, 'OB1001', 'Fatuma', 1680, 22),
		client('george', otieno, 'OB1002', 'George', 1750, 18),
		client('anon4', otieno, 'OB1003', null, null, 3)
	];
	const C = Object.fromEntries(clients.map((c) => [c.client_code, c]));

	const P = (
		label: string,
		code: string,
		version: number,
		daysAgo: number,
		sex: Sex,
		height: number,
		scenario: ProfileScenario,
		extra: Partial<ProfileSpec> = {}
	) => {
		const p = makeProfile({
			label,
			client_code: code,
			version,
			captured_at: ago(daysAgo, 3),
			sex,
			height_mm: height,
			scenario,
			...extra
		});
		p.client_id = C[code]!.client_id;
		return p;
	};

	// 12 server profiles covering every scenario in Section 20.4.
	const profiles: MeasurementProfile[] = [
		P('amina-v1', 'AB1234', 1, 30, 'female', 1650, 'all_pass'),
		P('amina-v2', 'AB1234', 2, 12, 'female', 1650, 'waist_check'),
		P('baraka-v1', 'KE2048', 1, 28, 'male', 1780, 'all_pass', { capture_mode: 'assisted' }),
		P('anon1-v1', 'MW3310', 1, 26, 'unspecified', 1700, 'inleg_fail'),
		P('chebet-v1', 'NR5521', 1, 20, 'female', 1620, 'level_unchecked'),
		P('anon2-v1', 'GK7788', 1, 15, 'male', 1710, 'loose'),
		P('dennis-v1', 'DK4402', 1, 10, 'male', 1820, 'all_pass'),
		// Conflict pair: v2 on the server, v3 arrived from the device (Section 20.4).
		P('dennis-v2', 'DK4402', 2, 4, 'male', 1820, 'all_pass', { sync_status: 'conflict' }),
		P('esther-v1', 'ES9001', 1, 2, 'female', 1590, 'marker_weak'),
		P('fatuma-v1', 'OB1001', 1, 19, 'female', 1680, 'all_pass'),
		P('george-v1', 'OB1002', 1, 16, 'male', 1750, 'waist_check'),
		P('george-v2', 'OB1002', 2, 3, 'male', 1750, 'all_pass')
	];
	const conflictDevice = P('dennis-v3-device', 'DK4402', 3, 1, 'male', 1820, 'waist_check', {
		sync_status: 'conflict'
	});
	// The device copy claims the same profile lineage (same profile_id as server v2).
	conflictDevice.profile_id = profiles[7]!.profile_id;
	const conflicts = new Map<string, MeasurementProfile>([
		[conflictDevice.profile_id, conflictDevice]
	]);

	const byLabel = (l: string) => profiles.find((p) => p.profile_id === uid(`${l}-profile`))!;

	let orderSeq = 224;
	const order = (
		label: string,
		profileLabel: string,
		garment: GarmentType,
		status: OrderStatus,
		dueInDays: number,
		createdDaysAgo: number,
		opts: { override?: SiteCode; notes?: string } = {}
	): Order => {
		const profile = byLabel(profileLabel);
		const c = clients.find((x) => x.client_id === profile.client_id)!;
		const flow: OrderStatus[] = ['new', 'cutting', 'fitting', 'ready', 'collected'];
		const history = flow
			.slice(0, flow.indexOf(status) + 1)
			.map((s, i) => ({ status: s, at: ago(createdDaysAgo - i * 2) }));
		const preset = (garment === 'shirt' || garment === 'trousers' ? presets[garment] : {}) ?? {};
		const items: OrderItem[] = GARMENT_SITES[garment].map((site) => {
			const m = profile.measurements.find((x) => x.site_code === site)!;
			const overridden = opts.override === site;
			const body = overridden ? (m.value_mm ?? 900) + 15 : m.value_mm;
			const ease = (preset as Record<string, number>)[site] ?? 0;
			return {
				site_code: site,
				body_mm: body,
				ease_mm: ease,
				overridden,
				override_reason: overridden ? 'Tape at fitting' : undefined,
				flag_confirmed: m.confidence_flag !== 'pass' && !overridden ? true : undefined,
				pending_fitting: false,
				finished_mm: body == null ? null : body + ease,
				confidence_flag: m.confidence_flag
			};
		});
		return {
			order_id: uid(`order-${label}`),
			order_no: `ORD-${String(++orderSeq).padStart(4, '0')}`,
			client_id: c.client_id,
			client_code: c.client_code,
			display_name: c.display_name ?? undefined,
			profile_id: profile.profile_id,
			profile_version: profile.version,
			garment_type: garment,
			status,
			due_date: inDays(dueInDays),
			notes: opts.notes ?? '',
			items,
			created_at: ago(createdDaysAgo),
			updated_at: history.at(-1)!.at,
			status_history: history
		};
	};

	const orders: Order[] = [
		order('o1', 'amina-v2', 'dress', 'new', 14, 2, { notes: 'Kitenge, puff sleeves' }),
		order('o2', 'baraka-v1', 'shirt', 'cutting', 6, 8),
		order('o3', 'anon1-v1', 'trousers', 'fitting', -2, 18, { override: 'inleg', notes: 'Overdue' }),
		order('o4', 'chebet-v1', 'skirt', 'ready', 3, 15),
		order('o5', 'anon2-v1', 'suit_jacket', 'collected', -10, 30),
		order('o6', 'dennis-v2', 'shirt', 'new', 21, 1),
		order('o7', 'esther-v1', 'dress', 'cutting', 10, 1),
		order('o8', 'amina-v1', 'skirt', 'collected', -20, 28),
		order('o9', 'fatuma-v1', 'dress', 'fitting', 5, 9),
		order('o10', 'george-v1', 'trousers', 'ready', 2, 12)
	];
	orderSeq = 233;

	const actions: AuditAction[] = [
		'login',
		'profile_view',
		'code_issue',
		'status_change',
		'share',
		'override',
		'export',
		'deletion',
		'approve',
		'settings_change'
	];
	const r = prng(2026);
	const audit: AuditEntry[] = Array.from({ length: 40 }, (_, i) => {
		const tailorish = i % 5 !== 4;
		const u = tailorish ? (i % 3 === 2 ? otieno : wanjiru) : users[0]!;
		const action: AuditAction = tailorish
			? actions[Math.floor(r() * 7)]!
			: (['approve', 'settings_change', 'export', 'login'] as AuditAction[])[i % 4]!;
		const o = orders[i % orders.length]!;
		const entity =
			action === 'profile_view' || action === 'override'
				? {
						entity_type: 'profile',
						entity_id: o.profile_id,
						summary: `Profile ${o.client_code} v${o.profile_version}`
					}
				: action === 'code_issue'
					? { entity_type: 'client', entity_id: o.client_id, summary: `Code ${o.client_code}` }
					: action === 'approve'
						? { entity_type: 'account', entity_id: otieno.user_id, summary: 'otieno@vt.test' }
						: action === 'settings_change'
							? { entity_type: 'settings', entity_id: 'retention', summary: 'Retention 24 months' }
							: action === 'login'
								? { entity_type: 'session', entity_id: u.user_id, summary: 'Signed in' }
								: action === 'export'
									? { entity_type: 'export', entity_id: 'audit.csv', summary: 'Audit CSV' }
									: { entity_type: 'order', entity_id: o.order_id, summary: `Order ${o.order_no}` };
		return {
			log_id: uid(`audit-${i}`),
			occurred_at: ago(Math.floor(i / 2), (i * 5) % 24),
			user_email: u.email,
			role: u.role,
			action,
			...entity
		};
	});

	const participants: MockParticipant[] = (
		[
			['P001', 'female', '25-34', 'MKU Thika'],
			['P002', 'male', '18-24', 'MKU Thika'],
			['P003', 'female', '35-44', 'Gikomba market'],
			['P004', 'male', '45-54', 'Gikomba market'],
			['P005', 'female', '55+', 'MKU Thika']
		] as const
	).map(([code, sex, age, venue], i) => {
		const c = client(`study-${code}`, users[0]!, `SP${String(1001 + i)}`, null, null, 10 - i);
		clients.push(c);
		return {
			participant_id: uid(`participant-${code}`),
			participant_code: code,
			sex,
			age_band: age,
			venue,
			client_code: c.client_code,
			client_id: c.client_id,
			enrolled_at: ago(10 - i)
		};
	});

	// Study captures: P001 three sets, P002 two, P003 one.
	const studyProfiles: MeasurementProfile[] = [];
	const setSpec: [string, number][] = [
		['P001', 3],
		['P002', 2],
		['P003', 1]
	];
	for (const [code, sets] of setSpec) {
		const part = participants.find((p) => p.participant_code === code)!;
		for (let s = 1; s <= sets; s++) {
			const p = makeProfile({
				label: `study-${code}-${s}`,
				client_code: part.client_code,
				version: s,
				captured_at: ago(8 - s),
				sex: part.sex,
				height_mm: part.sex === 'female' ? 1630 : 1760,
				scenario: 'all_pass',
				capture_mode: s === 2 ? 'assisted' : 'self',
				study: {
					participant_code: code,
					set_no: s as 1 | 2 | 3,
					lighting: (['window', 'lamp', 'outdoor'] as const)[s - 1]!,
					distance_m: 2.3,
					clothing_fit_observed: 'fitted',
					lux: 180 + s * 40
				}
			});
			p.client_id = part.client_id;
			studyProfiles.push(p);
		}
	}
	profiles.push(...studyProfiles);

	const reading = (
		code: string,
		measurer: 'A' | 'B',
		no: 1 | 2,
		sites: SiteCode[],
		height: number
	): MockReading => {
		const rr = prng(code.charCodeAt(3) * 31 + no * 7 + measurer.charCodeAt(0));
		const base = bodyFromHeight(height, 'female', rr);
		return {
			reading_id: uid(`reading-${code}-${measurer}-${no}`),
			participant_code: code,
			measurer_code: measurer,
			reading_no: no,
			values: Object.fromEntries(sites.map((s) => [s, base[s]])),
			taken_at: ago(7, no),
			out_of_order: false
		};
	};
	const allSites: SiteCode[] = [
		'stature',
		'shoulder',
		'chest',
		'waist',
		'hip',
		'sleeve',
		'outleg',
		'inleg',
		'neck'
	];
	const readings: MockReading[] = [
		reading('P001', 'A', 1, allSites, 1630),
		reading('P001', 'A', 2, allSites, 1630),
		reading('P001', 'B', 1, allSites, 1630),
		reading('P001', 'B', 2, allSites, 1630),
		reading('P002', 'A', 1, allSites, 1760),
		reading('P002', 'B', 1, allSites.slice(0, 5), 1760)
	];

	const deletionRequests: DeletionRequest[] = [
		{
			request_id: uid('del-1'),
			client_code: 'MW3310',
			profile_ids: [uid('anon1-v0-profile')],
			reason: 'delete',
			received_at: ago(9),
			status: 'completed',
			completed_at: ago(8)
		},
		{
			request_id: uid('del-2'),
			client_code: 'GK7788',
			profile_ids: [uid('anon2-v0-profile')],
			reason: 'withdraw_consent',
			received_at: ago(0, 5),
			status: 'received'
		}
	];

	return {
		now,
		settings: {
			study_mode: true,
			consent_version: CONSENT_VERSION,
			min_app_version: '0.0.1',
			retention_months: 24
		},
		users,
		clients,
		profiles,
		conflicts,
		orders,
		sheets: [] as MockSheet[],
		audit,
		participants,
		readings,
		deletionRequests,
		tokens: new Map<string, { user_id: string; expires_at: number }>(),
		loginAttempts: new Map<string, { count: number; until: number }>(),
		seq: { order: orderSeq, code: 0 }
	};
}

export type Seed = ReturnType<typeof createSeed>;
