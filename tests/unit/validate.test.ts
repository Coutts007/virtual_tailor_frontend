import { describe, expect, it } from 'vitest';
import {
	addDays,
	nairobiToday,
	normaliseCode,
	normaliseKenyanPhone,
	passwordStrength,
	suggestFromFeet,
	validateClientCode,
	validateDueDate,
	validateEaseCm,
	validateEmail,
	validateHeightCm,
	validatePassword
} from '../../src/lib/domain/validate';

describe('client code (FR-02)', () => {
	it('accepts two letters + four digits only', () => {
		expect(validateClientCode('AB1234')).toBeNull();
		for (const bad of ['ab1234', 'A11234', 'AB123', 'AB12345', 'ABCD12', ''])
			expect(validateClientCode(bad), bad).toBe('validate.code');
	});
	it('normalises case and strips separators', () => {
		expect(normaliseCode(' ab-12 34x')).toBe('AB1234');
	});
});

describe('height (FR-02)', () => {
	it('120–220 cm inclusive, integers', () => {
		expect(validateHeightCm(120)).toBeNull();
		expect(validateHeightCm(220)).toBeNull();
		expect(validateHeightCm(119)).toBe('validate.height');
		expect(validateHeightCm(221)).toBe('validate.height');
		expect(validateHeightCm(170.5)).toBe('validate.height');
		expect(validateHeightCm(null)).toBe('validate.height');
	});
	it('suggests a feet conversion between 4 and 7.5', () => {
		expect(suggestFromFeet(5.7)).toEqual({ feet: 5, inches: 7, cm: 170 });
		expect(suggestFromFeet(6)).toEqual({ feet: 6, inches: 0, cm: 183 });
		expect(suggestFromFeet(170)).toBeNull();
		expect(suggestFromFeet(3.9)).toBeNull();
	});
});

describe('ease (FR-16)', () => {
	it('0–30 cm, one decimal, blank = ok', () => {
		expect(validateEaseCm(null)).toBeNull();
		expect(validateEaseCm(0)).toBeNull();
		expect(validateEaseCm(30)).toBeNull();
		expect(validateEaseCm(2.5)).toBeNull();
		expect(validateEaseCm(-0.1)).toBe('validate.ease');
		expect(validateEaseCm(30.1)).toBe('validate.ease');
		expect(validateEaseCm(2.55)).toBe('validate.ease');
	});
});

describe('due date (Table 5.2)', () => {
	const now = new Date('2027-05-12T21:30:00Z'); // 00:30 on 13 May in Nairobi
	it('uses the Nairobi calendar day', () => {
		expect(nairobiToday(now)).toBe('2027-05-13');
	});
	it('today to +180 days', () => {
		expect(validateDueDate('2027-05-13', now)).toBeNull();
		expect(validateDueDate('2027-05-12', now)).toBe('validate.duePast');
		expect(validateDueDate(addDays('2027-05-13', 180), now)).toBeNull();
		expect(validateDueDate(addDays('2027-05-13', 181), now)).toBe('validate.dueFar');
		expect(validateDueDate('', now)).toBe('validate.dueRequired');
	});
});

describe('Kenyan phone → E.164', () => {
	it.each([
		['0712345678', '+254712345678'],
		['+254712345678', '+254712345678'],
		['254 712 345 678', '+254712345678'],
		['0110123456', '+254110123456'],
		['0812345678', null],
		['12345', null]
	])('%s → %s', (raw, out) => expect(normaliseKenyanPhone(raw)).toBe(out));
});

describe('password (Section 13.1)', () => {
	it('min 10 chars and not common; no composition rules', () => {
		expect(validatePassword('short')).toBe('validate.passwordShort');
		expect(validatePassword('Nairobi123')).toBe('validate.passwordCommon');
		expect(validatePassword('blue tea at noon')).toBeNull();
	});
	it('strength meter grows with length', () => {
		expect(passwordStrength('')).toBe(0);
		expect(passwordStrength('short')).toBe(1);
		expect(passwordStrength('abcdefghik')).toBe(2);
		expect(passwordStrength('mango juice at 4 pm')).toBe(4);
	});
});

describe('email', () => {
	it('basic shape', () => {
		expect(validateEmail('a@b.co')).toBeNull();
		expect(validateEmail('nope')).toBe('validate.email');
	});
});
