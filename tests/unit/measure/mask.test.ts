import { describe, expect, it } from 'vitest';
import { at, maskBounds, rowRuns, runAt } from '../../../src/lib/measure/mask';
import { mapLevel, torsoCentreX, View, xOnSegment } from '../../../src/lib/measure/levels';
import { rectMask } from './helpers';

describe('mask helpers', () => {
	const m = rectMask(20, 10, [
		[2, 1, 5, 8],
		[9, 3, 9, 6],
		[12, 2, 19, 2]
	]);
	it('finds runs, including one touching the right edge', () => {
		expect(rowRuns(m, 2)).toEqual([
			[2, 5],
			[12, 19]
		]);
		expect(rowRuns(m, -1)).toEqual([]);
	});
	it('picks the run containing x or the nearest within 2', () => {
		expect(runAt(m, 4, 3)).toEqual([2, 5]);
		expect(runAt(m, 4, 7)).toEqual([2, 5]);
		expect(runAt(m, 4, 8)).toEqual([9, 9]);
		expect(runAt(m, 0, 3)).toBeNull();
	});
	it('bounds and point lookup', () => {
		expect(maskBounds(m)).toEqual({ top: 1, bottom: 8, left: 2, right: 19 });
		expect(maskBounds(rectMask(4, 4, []))).toBeNull();
		expect(at(m, 2, 1)).toBe(true);
		expect(at(m, -1, 1)).toBe(false);
	});
});

describe('view geometry', () => {
	const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }));
	// Mask at half the frame resolution: 1 mask px = 2 frame px.
	const v = new View({
		landmarks,
		mask: rectMask(10, 20, [[3, 2, 6, 17]]),
		marker: null,
		frame: { width: 20, height: 40 }
	});
	it('converts mask rows to frame px', () => {
		expect(v.topY).toBe(4);
		expect(v.bottomY).toBe(36);
		expect(v.heightPx).toBe(32);
		expect(v.row(5)).toBe(2);
		expect(v.rowCentreY(2)).toBe(5);
		expect(v.norm(20)).toBe(0.5);
		expect(v.fromNorm(0.25)).toBe(12);
	});
	it('measures width in frame px with clipping', () => {
		expect(v.widthAt(20, 10).width).toBe(8);
		expect(v.widthAt(20, 10, 8, 12).width).toBe(4);
		expect(v.widthAt(20, 0).run).toBeNull();
	});
	it('maps levels between views and interpolates segments', () => {
		const other = new View({
			landmarks,
			mask: rectMask(10, 20, [[3, 0, 6, 19]]),
			marker: null,
			frame: { width: 20, height: 40 }
		});
		expect(mapLevel(v, other, 20)).toBe(20);
		expect(mapLevel(v, other, 4)).toBe(0);
		const a = { x: 0, y: 0, v: 1 };
		const b = { x: 10, y: 10, v: 1 };
		expect(xOnSegment(a, b, 5)).toBe(5);
		expect(xOnSegment(a, b, 11)).toBeNaN();
		expect(torsoCentreX(a, b, 20)).toBe(20);
		expect(torsoCentreX(a, { ...a }, 3)).toBe(0);
	});
	it('missing landmarks have zero visibility', () => {
		const empty = new View({
			landmarks: [],
			mask: rectMask(2, 2, []),
			marker: null,
			frame: { width: 2, height: 2 }
		});
		expect(empty.lm(11).v).toBe(0);
		expect(empty.topY).toBeNaN();
	});
});
