/**
 * Validators shared by forms and the mock backend (Table 5.2). Each returns an
 * i18n error key or null. Pure; unit-tested in tests/unit/validate.test.ts.
 */
import { feetInchesToCm } from './units';

export const CLIENT_CODE_RE = /^[A-Z]{2}[0-9]{4}$/;
export const PARTICIPANT_CODE_RE = /^P[0-9]{3}$/;

export function normaliseCode(raw: string): string {
	return raw
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, '')
		.slice(0, 6);
}
/** Input mask: two letters then four digits; anything else is dropped. */
export function maskClientCode(raw: string): string {
	let out = '';
	for (const ch of raw.toUpperCase()) {
		if (out.length < 2 && /[A-Z]/.test(ch)) out += ch;
		else if (out.length >= 2 && out.length < 6 && /[0-9]/.test(ch)) out += ch;
	}
	return out;
}

export function validateClientCode(code: string): 'validate.code' | null {
	return CLIENT_CODE_RE.test(code) ? null : 'validate.code';
}

export const HEIGHT_MIN_CM = 120;
export const HEIGHT_MAX_CM = 220;
export function validateHeightCm(cm: number | null | undefined): 'validate.height' | null {
	if (cm == null || !Number.isInteger(cm) || cm < HEIGHT_MIN_CM || cm > HEIGHT_MAX_CM)
		return 'validate.height';
	return null;
}
/**
 * Detects likely feet entry (4 to 7.5) and suggests centimetres. 5.7 is read as
 * 5 ft 7 in; 5.11 as 5 ft 11 in.
 */
export function suggestFromFeet(
	value: number
): { feet: number; inches: number; cm: number } | null {
	if (!(value >= 4 && value <= 7.5)) return null;
	const [f, i = ''] = String(value).split('.');
	const feet = Number(f);
	const inches = i ? Math.min(11, Number(i)) : 0;
	return { feet, inches, cm: feetInchesToCm(feet, inches) };
}

export const EASE_MAX_CM = 30;
export function validateEaseCm(cm: number | null | undefined): 'validate.ease' | null {
	if (cm == null) return null; // blank = 0
	if (!Number.isFinite(cm) || cm < 0 || cm > EASE_MAX_CM) return 'validate.ease';
	// One decimal place at most.
	if (Math.abs(cm * 10 - Math.round(cm * 10)) > 1e-6) return 'validate.ease';
	return null;
}

/** Today in Nairobi as YYYY-MM-DD. */
export function nairobiToday(now = new Date()): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(now);
}
export function addDays(isoDate: string, days: number): string {
	const d = new Date(`${isoDate}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}
export const DUE_MAX_DAYS = 180;
export function validateDueDate(
	date: string,
	now = new Date()
): 'validate.dueRequired' | 'validate.duePast' | 'validate.dueFar' | null {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'validate.dueRequired';
	const today = nairobiToday(now);
	if (date < today) return 'validate.duePast';
	if (date > addDays(today, DUE_MAX_DAYS)) return 'validate.dueFar';
	return null;
}

/** Kenyan mobile numbers: +2547XXXXXXXX / +2541XXXXXXXX / 07…/01… → E.164. */
export function normaliseKenyanPhone(raw: string): string | null {
	const digits = raw.replace(/[\s()-]/g, '');
	let m = digits.match(/^\+254([17]\d{8})$/);
	if (m) return `+254${m[1]}`;
	m = digits.match(/^254([17]\d{8})$/);
	if (m) return `+254${m[1]}`;
	m = digits.match(/^0([17]\d{8})$/);
	if (m) return `+254${m[1]}`;
	return null;
}

export const PASSWORD_MIN = 10;
/** Small bundled list (Section 13.1). Lower-cased. */
export const COMMON_PASSWORDS = new Set([
	'1234567890',
	'12345678910',
	'0123456789',
	'0987654321',
	'1111111111',
	'0000000000',
	'qwertyuiop',
	'asdfghjkl;',
	'password12',
	'password123',
	'password1234',
	'passw0rd123',
	'iloveyou123',
	'qwerty1234',
	'qwerty12345',
	'abcdefghij',
	'abc1234567',
	'letmein123',
	'welcome123',
	'football12',
	'nairobi123',
	'nairobi2024',
	'nairobi2025',
	'nairobi2026',
	'kenya12345',
	'kenya2024',
	'kenya2025',
	'kenya2026',
	'tailor1234',
	'fundi12345',
	'mpesa12345',
	'safaricom1',
	'safaricom123',
	'jesus12345',
	'godisgood1',
	'blessed123',
	'princess12',
	'sunshine12',
	'monkey1234',
	'dragon1234'
]);
export function validatePassword(
	pw: string
): 'validate.passwordShort' | 'validate.passwordCommon' | null {
	if (pw.length < PASSWORD_MIN) return 'validate.passwordShort';
	if (COMMON_PASSWORDS.has(pw.toLowerCase())) return 'validate.passwordCommon';
	return null;
}
/** 0–4 strength score for the meter; length-based, no composition rules. */
export function passwordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
	if (!pw) return 0;
	if (validatePassword(pw)) return 1;
	const unique = new Set(pw).size;
	if (pw.length >= 16 && unique >= 8) return 4;
	if (pw.length >= 13 && unique >= 6) return 3;
	return 2;
}

export function validateEmail(email: string): 'validate.email' | null {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? null : 'validate.email';
}
