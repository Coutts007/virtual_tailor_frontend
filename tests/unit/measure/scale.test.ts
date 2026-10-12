import { describe, expect, it } from 'vitest';
import type { MarkerObs } from '../../../src/lib/api/types';
import { DEFAULT_RULES } from '../../../src/lib/measure';
import { disagreementPct, markerScale, statureScale } from '../../../src/lib/measure/scale';

const square = (side: number, image_w = 1080, image_h = 1920, cx = 500, cy = 700): MarkerObs => ({
	corners: [
		[cx, cy],
		[cx + side, cy],
		[cx + side, cy + side],
		[cx, cy + side]
	],
	image_w,
	image_h,
	side_px: side,
	confidence: 0.9
});
const frame = { width: 1080, height: 1920 };

describe('marker scale (11.1 steps 1–2)', () => {
	it('150 mm over the mean side', () => {
		const m = markerScale(square(100), frame, DEFAULT_RULES);
		expect(m).toMatchObject({ ok: true, side_px: 100, confidence: 0.9 });
		expect(m.scale).toBeCloseTo(1.5, 9);
	});
	it('converts corners from a larger still to the working frame', () => {
		// Full-resolution still 3024×5376 (2.8×); a 280 px side becomes 100 frame px.
		const m = markerScale(square(280, 3024, 5376), frame, DEFAULT_RULES);
		expect(m.side_px).toBeCloseTo(100, 6);
		expect(m.scale).toBeCloseTo(1.5, 6);
	});
	it('fails when not square (longest/shortest > 1.03)', () => {
		const m = square(100);
		m.corners[2] = [600, 805]; // one side 5 % longer
		expect(markerScale(m, frame, DEFAULT_RULES)).toMatchObject({
			ok: false,
			reason: 'not_square',
			scale: 0
		});
	});
	it('accepts 3 % skew', () => {
		const m = square(100);
		m.corners[2] = [600, 802.5];
		expect(markerScale(m, frame, DEFAULT_RULES).ok).toBe(true);
	});
	it('fails when missing or a corner is lost', () => {
		expect(markerScale(null, frame, DEFAULT_RULES)).toMatchObject({ ok: false, reason: 'missing' });
		const m = square(100);
		m.corners = m.corners.slice(0, 3);
		expect(markerScale(m, frame, DEFAULT_RULES).reason).toBe('missing');
	});
});

describe('stature scale and disagreement (11.1 step 3)', () => {
	it('height over mask height', () => {
		expect(statureScale(1700, 1000)).toBe(1.7);
		expect(statureScale(1700, 0)).toBe(0);
	});
	it('|marker − stature| / marker × 100', () => {
		expect(disagreementPct(1.5, 1.56)).toBeCloseTo(4, 9);
		expect(disagreementPct(0, 1.5)).toBe(0);
	});
});
