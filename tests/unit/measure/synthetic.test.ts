import { describe, expect, it } from 'vitest';
import { maskBounds } from '../../../src/lib/measure/mask';
import { defaultBody, synthesizeView } from '../../../src/lib/measure/synthetic';

describe('synthetic body (11.4 fixtures)', () => {
	it('1.70 m at 2.5 m is about 943 px tall on a 1920 frame', () => {
		const { input, truth } = synthesizeView(defaultBody(1700, 'male'), 'front', {
			distance_m: 2.5
		});
		const b = maskBounds(input.mask)!;
		expect(b.bottom - b.top + 1).toBeGreaterThanOrEqual(942);
		expect(b.bottom - b.top + 1).toBeLessThanOrEqual(944);
		expect(truth.px_per_mm! * 1700).toBeCloseTo(943, 6);
	});
	it('scales the mask with maskScale and returns 33 landmarks and a 150 mm marker', () => {
		const { input, truth } = synthesizeView(defaultBody(1650, 'female'), 'side', {
			maskScale: 0.25
		});
		expect(input.mask.width).toBe(270);
		expect(input.mask.height).toBe(480);
		expect(input.landmarks).toHaveLength(33);
		expect(input.landmarks.every((l) => l && l.x > 0 && l.x < 1)).toBe(true);
		expect(input.marker!.side_px).toBeCloseTo(150 * truth.px_per_mm!, 6);
	});
	it('is deterministic for a seed and jitters landmarks with noise', () => {
		const body = defaultBody(1700, 'female');
		const a = synthesizeView(body, 'front', { noise: 2, seed: 7 }).input.landmarks;
		const b = synthesizeView(body, 'front', { noise: 2, seed: 7 }).input.landmarks;
		const c = synthesizeView(body, 'front').input.landmarks;
		expect(a).toEqual(b);
		expect(a[11]!.x).not.toBe(c[11]!.x);
	});
});
