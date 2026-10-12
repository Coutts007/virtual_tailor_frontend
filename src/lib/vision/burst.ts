/**
 * Burst reduction (Section 10.4), pure: per-landmark medians across frames,
 * per-corner marker medians, pixel-wise majority mask, and
 * marker_confidence = fraction of frames with a valid marker × (1 − corner spread / side).
 */
import type { Landmark, MarkerObs } from '$lib/api/types';
import type { MarkerFound } from './protocol';
import type { MaskData } from './types';

export function median(xs: number[]): number {
	const s = [...xs].sort((a, b) => a - b);
	const m = s.length >> 1;
	return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

export function medianLandmarks(frames: Landmark[][]): Landmark[] {
	return Array.from({ length: 33 }, (_, i) => ({
		x: median(frames.map((f) => f[i]!.x)),
		y: median(frames.map((f) => f[i]!.y)),
		z: median(frames.map((f) => f[i]!.z)),
		visibility: median(frames.map((f) => f[i]!.visibility))
	}));
}

export function majorityMask(masks: MaskData[]): MaskData {
	const { width, height } = masks[0]!;
	const out = new Uint8Array(width * height);
	const need = Math.floor(masks.length / 2) + 1;
	for (let i = 0; i < out.length; i++) {
		let n = 0;
		for (const m of masks) n += m.data[i]!;
		out[i] = n >= need ? 1 : 0;
	}
	return { data: out, width, height };
}

/** Median corners across frames that share an image size, with confidence. */
export function combineMarkers(
	found: MarkerFound[],
	total: number
): { marker: MarkerObs | null; confidence: number } {
	const valid = found.filter((f) => f.found && f.corners.length === 4);
	if (!valid.length) return { marker: null, confidence: 0 };
	const corners = [0, 1, 2, 3].map(
		(k) =>
			[median(valid.map((v) => v.corners[k]![0])), median(valid.map((v) => v.corners[k]![1]))] as [
				number,
				number
			]
	);
	const sides = corners.map((p, k) =>
		Math.hypot(p[0] - corners[(k + 1) % 4]![0], p[1] - corners[(k + 1) % 4]![1])
	);
	const side = sides.reduce((a, b) => a + b, 0) / 4;
	let spread = 0;
	for (const v of valid)
		for (let k = 0; k < 4; k++)
			spread = Math.max(
				spread,
				Math.hypot(v.corners[k]![0] - corners[k]![0], v.corners[k]![1] - corners[k]![1])
			);
	const confidence = Math.max(0, (valid.length / total) * (1 - spread / side));
	return {
		marker: {
			corners,
			image_w: valid[0]!.image_w,
			image_h: valid[0]!.image_h,
			side_px: side,
			confidence: Math.round(confidence * 1000) / 1000
		},
		confidence
	};
}
