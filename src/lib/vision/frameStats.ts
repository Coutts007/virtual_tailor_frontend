/**
 * Pure per-frame statistics used by the pose worker (no DOM): mask bounding box,
 * arm/torso merge at the waist row, mean luminance and variance of the
 * Laplacian in the person box (Section 10.3 checks 3, 4, 6, 8). Unit-tested.
 */
import type { Landmark } from '$lib/api/types';

export interface Mask {
	data: Uint8Array;
	width: number;
	height: number;
}

export function maskBox(
	m: Mask
): { top: number; bottom: number; left: number; right: number } | null {
	let top = m.height,
		bottom = -1,
		left = m.width,
		right = -1;
	for (let y = 0; y < m.height; y++) {
		const row = y * m.width;
		for (let x = 0; x < m.width; x++) {
			if (!m.data[row + x]) continue;
			if (y < top) top = y;
			if (y > bottom) bottom = y;
			if (x < left) left = x;
			if (x > right) right = x;
		}
	}
	if (bottom < 0) return null;
	return {
		top: top / m.height,
		bottom: (bottom + 1) / m.height,
		left: left / m.width,
		right: (right + 1) / m.width
	};
}

/**
 * Front view: the arm is "merged" with the torso when the mask is solid all the
 * way from the hip landmark to the wrist on the waist row (no background gap).
 */
export function armMerge(m: Mask, L: Landmark[]): { left: boolean; right: boolean } {
	const sy = (L[11]!.y + L[12]!.y) / 2;
	const hy = (L[23]!.y + L[24]!.y) / 2;
	const y = Math.min(m.height - 1, Math.max(0, Math.round((sy + 0.6 * (hy - sy)) * m.height)));
	const solid = (a: number, b: number) => {
		const x0 = Math.max(0, Math.min(m.width - 1, Math.round(Math.min(a, b) * m.width)));
		const x1 = Math.max(0, Math.min(m.width - 1, Math.round(Math.max(a, b) * m.width)));
		for (let x = x0; x <= x1; x++) if (!m.data[y * m.width + x]) return false;
		return true;
	};
	return { left: solid(L[23]!.x, L[15]!.x), right: solid(L[24]!.x, L[16]!.x) };
}

/** Rec. 601 luma of RGBA pixels inside a normalised box; step samples every n-th pixel. */
export function meanLuma(
	rgba: Uint8ClampedArray,
	w: number,
	h: number,
	box: { top: number; bottom: number; left: number; right: number },
	step = 2
): number {
	const x0 = Math.floor(box.left * w),
		x1 = Math.ceil(box.right * w),
		y0 = Math.floor(box.top * h),
		y1 = Math.ceil(box.bottom * h);
	let sum = 0,
		n = 0;
	for (let y = y0; y < y1; y += step)
		for (let x = x0; x < x1; x += step) {
			const i = (y * w + x) * 4;
			sum += 0.299 * rgba[i]! + 0.587 * rgba[i + 1]! + 0.114 * rgba[i + 2]!;
			n++;
		}
	return n ? sum / n : 0;
}

/** Variance of the 4-neighbour Laplacian on luma, inside the box (blur measure). */
export function laplacianVariance(
	rgba: Uint8ClampedArray,
	w: number,
	h: number,
	box: { top: number; bottom: number; left: number; right: number },
	step = 2
): number {
	const luma = (x: number, y: number) => {
		const i = (y * w + x) * 4;
		return 0.299 * rgba[i]! + 0.587 * rgba[i + 1]! + 0.114 * rgba[i + 2]!;
	};
	const x0 = Math.max(1, Math.floor(box.left * w)),
		x1 = Math.min(w - 1, Math.ceil(box.right * w)),
		y0 = Math.max(1, Math.floor(box.top * h)),
		y1 = Math.min(h - 1, Math.ceil(box.bottom * h));
	let sum = 0,
		sq = 0,
		n = 0;
	for (let y = y0; y < y1; y += step)
		for (let x = x0; x < x1; x += step) {
			const v = luma(x - 1, y) + luma(x + 1, y) + luma(x, y - 1) + luma(x, y + 1) - 4 * luma(x, y);
			sum += v;
			sq += v * v;
			n++;
		}
	if (!n) return 0;
	const mean = sum / n;
	return sq / n - mean * mean;
}

/** Threshold a float confidence mask to 0/1. */
export function binarise(f: Float32Array, threshold = 0.5): Uint8Array {
	const out = new Uint8Array(f.length);
	for (let i = 0; i < f.length; i++) out[i] = f[i]! >= threshold ? 1 : 0;
	return out;
}
