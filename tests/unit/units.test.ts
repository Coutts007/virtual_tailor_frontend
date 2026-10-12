import { describe, expect, it } from 'vitest';
import {
	cmToMm,
	feetInchesToCm,
	formatEighths,
	formatLength,
	inToMm,
	mmToCm,
	mmToEighths,
	mmToUnit,
	unitToMm
} from '../../src/lib/domain/units';

describe('unit conversion (decision 6)', () => {
	it('mm ↔ cm with one decimal', () => {
		expect(mmToCm(985)).toBe(98.5);
		expect(cmToMm(98.5)).toBe(985);
		expect(cmToMm(0.1)).toBe(1);
	});
	it('mm ↔ inches to the nearest 1/8', () => {
		expect(inToMm(1)).toBe(25);
		expect(mmToEighths(254)).toBe(80); // 10 in
		expect(mmToEighths(985)).toBe(310); // 38.78 in → 38 6/8
		expect(formatEighths(310)).toBe('38 ¾');
		expect(formatEighths(4)).toBe('½');
		expect(formatEighths(16)).toBe('2');
	});
	it('formats for display', () => {
		expect(formatLength(985, 'cm')).toBe('98.5 cm');
		expect(formatLength(860, 'cm')).toBe('86.0 cm');
		expect(formatLength(985, 'in')).toBe('38 ¾ in');
		expect(formatLength(null, 'cm')).toBe('—');
	});
	it('round-trips through the display unit', () => {
		expect(unitToMm(mmToUnit(985, 'cm'), 'cm')).toBe(985);
		expect(Math.abs(unitToMm(mmToUnit(985, 'in'), 'in') - 985)).toBeLessThanOrEqual(2);
	});
	it('feet and inches to cm', () => {
		expect(feetInchesToCm(5, 7)).toBe(170);
	});
});
