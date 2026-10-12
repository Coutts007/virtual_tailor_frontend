/**
 * Synthetic bodies for tests and the FakeVisionWorker (Section 11.4, 20.4).
 * Draws front and side silhouettes from elliptical torso cross-sections, so the
 * ellipse girth of the true half-width a and half-depth b equals the chosen
 * girth, with consistent MediaPipe landmarks and a 150 mm marker. Orthographic
 * projection at a pixel scale set by the distance (1.70 m ≈ 943 px tall on a
 * 1920-tall frame at 2.5 m). O(pixels): one pass per mask row.
 */
import type { Landmark, MarkerObs, Sex } from '$lib/api/types';
import { ellipsePerimeter } from './girth';
import { DEFAULT_RULES } from './rules';
import type { ViewInput } from './types';

export interface SyntheticBody {
	height_mm: number;
	sex: Sex;
	shoulder_mm: number;
	chest_mm: number;
	waist_mm: number;
	hip_mm: number;
	neck_mm: number;
	sleeve_mm: number;
	inleg_mm: number;
	/** Floor to the rule's waist level (Section 11.2: outleg = waist level to mask bottom). */
	outleg_mm: number;
}

export interface SynthOptions {
	frameW?: number;
	frameH?: number;
	distance_m?: number;
	maskScale?: number;
	legGap?: boolean;
	armsOut?: boolean;
	/** Override the marker side in frame px (to simulate a mis-scaled sheet). */
	markerSidePx?: number;
	/** Landmark jitter in frame px (uniform ±noise). */
	noise?: number;
	seed?: number;
}

export function defaultBody(height_mm: number, sex: Sex): SyntheticBody {
	const f = sex === 'female';
	const H = height_mm;
	return {
		height_mm: H,
		sex,
		shoulder_mm: Math.round(H * (f ? 0.236 : 0.246)),
		chest_mm: Math.round(H * (f ? 0.56 : 0.56)),
		waist_mm: Math.round(H * (f ? 0.46 : 0.48)),
		hip_mm: Math.round(H * (f ? 0.6 : 0.56)),
		neck_mm: Math.round(H * (f ? 0.2 : 0.22)),
		sleeve_mm: Math.round(H * 0.345),
		inleg_mm: Math.round(H * 0.455),
		outleg_mm: Math.round(H * 0.627)
	};
}

/** Pixel scale: 943 px for 1.70 m at 2.5 m on a 1920-tall frame. */
export const FOCAL_1920 = (943 * 2500) / 1700;

/** Half-depth b for girth P when a = r·b (ellipse). */
function halfDepth(P: number, r: number) {
	return P / ellipsePerimeter(r, 1);
}

interface Section {
	h: number;
	a: number;
	b: number;
}

function interp(sections: Section[], h: number, key: 'a' | 'b'): number {
	for (let i = 0; i < sections.length - 1; i++) {
		const lo = sections[i]!;
		const hi = sections[i + 1]!;
		if (h >= lo.h && h <= hi.h) {
			const t = (h - lo.h) / (hi.h - lo.h || 1);
			return lo[key] + t * (hi[key] - lo[key]);
		}
	}
	return NaN;
}

function prng(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Body levels in mm above the floor, derived so the rules land on the chosen values. */
export function bodyLevels(body: SyntheticBody) {
	const H = body.height_mm;
	const shoulder = 0.818 * H;
	// Waist level = shoulder − waist_level·span must sit at outleg_mm above the floor.
	const hip = Math.min(
		shoulder - (shoulder - body.outleg_mm) / DEFAULT_RULES.waist_level,
		body.outleg_mm - 1
	);
	const span = shoulder - hip;
	const knee = 0.285 * H;
	return {
		H,
		headHalf: 0.065 * H,
		headC: H - 0.065 * H,
		mouth: 0.9 * H,
		nose: 0.92 * H,
		eyes: 0.936 * H,
		ears: 0.93 * H,
		neckBase: shoulder + 0.025 * H,
		shoulder,
		armpit: shoulder - 0.04 * H,
		chest: shoulder - DEFAULT_RULES.chest_level[body.sex] * span,
		waist: body.outleg_mm,
		hip,
		hipLevel: hip - 0.1 * (hip - knee),
		crotch: Math.min(body.inleg_mm, hip - 0.1 * (hip - knee) - 20),
		knee,
		ankle: 0.045 * H,
		heel: 0.01 * H
	};
}

export function synthesizeView(
	body: SyntheticBody,
	view: 'front' | 'side',
	opts: SynthOptions = {}
): { input: ViewInput; truth: Record<string, number> } {
	const frameW = opts.frameW ?? 1080;
	const frameH = opts.frameH ?? 1920;
	const k = (FOCAL_1920 * (frameH / 1920)) / ((opts.distance_m ?? 2.3) * 1000); // px per mm
	const s = opts.maskScale ?? 1;
	const legGap = opts.legGap ?? true;
	const armsOut = opts.armsOut ?? true;
	const L = bodyLevels(body);
	const H = L.H;

	const rChest = 1.4;
	const rWaist = 1.3;
	const rHip = 1.3;
	const rNeck = 1.1;
	const bc = halfDepth(body.chest_mm, rChest);
	const bw = halfDepth(body.waist_mm, rWaist);
	const bh = halfDepth(body.hip_mm, rHip);
	const bn = halfDepth(body.neck_mm, rNeck);
	const [ac, aw, ah, an] = [bc * rChest, bw * rWaist, bh * rHip, bn * rNeck];
	const shoulderHalf = body.shoulder_mm / 2;

	const torso: Section[] = [
		{ h: L.crotch, a: ah * 0.95, b: bh * 0.9 },
		{ h: L.hipLevel, a: ah, b: bh },
		{ h: L.waist, a: aw, b: bw },
		{ h: L.chest, a: ac, b: bc },
		{ h: L.armpit, a: ac * 0.98, b: bc * 0.95 },
		{ h: L.shoulder, a: shoulderHalf + 25, b: bc * 0.8 },
		{ h: L.neckBase, a: an, b: bn }
	];

	// Legs (front): inner edges a fixed gap apart; outer edge meets the torso at the crotch.
	const gapHalf = legGap ? 6 : -3;
	const thighHW = (ah * 0.95 - gapHalf) / 2;
	const ankleHW = 32;
	const legHW = (h: number) =>
		h >= L.ankle ? ankleHW + ((h - L.ankle) / (L.crotch - L.ankle)) * (thighHW - ankleHW) : 40;
	const legOffset = (h: number) => gapHalf + legHW(Math.max(h, L.ankle));

	// Arms (front): 30° out (or 3° when not out), upper 56 % of the sleeve.
	const theta = ((armsOut ? 30 : 3) * Math.PI) / 180;
	const upper = body.sleeve_mm * 0.56;
	const fore = body.sleeve_mm - upper;
	const elbow = {
		x: shoulderHalf + upper * Math.sin(theta),
		h: L.shoulder - upper * Math.cos(theta)
	};
	const wrist = { x: elbow.x + fore * Math.sin(theta), h: elbow.h - fore * Math.cos(theta) };
	const armSegs = [
		{ p: { x: shoulderHalf, h: L.shoulder }, q: elbow, t: 45 },
		{ p: elbow, q: wrist, t: 35 }
	];

	const maskW = Math.round(frameW * s);
	const maskH = Math.round(frameH * s);
	const data = new Uint8Array(maskW * maskH);
	const cxPx = frameW / 2;
	const floorPx = (frameH + H * k) / 2;
	const toX = (mm: number) => cxPx + mm * k;
	const toY = (h: number) => floorPx - h * k;

	/** Fill [x0, x1] (mm) on mask row y. */
	const fill = (row: number, x0: number, x1: number) => {
		const c0 = Math.max(0, Math.ceil(toX(x0) * s - 0.5));
		const c1 = Math.min(maskW - 1, Math.floor(toX(x1) * s - 0.5));
		data.fill(1, row * maskW + c0, row * maskW + c1 + 1);
	};

	for (let row = 0; row < maskH; row++) {
		const h = (floorPx - (row + 0.5) / s) / k;
		if (h < 0 || h > H) continue;
		const side = view === 'side';
		// Head (ellipse) and neck (runs up into the head so the union never pinches).
		const dh = (h - L.headC) / L.headHalf;
		if (Math.abs(dh) <= 1) {
			const hw = (side ? 95 : 75) * Math.sqrt(1 - dh * dh);
			fill(row, side ? -hw - 10 : -hw, side ? hw - 10 : hw);
		}
		if (h >= L.neckBase && h <= L.headC) fill(row, -(side ? bn : an), side ? bn : an);
		// Torso.
		if (h >= L.crotch && h <= L.neckBase) {
			const w = interp(torso, h, side ? 'b' : 'a');
			fill(row, -w, w);
		}
		if (side) {
			// Legs overlap in profile; feet point forward (image left).
			if (h < L.crotch && h >= L.ankle) {
				const t = (h - L.ankle) / (L.crotch - L.ankle);
				const hw = 45 + t * (bh * 0.9 - 45);
				fill(row, -hw, hw);
			} else if (h < L.ankle) fill(row, -200, 45);
			continue;
		}
		if (h < L.crotch) {
			const hw = legHW(h);
			const o = legOffset(h);
			fill(row, o - hw, o + hw);
			fill(row, -o - hw, -o + hw);
		}
		for (const { p, q, t } of armSegs) {
			if (h > p.h || h < q.h) continue;
			const f = (p.h - h) / (p.h - q.h);
			const x = p.x + f * (q.x - p.x);
			const half = t / Math.cos(theta);
			fill(row, x - half, x + half);
			fill(row, -x - half, -x + half);
		}
	}

	// Landmarks (MediaPipe indices), normalised to the frame.
	const rand = prng(opts.seed ?? 1);
	const noise = opts.noise ?? 0;
	const lm = (xmm: number, h: number, v = 0.95): Landmark => ({
		x: (toX(xmm) + (rand() - 0.5) * 2 * noise) / frameW,
		y: (toY(h) + (rand() - 0.5) * 2 * noise) / frameH,
		z: 0,
		visibility: v
	});
	const landmarks: Landmark[] = [];
	if (view === 'front') {
		// Subject's left (odd indices) appears on the image right.
		landmarks[0] = lm(0, L.nose);
		[1, 2, 3].forEach((i, j) => (landmarks[i] = lm(15 + j * 12, L.eyes)));
		[4, 5, 6].forEach((i, j) => (landmarks[i] = lm(-15 - j * 12, L.eyes)));
		landmarks[7] = lm(70, L.ears);
		landmarks[8] = lm(-70, L.ears);
		landmarks[9] = lm(25, L.mouth);
		landmarks[10] = lm(-25, L.mouth);
		landmarks[11] = lm(shoulderHalf, L.shoulder);
		landmarks[12] = lm(-shoulderHalf, L.shoulder);
		landmarks[13] = lm(elbow.x, elbow.h);
		landmarks[14] = lm(-elbow.x, elbow.h);
		landmarks[15] = lm(wrist.x, wrist.h);
		landmarks[16] = lm(-wrist.x, wrist.h);
		for (const [i, dx] of [
			[17, 15],
			[19, 25],
			[21, 5]
		] as const) {
			landmarks[i] = lm(wrist.x + dx, wrist.h - 60, 0.8);
			landmarks[i + 1] = lm(-wrist.x - dx, wrist.h - 60, 0.8);
		}
		const hipX = ah * 0.55;
		landmarks[23] = lm(hipX, L.hip);
		landmarks[24] = lm(-hipX, L.hip);
		landmarks[25] = lm(legOffset(L.knee), L.knee);
		landmarks[26] = lm(-legOffset(L.knee), L.knee);
		landmarks[27] = lm(legOffset(L.ankle), L.ankle);
		landmarks[28] = lm(-legOffset(L.ankle), L.ankle);
		landmarks[29] = lm(legOffset(L.ankle), L.heel);
		landmarks[30] = lm(-legOffset(L.ankle), L.heel);
		landmarks[31] = lm(legOffset(L.ankle) + 20, 0);
		landmarks[32] = lm(-legOffset(L.ankle) - 20, 0);
	} else {
		// Right profile, facing image left: near side (even indices) visible, far side occluded.
		const pair = (i: number, x: number, h: number) => {
			landmarks[i] = lm(x, h, 0.3);
			landmarks[i + 1] = lm(x, h, 0.95);
		};
		landmarks[0] = lm(-95, L.nose);
		for (let i = 1; i <= 6; i++) landmarks[i] = lm(-70, L.eyes, i > 3 ? 0.95 : 0.3);
		pair(7, -5, L.ears);
		pair(9, -80, L.mouth);
		pair(11, 0, L.shoulder);
		pair(13, -20, elbow.h);
		pair(15, -60, wrist.h);
		pair(17, -70, wrist.h - 60);
		pair(19, -75, wrist.h - 60);
		pair(21, -60, wrist.h - 50);
		pair(23, 0, L.hip);
		pair(25, -10, L.knee);
		pair(27, 10, L.ankle);
		pair(29, 40, L.heel);
		pair(31, -180, 0);
	}

	// Marker: chest (front) / right hip (side), 150 mm square.
	const side_px = opts.markerSidePx ?? DEFAULT_RULES.marker_mm * k;
	const mc = view === 'front' ? { x: toX(0), y: toY(L.chest) } : { x: toX(0), y: toY(L.hipLevel) };
	const hs = side_px / 2;
	const marker: MarkerObs = {
		corners: [
			[mc.x - hs, mc.y - hs],
			[mc.x + hs, mc.y - hs],
			[mc.x + hs, mc.y + hs],
			[mc.x - hs, mc.y + hs]
		],
		image_w: frameW,
		image_h: frameH,
		side_px,
		confidence: 0.95
	};

	const truth: Record<string, number> = {
		px_per_mm: k,
		stature: H,
		shoulder: body.shoulder_mm,
		chest: body.chest_mm,
		waist: body.waist_mm,
		hip: body.hip_mm,
		neck: body.neck_mm,
		sleeve: body.sleeve_mm,
		inleg: L.crotch,
		outleg: L.waist
	};
	return {
		input: {
			landmarks,
			mask: { data, width: maskW, height: maskH },
			marker,
			frame: { width: frameW, height: frameH }
		},
		truth
	};
}
