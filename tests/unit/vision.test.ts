import { describe, expect, it } from 'vitest';
import {
	armMerge,
	binarise,
	laplacianVariance,
	maskBox,
	meanLuma
} from '../../src/lib/vision/frameStats';
import { combineMarkers, majorityMask, median, medianLandmarks } from '../../src/lib/vision/burst';
import { fit, MAX_CANVAS_PIXELS } from '../../src/lib/vision/imageOps';
import { frontLandmarks } from './capture/fixtures';

const rect = (w: number, h: number, x0: number, y0: number, x1: number, y1: number) => {
	const data = new Uint8Array(w * h);
	for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) data[y * w + x] = 1;
	return { data, width: w, height: h };
};

describe('frame statistics (10.3)', () => {
	it('mask bounding box is normalised', () => {
		expect(maskBox(rect(100, 200, 20, 50, 80, 150))).toEqual({
			top: 0.25,
			bottom: 0.75,
			left: 0.2,
			right: 0.8
		});
		expect(maskBox({ data: new Uint8Array(4), width: 2, height: 2 })).toBeNull();
	});

	it('arm merge: solid mask from hip to wrist means the arm touches the body', () => {
		const L = frontLandmarks();
		const merged = rect(100, 100, 0, 0, 100, 100);
		expect(armMerge(merged, L)).toEqual({ left: true, right: true });
		// A background gap between the hip and the wrist on the waist row → not merged.
		const gap = rect(100, 100, 0, 0, 100, 100);
		const y = Math.round(
			((L[11]!.y + L[12]!.y) / 2 + 0.6 * ((L[23]!.y + L[24]!.y) / 2 - (L[11]!.y + L[12]!.y) / 2)) *
				100
		);
		for (let x = 60; x < 62; x++) gap.data[y * 100 + x] = 0;
		expect(armMerge(gap, L).left).toBe(false);
	});

	it('luminance and Laplacian variance (sharp vs flat)', () => {
		const w = 40,
			h = 40,
			flat = new Uint8ClampedArray(w * h * 4).fill(128);
		const box = { top: 0, bottom: 1, left: 0, right: 1 };
		expect(Math.round(meanLuma(flat, w, h, box, 1))).toBe(128);
		expect(laplacianVariance(flat, w, h, box, 1)).toBe(0);
		const checker = new Uint8ClampedArray(w * h * 4);
		for (let y = 0; y < h; y++)
			for (let x = 0; x < w; x++)
				checker.fill((x + y) % 2 ? 255 : 0, (y * w + x) * 4, (y * w + x) * 4 + 3);
		expect(laplacianVariance(checker, w, h, box, 1)).toBeGreaterThan(1000);
	});

	it('binarise thresholds at 0.5', () => {
		expect(Array.from(binarise(new Float32Array([0.1, 0.5, 0.9])))).toEqual([0, 1, 1]);
	});
});

describe('burst reduction (10.4)', () => {
	it('median of each landmark', () => {
		const L = frontLandmarks();
		const frames = [0, 0.01, -0.01, 0.02, 0.5].map((d) => L.map((l) => ({ ...l, x: l.x + d })));
		expect(medianLandmarks(frames)[0]!.x).toBeCloseTo(L[0]!.x + 0.01, 6);
		expect(median([3, 1, 2])).toBe(2);
		expect(median([4, 1, 2, 3])).toBe(2.5);
	});

	it('pixel-wise majority mask', () => {
		const a = rect(4, 1, 0, 0, 2, 1),
			b = rect(4, 1, 1, 0, 3, 1),
			c = rect(4, 1, 1, 0, 2, 1);
		expect(Array.from(majorityMask([a, b, c]).data)).toEqual([0, 1, 0, 0]);
	});

	it('marker confidence = valid fraction × (1 − spread / side)', () => {
		const sq = (dx = 0) => ({
			found: true,
			corners: [
				[100 + dx, 100],
				[200 + dx, 100],
				[200 + dx, 200],
				[100 + dx, 200]
			] as [number, number][],
			side_px: 100,
			ratio: 1,
			image_w: 1080,
			image_h: 1920,
			occluded: false
		});
		const miss = { ...sq(), found: false, corners: [] };
		const r = combineMarkers([sq(), sq(), sq(1), miss, sq()], 5);
		expect(r.marker!.side_px).toBeCloseTo(100, 3);
		expect(r.confidence).toBeCloseTo((4 / 5) * (1 - 1 / 100), 3);
		expect(combineMarkers([miss], 5).marker).toBeNull();
	});

	it('canvas sizes respect the long edge and the Safari 16.78 MP cap', () => {
		expect(fit(1080, 1920, 1280)).toEqual({ w: 720, h: 1280 });
		const { w, h } = fit(6000, 8000, 99999);
		expect(w * h).toBeLessThanOrEqual(MAX_CANVAS_PIXELS);
	});
});
