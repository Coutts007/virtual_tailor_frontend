import type { SiteCode } from '$lib/api/types';
import { PLAUSIBLE_MM } from '$lib/domain/sites';
import { cmToMm } from '$lib/domain/units';

/** Values in cm (0.1) → mm, keeping blank sites out. */
export function toMmValues(
	cm: Partial<Record<SiteCode, number | null>>
): Partial<Record<SiteCode, number>> {
	const out: Partial<Record<SiteCode, number>> = {};
	for (const [s, v] of Object.entries(cm))
		if (v != null && Number.isFinite(v)) out[s as SiteCode] = cmToMm(v);
	return out;
}

/** Sites whose value is outside the plausible range (Section 15.2: ask to confirm). */
export function implausible(mm: Partial<Record<SiteCode, number>>): SiteCode[] {
	return (Object.entries(mm) as [SiteCode, number][])
		.filter(([s, v]) => v < PLAUSIBLE_MM[s][0] || v > PLAUSIBLE_MM[s][1])
		.map(([s]) => s);
}

/** At most one decimal place in cm. */
export function badPrecision(cm: number | null | undefined): boolean {
	return cm != null && Math.abs(cm * 10 - Math.round(cm * 10)) > 1e-6;
}
