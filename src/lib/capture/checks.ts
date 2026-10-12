/**
 * Live capture checks (Section 10.3), pure and unit-tested. The vision worker
 * reduces each frame to a LiveFrame (numbers only); evaluate() turns it into
 * check states and the single highest-priority correction.
 */
import type { Landmark } from '$lib/api/types';
import { CAPTURE_CONFIG, type CaptureConfig } from './config';

export type View = 'front' | 'side';
export type CheckId =
	| 'level'
	| 'person'
	| 'frame'
	| 'distance'
	| 'symmetry'
	| 'arms'
	| 'marker'
	| 'light'
	| 'stability';
export const PRIORITY: CheckId[] = [
	'level',
	'person',
	'frame',
	'distance',
	'symmetry',
	'arms',
	'marker',
	'light',
	'stability'
];
export type RawState = 'pass' | 'fail' | 'pending';

/** Correction message keys (client i18n module). */
export type CorrectionKey =
	| 'capture.msg.level'
	| 'capture.msg.stepInto'
	| 'capture.msg.headCut'
	| 'capture.msg.feetCut'
	| 'capture.msg.sideCut'
	| 'capture.msg.tooFar'
	| 'capture.msg.tooClose'
	| 'capture.msg.faceCamera'
	| 'capture.msg.turnRight'
	| 'capture.msg.armsAway'
	| 'capture.msg.armsForward'
	| 'capture.msg.sheetFlat'
	| 'capture.msg.fingersOff'
	| 'capture.msg.stepCloserSheet'
	| 'capture.msg.tooDark'
	| 'capture.msg.tooBright'
	| 'capture.msg.holdStill';

/** Everything the checks need from one live frame; no pixels. */
export interface LiveFrame {
	t: number;
	orientation: { beta: number; gamma: number } | null;
	levelUnchecked: boolean;
	/** 33 normalised landmarks or null when no pose. */
	landmarks: Landmark[] | null;
	/** Person mask bounding box, normalised 0..1. */
	maskBox: { top: number; bottom: number; left: number; right: number } | null;
	/** Front: mask merges arm and torso at the waist row (left/right of image). */
	armMerge: { left: boolean; right: boolean } | null;
	/** Marker in pixels at the resolution used for scale, or null. */
	marker: { found: boolean; sidePx: number; ratio: number; occluded: boolean } | null;
	/** Mean luminance of the person box (0–255) and variance of the Laplacian. */
	luminance: number | null;
	sharpness: number | null;
	/** Stream height in px (distance thresholds scale with it). */
	streamH: number;
	/** iOS: no ImageCapture still, marker size judged on stream frames. */
	stillAvailable: boolean;
}

export interface CheckResult {
	states: Record<CheckId, RawState>;
	corrections: Partial<Record<CheckId, CorrectionKey>>;
	/** Mask height as a fraction of frame height (for tuning). */
	heightFrac: number | null;
}

const vis = (l: Landmark[], i: number) => l[i]?.visibility ?? 0;
const dist = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y);

export function evaluate(
	f: LiveFrame,
	view: View,
	history: LiveFrame[] = [],
	cfg: CaptureConfig = CAPTURE_CONFIG
): CheckResult {
	const states = Object.fromEntries(PRIORITY.map((c) => [c, 'pending'])) as Record<
		CheckId,
		RawState
	>;
	const corrections: CheckResult['corrections'] = {};
	const fail = (c: CheckId, key: CorrectionKey) => {
		states[c] = 'fail';
		corrections[c] = key;
	};

	// 1 Level (C1)
	if (f.levelUnchecked) states.level = 'pass';
	else if (f.orientation) {
		const { beta, gamma } = f.orientation;
		const ok =
			beta >= cfg.level.betaMin &&
			beta <= cfg.level.betaMax &&
			Math.abs(gamma) <= cfg.level.gammaMax;
		if (ok) states.level = 'pass';
		else fail('level', 'capture.msg.level');
	}

	// 2 Person found
	const L = f.landmarks;
	if (!L) fail('person', 'capture.msg.stepInto');
	else {
		const p = cfg.person;
		const ok =
			view === 'front'
				? p.front.every((i) => vis(L, i) >= p.minVisibility) &&
					p.frontHeelsAnyOf.some((i) => vis(L, i) >= p.minVisibility)
				: p.side.every((i) => vis(L, i) >= p.minVisibility);
		if (ok) states.person = 'pass';
		else fail('person', 'capture.msg.stepInto');
	}

	// 3 Whole body in frame
	const b = f.maskBox;
	let heightFrac: number | null = null;
	if (b) {
		heightFrac = b.bottom - b.top;
		const heelsY = L ? Math.max(L[29]?.y ?? 0, L[30]?.y ?? 0) : 0;
		if (b.top < cfg.frame.topMarginMin) fail('frame', 'capture.msg.headCut');
		else if (b.bottom > cfg.frame.bottomMax || heelsY > cfg.frame.bottomMax)
			fail('frame', 'capture.msg.feetCut');
		else if (b.left < cfg.frame.sideMarginMin || b.right > 1 - cfg.frame.sideMarginMin)
			fail('frame', 'capture.msg.sideCut');
		else states.frame = 'pass';

		// 4 Distance (C2): proportional to the delivered stream height.
		if (heightFrac < cfg.distance.minFrac) fail('distance', 'capture.msg.tooFar');
		else if (heightFrac > cfg.distance.maxFrac) fail('distance', 'capture.msg.tooClose');
		else states.distance = 'pass';
	}

	if (L && states.person === 'pass') {
		const personH = heightFrac ?? Math.abs((L[29]?.y ?? 1) - (L[0]?.y ?? 0));
		// 5 Facing / profile
		if (view === 'front') {
			const r = dist(L[11]!, L[23]!) / Math.max(1e-6, dist(L[12]!, L[24]!));
			if (Math.abs(r - 1) <= cfg.symmetry.frontRatioTol) states.symmetry = 'pass';
			else fail('symmetry', 'capture.msg.faceCamera');
		} else {
			const sh = Math.abs(L[11]!.x - L[12]!.x);
			const hp = Math.abs(L[23]!.x - L[24]!.x);
			const max = cfg.symmetry.sideGapMaxFrac * personH;
			if (sh <= max && hp <= max) states.symmetry = 'pass';
			else fail('symmetry', 'capture.msg.turnRight');
		}

		// 6 Arms
		if (view === 'front') {
			const shoulderW = Math.abs(L[11]!.x - L[12]!.x);
			const min = cfg.arms.wristHipMinShoulderFrac * shoulderW;
			const gapL = Math.abs(L[15]!.x - L[23]!.x);
			const gapR = Math.abs(L[16]!.x - L[24]!.x);
			const merged = f.armMerge ? f.armMerge.left || f.armMerge.right : false;
			if (gapL >= min && gapR >= min && !merged) states.arms = 'pass';
			else fail('arms', 'capture.msg.armsAway');
		} else {
			// Facing right in the image, "forward" is +x. Wrist must be ahead of the hip.
			const wrist = vis(L, 16) >= vis(L, 15) ? L[16]! : L[15]!;
			const hip = vis(L, 24) >= vis(L, 23) ? L[24]! : L[23]!;
			const facing = (L[0]?.x ?? hip.x) >= hip.x ? 1 : -1;
			if ((wrist.x - hip.x) * facing > 0) states.arms = 'pass';
			else fail('arms', 'capture.msg.armsForward');
		}
	}

	// 7 Sheet found
	const m = f.marker;
	if (m) {
		if (!m.found) fail('marker', m.occluded ? 'capture.msg.fingersOff' : 'capture.msg.sheetFlat');
		else if (m.ratio > cfg.marker.maxSideRatio) fail('marker', 'capture.msg.sheetFlat');
		else if (m.sidePx < cfg.marker.minSidePx)
			fail('marker', f.stillAvailable ? 'capture.msg.sheetFlat' : 'capture.msg.stepCloserSheet');
		else states.marker = 'pass';
	}

	// 8 Light and sharp
	if (f.luminance != null) {
		if (f.luminance < cfg.light.lumMin) fail('light', 'capture.msg.tooDark');
		else if (f.luminance > cfg.light.lumMax) fail('light', 'capture.msg.tooBright');
		else if (f.sharpness != null && f.sharpness < cfg.light.blurMin)
			fail('light', 'capture.msg.holdStill');
		else states.light = 'pass';
	}

	// 9 Stability: landmark jitter over the last N samples < 1% of person height.
	const recent = [...history.slice(-(cfg.stability.samples - 1)), f].filter((x) => x.landmarks);
	if (recent.length >= Math.min(cfg.stability.samples, 3) && L) {
		const personH = heightFrac ?? 0.5;
		let maxJ = 0;
		for (const i of [0, 11, 12, 23, 24]) {
			const xs = recent.map((r) => r.landmarks![i]!.x);
			const ys = recent.map((r) => r.landmarks![i]!.y);
			maxJ = Math.max(maxJ, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
		}
		if (maxJ < cfg.stability.maxJitterFrac * personH) states.stability = 'pass';
		else fail('stability', 'capture.msg.holdStill');
	}

	return { states, corrections, heightFrac };
}

/** The single highest-priority correction (UX principle 2). */
export function topCorrection(
	r: Pick<CheckResult, 'states' | 'corrections'>
): { check: CheckId; key: CorrectionKey } | null {
	for (const c of PRIORITY) if (r.states[c] === 'fail') return { check: c, key: r.corrections[c]! };
	return null;
}

export function allPass(states: Record<CheckId, RawState>): boolean {
	return PRIORITY.every((c) => states[c] === 'pass');
}

/**
 * Hysteresis (10.3): a check must hold its new state for ≥ 300 ms before the UI
 * flips, and a message stays at least 1.5 s unless its problem is fixed.
 */
export class Debouncer {
	private shown = {} as Record<CheckId, RawState>;
	private candidate = {} as Record<CheckId, { state: RawState; since: number }>;
	private message: { check: CheckId; key: CorrectionKey; since: number } | null = null;

	constructor(private cfg: CaptureConfig = CAPTURE_CONFIG) {
		for (const c of PRIORITY) this.shown[c] = 'pending';
	}

	update(
		r: CheckResult,
		now: number
	): { states: Record<CheckId, RawState>; message: { check: CheckId; key: CorrectionKey } | null } {
		for (const c of PRIORITY) {
			const raw = r.states[c];
			if (raw === this.shown[c]) {
				delete this.candidate[c];
				continue;
			}
			const cand = this.candidate[c];
			if (!cand || cand.state !== raw) this.candidate[c] = { state: raw, since: now };
			else if (now - cand.since >= this.cfg.timing.hysteresisMs) {
				this.shown[c] = raw;
				delete this.candidate[c];
			}
		}
		const top = topCorrection({ states: this.shown, corrections: r.corrections });
		const current = this.message;
		if (
			current &&
			this.shown[current.check] === 'fail' &&
			now - current.since < this.cfg.timing.messageMinMs
		) {
			// Keep the current message for its minimum time; the problem is not fixed yet.
		} else if (!top) this.message = null;
		else if (!current || current.key !== top.key) this.message = { ...top, since: now };
		return {
			states: { ...this.shown },
			message: this.message ? { check: this.message.check, key: this.message.key } : null
		};
	}

	reset() {
		for (const c of PRIORITY) this.shown[c] = 'pending';
		this.candidate = {} as typeof this.candidate;
		this.message = null;
	}
}

/** The seven UI rows (9.7): Person folds into Frame; Stability shows only as "Hold still". */
export function uiRows(states: Record<CheckId, RawState>) {
	const frame: RawState =
		states.person === 'fail' || states.frame === 'fail'
			? 'fail'
			: states.person === 'pass' && states.frame === 'pass'
				? 'pass'
				: 'pending';
	const light: RawState = states.light;
	return {
		level: states.level,
		frame,
		distance: states.distance,
		symmetry: states.symmetry,
		arms: states.arms,
		marker: states.marker,
		light
	};
}
