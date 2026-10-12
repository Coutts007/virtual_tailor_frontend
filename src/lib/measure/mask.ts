import type { BinaryMask } from './types';

export type Run = [start: number, end: number]; // inclusive mask columns

/** Contiguous runs of person pixels in one mask row. */
export function rowRuns(mask: BinaryMask, row: number): Run[] {
	const runs: Run[] = [];
	if (row < 0 || row >= mask.height) return runs;
	const off = row * mask.width;
	let start = -1;
	for (let x = 0; x < mask.width; x++) {
		const on = mask.data[off + x] === 1;
		if (on && start < 0) start = x;
		if (!on && start >= 0) {
			runs.push([start, x - 1]);
			start = -1;
		}
	}
	if (start >= 0) runs.push([start, mask.width - 1]);
	return runs;
}

/** The run containing column x, or the nearest run within maxDist columns. */
export function runAt(mask: BinaryMask, row: number, x: number, maxDist = 2): Run | null {
	let best: Run | null = null;
	let bestD = Infinity;
	for (const r of rowRuns(mask, row)) {
		const d = x < r[0] ? r[0] - x : x > r[1] ? x - r[1] : 0;
		if (d < bestD) {
			best = r;
			bestD = d;
		}
	}
	return best && bestD <= maxDist ? best : null;
}

export function at(mask: BinaryMask, x: number, y: number): boolean {
	if (x < 0 || y < 0 || x >= mask.width || y >= mask.height) return false;
	return mask.data[y * mask.width + x] === 1;
}

export interface Bounds {
	top: number;
	bottom: number;
	left: number;
	right: number;
}

/** Bounding rows/columns of all person pixels, or null for an empty mask. */
export function maskBounds(mask: BinaryMask): Bounds | null {
	let top = -1;
	let bottom = -1;
	let left = mask.width;
	let right = -1;
	for (let y = 0; y < mask.height; y++) {
		const off = y * mask.width;
		let any = false;
		for (let x = 0; x < mask.width; x++) {
			if (mask.data[off + x] === 1) {
				any = true;
				if (x < left) left = x;
				if (x > right) right = x;
			}
		}
		if (any) {
			if (top < 0) top = y;
			bottom = y;
		}
	}
	return top < 0 ? null : { top, bottom, left, right };
}
