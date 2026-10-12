/**
 * View geometry: landmarks and mask rows in working-frame pixels, body levels
 * as fractions of the span (shoulder midpoint → hip midpoint), and mapping a
 * level between the front and side views by its normalised position between
 * the top and bottom of each person mask (Section 11.2).
 */
import type { Landmark } from '$lib/api/types';
import { maskBounds, runAt, type Bounds, type Run } from './mask';
import type { ViewInput } from './types';

export interface Point {
	x: number;
	y: number;
	v: number;
}

export interface RowWidth {
	/** Width in working-frame pixels (0 when no run). */
	width: number;
	/** Run length in mask pixels before clipping. */
	runPx: number;
	run: Run | null;
	row: number;
}

export class View {
	readonly fx: number;
	readonly fy: number;
	readonly bounds: Bounds | null;

	constructor(readonly input: ViewInput) {
		this.fx = input.frame.width / input.mask.width;
		this.fy = input.frame.height / input.mask.height;
		this.bounds = maskBounds(input.mask);
	}

	/** Landmark i in frame pixels (visibility 0 when missing). */
	lm(i: number): Point {
		const l: Landmark | undefined = this.input.landmarks[i];
		if (!l) return { x: NaN, y: NaN, v: 0 };
		return { x: l.x * this.input.frame.width, y: l.y * this.input.frame.height, v: l.visibility };
	}

	mid(i: number, j: number): Point {
		const a = this.lm(i);
		const b = this.lm(j);
		return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, v: Math.min(a.v, b.v) };
	}

	/** Top edge of the person mask in frame px. */
	get topY(): number {
		return this.bounds ? this.bounds.top * this.fy : NaN;
	}
	/** Bottom edge of the person mask in frame px. */
	get bottomY(): number {
		return this.bounds ? (this.bounds.bottom + 1) * this.fy : NaN;
	}
	get heightPx(): number {
		return this.bottomY - this.topY;
	}

	row(yFrame: number): number {
		return Math.min(this.input.mask.height - 1, Math.max(0, Math.floor(yFrame / this.fy)));
	}
	rowCentreY(row: number): number {
		return (row + 0.5) * this.fy;
	}

	/** 0 at the top of the mask, 1 at the bottom. */
	norm(yFrame: number): number {
		return (yFrame - this.topY) / this.heightPx;
	}
	fromNorm(t: number): number {
		return this.topY + t * this.heightPx;
	}

	/**
	 * Width of the run containing centreX at frame height y, optionally clipped
	 * to [clipL, clipR] (frame px) to remove arms that touch the torso.
	 */
	widthAt(y: number, centreX: number, clipL = -Infinity, clipR = Infinity): RowWidth {
		const row = this.row(y);
		const run = runAt(this.input.mask, row, Math.round(centreX / this.fx - 0.5));
		if (!run) return { width: 0, runPx: 0, run: null, row };
		const left = Math.max(run[0] * this.fx, clipL);
		const right = Math.min((run[1] + 1) * this.fx, clipR);
		return { width: Math.max(0, right - left), runPx: run[1] - run[0] + 1, run, row };
	}
}

/** Linear interpolation of x along the segment a→b at height y; NaN outside its y range. */
export function xOnSegment(a: Point, b: Point, y: number): number {
	const lo = Math.min(a.y, b.y);
	const hi = Math.max(a.y, b.y);
	if (y < lo || y > hi || hi === lo) return NaN;
	return a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x);
}

/** Torso centre x at height y, between the shoulder and hip midpoints (extrapolated). */
export function torsoCentreX(top: Point, bottom: Point, y: number): number {
	if (bottom.y === top.y) return top.x;
	const t = (y - top.y) / (bottom.y - top.y);
	return top.x + t * (bottom.x - top.x);
}

/** Map a frame height in one view to the other through the normalised mask position. */
export function mapLevel(from: View, to: View, y: number): number {
	return to.fromNorm(from.norm(y));
}
