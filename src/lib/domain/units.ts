/**
 * Unit conversion (Section 8.3, decision 6). Millimetres are always stored and
 * sent; the UI shows centimetres to one decimal or inches to the nearest 1/8.
 */
export type DisplayUnit = 'cm' | 'in';
export const MM_PER_IN = 25.4;

export function mmToCm(mm: number): number {
	return Math.round(mm) / 10;
}
export function cmToMm(cm: number): number {
	return Math.round(cm * 10);
}
export function inToMm(inches: number): number {
	return Math.round(inches * MM_PER_IN);
}
/** Inches rounded to the nearest 1/8. */
export function mmToEighths(mm: number): number {
	return Math.round((mm / MM_PER_IN) * 8);
}

/** "98.5 cm", or "38 ⅝ in". `null` → "—". */
export function formatLength(mm: number | null, unit: DisplayUnit, locale = 'en-KE'): string {
	if (mm == null || !Number.isFinite(mm)) return '—';
	if (unit === 'cm') {
		const v = new Intl.NumberFormat(locale, {
			minimumFractionDigits: 1,
			maximumFractionDigits: 1
		}).format(mmToCm(mm));
		return `${v} cm`;
	}
	return `${formatEighths(mmToEighths(mm))} in`;
}

const FRACTIONS = ['', '⅛', '¼', '⅜', '½', '⅝', '¾', '⅞'];
export function formatEighths(eighths: number): string {
	const sign = eighths < 0 ? '-' : '';
	const abs = Math.abs(eighths);
	const whole = Math.floor(abs / 8);
	const frac = FRACTIONS[abs % 8]!;
	if (!frac) return `${sign}${whole}`;
	return whole ? `${sign}${whole} ${frac}` : `${sign}${frac}`;
}

/** Value for an editable input in the display unit (number, not string). */
export function mmToUnit(mm: number, unit: DisplayUnit): number {
	return unit === 'cm' ? mmToCm(mm) : mmToEighths(mm) / 8;
}
export function unitToMm(value: number, unit: DisplayUnit): number {
	return unit === 'cm' ? cmToMm(value) : inToMm(value);
}

/** Feet+inches to centimetres (height entry help, Section 9.2). */
export function feetInchesToCm(feet: number, inches: number): number {
	return Math.round((feet * 12 + inches) * 2.54);
}
