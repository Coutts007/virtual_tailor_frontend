import { describe, expect, it } from 'vitest';
import { ellipsePerimeter, girth } from '../../../src/lib/measure/girth';

describe('Ramanujan ellipse perimeter (11.2)', () => {
	it('is exact for a circle', () => {
		expect(ellipsePerimeter(100, 100)).toBeCloseTo(2 * Math.PI * 100, 9);
	});
	it('is within 0.01 % of the exact elliptic integral (a=3, b=1 → 13.364893)', () => {
		expect(Math.abs(ellipsePerimeter(3, 1) / 13.364893 - 1)).toBeLessThan(1e-4);
	});
	it('degenerates to 4a for a flat ellipse', () => {
		expect(ellipsePerimeter(10, 0)).toBeCloseTo(40, 0);
	});
	it('applies the correction factor', () => {
		expect(girth(150, 110, 1.05)).toBeCloseTo(ellipsePerimeter(150, 110) * 1.05, 9);
	});
});
