/** Scale from the marker and from the entered height (Section 11.1, Appendix I.3 steps 1–3). */
import type { MarkerObs } from '$lib/api/types';
import type { RulesConfig } from './rules';

export interface MarkerScale {
	ok: boolean;
	/** mm per working-frame pixel in the marker plane; 0 when not ok. */
	scale: number;
	/** Mean side in working-frame pixels. */
	side_px: number;
	/** Longest / shortest side, measured in the marker's own image. */
	squareness: number;
	confidence: number;
	reason?: 'missing' | 'not_square';
}

function sides(c: [number, number][]): number[] {
	return c.map((p, i) => {
		const q = c[(i + 1) % c.length]!;
		return Math.hypot(q[0] - p[0], q[1] - p[1]);
	});
}

/**
 * Step 1: fail the view when a corner is missing or the marker is not square.
 * Step 2: 150 mm / mean side, converted to the working-frame grid when the
 * corners came from a different-size image (e.g. the full-resolution still).
 */
export function markerScale(
	marker: MarkerObs | null,
	frame: { width: number; height: number },
	rules: RulesConfig
): MarkerScale {
	if (
		!marker ||
		marker.corners.length !== 4 ||
		marker.corners.some((p) => !p || !Number.isFinite(p[0] + p[1]))
	) {
		return {
			ok: false,
			scale: 0,
			side_px: 0,
			squareness: Infinity,
			confidence: 0,
			reason: 'missing'
		};
	}
	const own = sides(marker.corners);
	const squareness = Math.max(...own) / Math.max(1e-9, Math.min(...own));
	const fx = frame.width / marker.image_w;
	const fy = frame.height / marker.image_h;
	const inFrame = sides(marker.corners.map(([x, y]) => [x * fx, y * fy] as [number, number]));
	const side_px = inFrame.reduce((s, v) => s + v, 0) / 4;
	if (squareness > rules.marker_squareness_max || side_px <= 0) {
		return {
			ok: false,
			scale: 0,
			side_px,
			squareness,
			confidence: marker.confidence,
			reason: 'not_square'
		};
	}
	return {
		ok: true,
		scale: rules.marker_mm / side_px,
		side_px,
		squareness,
		confidence: marker.confidence
	};
}

/** Step 3: stature scale = entered height / mask height (front view, barefoot). */
export function statureScale(height_mm: number, maskHeightPx: number): number {
	return maskHeightPx > 0 ? height_mm / maskHeightPx : 0;
}

/** |marker − stature| / marker × 100. */
export function disagreementPct(markerScaleFront: number, statureScaleFront: number): number {
	if (!(markerScaleFront > 0) || !(statureScaleFront > 0)) return 0;
	return (Math.abs(markerScaleFront - statureScaleFront) / markerScaleFront) * 100;
}
