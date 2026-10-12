import type { Flag, FlagSummary, GarmentType, Measurement, SiteCode } from '$lib/api/types';

/** The eight tailoring sites, in review/sheet order (Table 3.1). Stature is a check only. */
export const SITES: Exclude<SiteCode, 'stature'>[] = [
	'neck',
	'shoulder',
	'chest',
	'waist',
	'hip',
	'sleeve',
	'outleg',
	'inleg'
];
export const ALL_SITES: SiteCode[] = ['stature', ...SITES];
/** Appendix C order for tape readings. */
export const REFERENCE_ORDER: SiteCode[] = [
	'stature',
	'shoulder',
	'chest',
	'waist',
	'hip',
	'sleeve',
	'outleg',
	'inleg',
	'neck'
];

/** ISO 8559-1 terms shown in small print. */
export const ISO_TERMS: Record<SiteCode, string> = {
	stature: 'stature, ISO 8559-1 5.1.1',
	shoulder: 'shoulder width, ISO 8559-1 5.4.2',
	chest: 'chest/bust girth, ISO 8559-1 5.3.4',
	waist: 'waist girth, ISO 8559-1 5.3.10',
	hip: 'hip girth, ISO 8559-1 5.3.13',
	sleeve: 'arm length, ISO 8559-1 5.7.8',
	outleg: 'outside leg length, ISO 8559-1 5.4.19',
	inleg: 'inside leg length, ISO 8559-1 5.1.15',
	neck: 'neck girth, ISO 8559-1 5.3.2'
};

/** Plausible ranges in mm (rules.ts will import these in Phase 4). */
export const PLAUSIBLE_MM: Record<SiteCode, [number, number]> = {
	stature: [1200, 2200],
	shoulder: [280, 600],
	chest: [600, 1800],
	waist: [450, 2000],
	hip: [650, 2000],
	sleeve: [400, 800],
	outleg: [700, 1300],
	inleg: [550, 1000],
	neck: [250, 600]
};

/** Default garment → sites (decision 5, [CONFIRM after tailor interviews]). */
export const GARMENT_SITES: Record<GarmentType, SiteCode[]> = {
	shirt: ['shoulder', 'chest', 'waist', 'sleeve', 'neck'],
	dress: ['shoulder', 'chest', 'waist', 'hip', 'sleeve'],
	trousers: ['waist', 'hip', 'outleg', 'inleg'],
	suit_jacket: ['shoulder', 'chest', 'waist', 'hip', 'sleeve', 'neck'],
	skirt: ['waist', 'hip', 'outleg'],
	other: [...SITES]
};
export const GARMENTS: GarmentType[] = [
	'shirt',
	'dress',
	'trousers',
	'suit_jacket',
	'skirt',
	'other'
];

export function summariseFlags(
	ms: Pick<Measurement, 'site_code' | 'confidence_flag'>[]
): FlagSummary {
	const s: FlagSummary = { pass: 0, check: 0, fail: 0 };
	for (const m of ms) if (m.site_code !== 'stature') s[m.confidence_flag]++;
	return s;
}

export const FLAG_ICON: Record<Flag, string> = { pass: '✓', check: '▲', fail: '✕' };
