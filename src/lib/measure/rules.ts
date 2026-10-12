/**
 * Measurement rules and constants (Section 11). Every number that the
 * calibration may change lives here and is part of the config hash recorded on
 * each profile. Correction factors and level fractions are placeholders until
 * the calibration subset is fitted (rules_version "0.1-uncalibrated").
 */
import type { Sex, SiteCode } from '$lib/api/types';
import { PLAUSIBLE_MM } from '$lib/domain/sites';

export const RULES_VERSION = '0.1-uncalibrated';

export interface RulesConfig {
	rules_version: string;
	/** Printed marker side, mm (decision 8). */
	marker_mm: number;
	/** Longest / shortest marker side above this fails the view (11.1 step 1). */
	marker_squareness_max: number;
	/** Scale disagreement bands, % (11.1 step 3, 11.3). */
	scale_warn_pct: number;
	scale_fail_pct: number;
	/** Chest level below the shoulder midpoint, as a fraction of span, by sex. */
	chest_level: Record<Sex, number>;
	/** Female bust: search band (fraction of span) for the most-forward torso point. */
	bust_search: [number, number];
	/** Waist level fraction and the narrowest-width search band (Appendix I.3). */
	waist_level: number;
	waist_search: [number, number];
	/** Narrowest width further than this (fraction of span) from the waist level → check. */
	waist_mismatch: number;
	/** Hip band: from the hip landmarks down this fraction of hip-to-knee. */
	hip_band_knee_fraction: number;
	/** Added to shoulder (×2) and sleeve; fitted on calibration. */
	acromion_offset_mm: number;
	/** Neck search starts this fraction of the way from the mouth to the shoulder line. */
	neck_search_from: number;
	/** Girth correction factors. */
	cf: { chest: number; waist: number; hip: number; neck: number };
	/** Landmark visibility: below fail → fail, below check → check. */
	visibility_fail: number;
	visibility_check: number;
	/** Marker confidence below this → marker_weak check. */
	marker_confidence_min: number;
	/** A mask row run shorter than this (mask pixels) → mask_gap fail. */
	min_run_px: number;
	plausible_mm: Record<SiteCode, [number, number]>;
}

export const DEFAULT_RULES: RulesConfig = {
	rules_version: RULES_VERSION,
	marker_mm: 150,
	marker_squareness_max: 1.03,
	scale_warn_pct: 2,
	scale_fail_pct: 4,
	chest_level: { female: 0.25, male: 0.25, unspecified: 0.25 },
	bust_search: [0.15, 0.4],
	waist_level: 0.6,
	waist_search: [0.5, 0.7],
	waist_mismatch: 0.05,
	hip_band_knee_fraction: 0.25,
	acromion_offset_mm: 0,
	neck_search_from: 0.3,
	cf: { chest: 1, waist: 1, hip: 1, neck: 1 },
	visibility_fail: 0.5,
	visibility_check: 0.7,
	marker_confidence_min: 0.8,
	min_run_px: 3,
	plausible_mm: PLAUSIBLE_MM
};

export function resolveRules(partial: Partial<RulesConfig> = {}): RulesConfig {
	return {
		...DEFAULT_RULES,
		...partial,
		chest_level: { ...DEFAULT_RULES.chest_level, ...partial.chest_level },
		cf: { ...DEFAULT_RULES.cf, ...partial.cf },
		plausible_mm: { ...DEFAULT_RULES.plausible_mm, ...partial.plausible_mm }
	};
}

/** JSON with sorted keys so the hash does not depend on property order. */
function stableStringify(v: unknown): string {
	if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
	if (v && typeof v === 'object') {
		const o = v as Record<string, unknown>;
		return `{${Object.keys(o)
			.sort()
			.map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`)
			.join(',')}}`;
	}
	return JSON.stringify(v);
}

/** Deterministic short hash (FNV-1a, 32-bit) of the full rules config. */
export function configHash(config: Partial<RulesConfig> = DEFAULT_RULES): string {
	const s = stableStringify(resolveRules(config));
	let h = 0x811c9dc5;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 0x01000193) >>> 0;
	}
	return `cfg-${h.toString(16).padStart(8, '0')}`;
}
