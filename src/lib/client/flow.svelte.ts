/**
 * Client capture flow state (Section 9). The draft (code, height, sex, fit) and
 * consent are mirrored to Dexie settings so a reload loses nothing; captured
 * views live in memory only and are released by releaseCaptures() (2.1.2).
 */
import type { CaptureSession, ClothingFit, ConsentRecord, Sex, ViewChecks } from '$lib/api/types';
import { getSetting, setSetting, deleteSettings } from '$lib/db/settings';
import type { NewProfile } from '$lib/db/profiles';
import type { PreflightResult } from '$lib/device/preflight';
import type { View } from '$lib/capture/checks';
import type { MeasureResult } from '$lib/measure';
import type { ViewCapture } from '$lib/vision/types';

export const draft = $state({
	loaded: false,
	client_code: '',
	code_verified: false,
	tailor_name: null as string | null,
	height_cm: null as number | null,
	height_from_tailor: false,
	sex: undefined as Sex | undefined,
	fit: 'fitted' as ClothingFit,
	consent: null as ConsentRecord | null,
	capture_mode: 'self' as 'self' | 'assisted',
	level_unchecked: false,
	print_check_ok: false,
	preflight: null as PreflightResult | null,
	audio_muted: false
});

export const capture = $state({
	session_id: '',
	started_at: '',
	stream: { w: 1080, h: 1920 },
	lens_note: '' as string,
	still_source: 'canvas' as CaptureSession['still_source'],
	capture_fallback: false,
	retake_count: 0,
	retaking: null as View | null,
	front: null as ViewCapture | null,
	side: null as ViewCapture | null,
	result: null as MeasureResult | null,
	processing_ms: 0,
	/** Shutter time of the most recent burst (ms epoch). */
	burst_done_at: 0,
	model_variant: 'lite' as CaptureSession['model_variant']
});

/** Dev-only counter of live capture buffers, read by the memory privacy test. */
export function liveCaptureBuffers(): number {
	return [capture.front, capture.side].filter((v) => v?.data.mask.data.length).length;
}

// Dev builds expose the counter to Playwright (Section 21.1 memory test).
if (import.meta.env.DEV && typeof window !== 'undefined') {
	void import('$lib/vision/imageOps').then(({ liveBitmaps }) => {
		(window as unknown as { __vt?: Record<string, unknown> }).__vt = {
			liveCaptureBuffers,
			liveBitmaps
		};
	});
}

export async function loadDraft(): Promise<void> {
	if (draft.loaded) return;
	const [code, verified, h, sex, fit, consent, mode, pc, pre, muted] = await Promise.all([
		getSetting('client_code'),
		getSetting('code_verified'),
		getSetting('height_mm'),
		getSetting('sex'),
		getSetting('clothing_fit'),
		getSetting('consent'),
		getSetting('capture_mode'),
		getSetting('print_check_ok'),
		getSetting('preflight'),
		getSetting('audio_muted')
	]);
	if (code && !draft.client_code) draft.client_code = code;
	draft.code_verified = !!verified;
	if (h && draft.height_cm == null) draft.height_cm = Math.round(h / 10);
	if (sex && !draft.sex) draft.sex = sex;
	if (fit) draft.fit = fit;
	if (consent && !consent.withdrawn_at) draft.consent = consent;
	if (mode) draft.capture_mode = mode;
	draft.print_check_ok = !!pc;
	draft.preflight = (pre as PreflightResult) ?? null;
	draft.audio_muted = !!muted;
	draft.loaded = true;
}

/** Persist the details form (never a name). */
export async function saveDetails(): Promise<void> {
	await Promise.all([
		setSetting('client_code', draft.client_code),
		setSetting('code_verified', draft.code_verified),
		draft.height_cm != null ? setSetting('height_mm', draft.height_cm * 10) : Promise.resolve(),
		draft.sex ? setSetting('sex', draft.sex) : Promise.resolve(),
		setSetting('clothing_fit', draft.fit)
	]);
}

export async function recordConsent(c: ConsentRecord): Promise<void> {
	draft.consent = c;
	await setSetting('consent', c);
}

export async function clearDetails(): Promise<void> {
	await deleteSettings([
		'client_code',
		'code_verified',
		'height_mm',
		'sex',
		'clothing_fit',
		'consent'
	]);
	Object.assign(draft, {
		client_code: '',
		code_verified: false,
		tailor_name: null,
		height_cm: null,
		height_from_tailor: false,
		sex: undefined,
		fit: 'fitted',
		consent: null
	});
}

export function newSession(): void {
	capture.session_id = crypto.randomUUID();
	capture.started_at = new Date().toISOString();
	capture.retake_count = 0;
	capture.retaking = null;
	capture.result = null;
	releaseCaptures();
}

/**
 * Privacy invariant 2: drop every reference to captured data. Masks are kept
 * until the review ends so a single-view retake can recompute (design-notes);
 * they never leave memory.
 */
export function releaseCaptures(view?: View): void {
	for (const v of view ? [view] : (['front', 'side'] as const)) {
		const c = capture[v];
		if (c) c.data.mask.data = new Uint8Array(0);
		capture[v] = null;
	}
}

export function resetCaptureFlow(): void {
	releaseCaptures();
	capture.result = null;
	capture.retaking = null;
}

const NO_CHECKS: ViewChecks = {
	level: 'skipped',
	frame: 'skipped',
	distance: 'skipped',
	symmetry: 'skipped',
	arms: 'skipped',
	marker: 'skipped',
	light: 'skipped',
	sharpness: 'skipped'
};

/** Builds the payload (Section 20.3) from the draft, captures and result. */
export function buildProfile(opts: {
	config_hash: string;
	study?: CaptureSession['study'];
	consentOverride?: ConsentRecord;
}): NewProfile {
	const r = capture.result!;
	const pre = draft.preflight;
	const session: CaptureSession = {
		session_id: capture.session_id || crypto.randomUUID(),
		started_at: capture.started_at || new Date().toISOString(),
		capture_mode: draft.capture_mode,
		device_model: pre?.device.device_model ?? 'unknown',
		os: pre?.device.os ?? 'unknown',
		browser: pre?.device.browser ?? 'unknown',
		memory_gb: pre?.device.memory_gb ?? null,
		model_variant: capture.model_variant,
		stream_w: capture.stream.w,
		stream_h: capture.stream.h,
		still_source: capture.still_source,
		level_unchecked: draft.level_unchecked,
		capture_fallback: capture.capture_fallback,
		front_checks: capture.front?.checks ?? NO_CHECKS,
		side_checks: capture.side?.checks ?? NO_CHECKS,
		scale_front_mm_px: r.scale_front_mm_px,
		scale_side_mm_px: r.scale_side_mm_px,
		scale_stature_mm_px: r.scale_stature_mm_px,
		scale_disagreement_pct: r.scale_disagreement_pct,
		processing_ms: capture.processing_ms,
		retake_count: capture.retake_count,
		config_hash: opts.config_hash,
		...(opts.study ? { study: opts.study } : {})
	};
	const empty = {
		corners: [] as [number, number][],
		image_w: 0,
		image_h: 0,
		side_px: 0,
		confidence: 0
	};
	// Plain data only: $state proxies cannot be structured-cloned into IndexedDB.
	return $state.snapshot({
		profile_id: crypto.randomUUID(),
		client_code: draft.client_code,
		captured_at: new Date(capture.burst_done_at || Date.now()).toISOString(),
		status: 'final',
		rules_version: r.rules_version,
		covariates: {
			height_mm_entered: (draft.height_cm ?? 0) * 10,
			sex: draft.sex ?? 'unspecified',
			clothing_fit: draft.fit,
			code_verified: draft.code_verified
		},
		consent: opts.consentOverride ?? draft.consent!,
		session,
		// Only numbers and coordinates leave the device (2.1.1).
		landmarks_front: (capture.front?.data.landmarks ?? []).map(round),
		landmarks_side: (capture.side?.data.landmarks ?? []).map(round),
		marker_front: capture.front?.data.marker ?? empty,
		marker_side: capture.side?.data.marker ?? empty,
		measurements: r.measurements
	}) as NewProfile;
}

function round(l: { x: number; y: number; z: number; visibility: number }) {
	const r5 = (v: number) => Math.round(v * 1e5) / 1e5;
	return { x: r5(l.x), y: r5(l.y), z: r5(l.z), visibility: r5(l.visibility) };
}
