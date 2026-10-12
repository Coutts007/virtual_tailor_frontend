/** Confidence flags and reason codes (Section 11.3, FR-08). */
import type { Flag, FlagReason, Measurement, SiteCode } from '$lib/api/types';
import type { RulesConfig } from './rules';
import type { ViewName } from './types';

export interface Issue {
	reason: FlagReason;
	severity: 'fail' | 'check';
}

export const GIRTH_SITES: SiteCode[] = ['chest', 'waist', 'hip', 'neck'];

/** Which views each site depends on. */
export const SITE_VIEWS: Record<SiteCode, ViewName[]> = {
	stature: ['front'],
	shoulder: ['front'],
	chest: ['front', 'side'],
	waist: ['front', 'side'],
	hip: ['front', 'side'],
	sleeve: ['front'],
	outleg: ['front', 'side'],
	inleg: ['front'],
	neck: ['front', 'side']
};

/** Visibility rule: < fail → fail, < check → check (reason landmark_low). */
export function visibilityIssues(min: number, rules: RulesConfig): Issue[] {
	if (!(min >= rules.visibility_fail)) return [{ reason: 'landmark_low', severity: 'fail' }];
	if (min < rules.visibility_check) return [{ reason: 'landmark_low', severity: 'check' }];
	return [];
}

export interface GlobalFlagContext {
	disagreement_pct: number;
	level_unchecked: boolean;
	loose: boolean;
	marker_confidence: Partial<Record<ViewName, number>>;
	failed_views: ViewName[];
}

/** Issues that apply to a site because of the capture as a whole. */
export function globalIssues(site: SiteCode, g: GlobalFlagContext, rules: RulesConfig): Issue[] {
	const out: Issue[] = [];
	const views = SITE_VIEWS[site];
	if (views.some((v) => g.failed_views.includes(v)))
		out.push({ reason: 'view_failed', severity: 'fail' });
	if (g.disagreement_pct > rules.scale_warn_pct)
		out.push({ reason: 'scale_disagree', severity: 'check' });
	if (g.level_unchecked) out.push({ reason: 'level_unchecked', severity: 'check' });
	if (g.loose && GIRTH_SITES.includes(site))
		out.push({ reason: 'loose_clothing', severity: 'check' });
	if (views.some((v) => (g.marker_confidence[v] ?? 1) < rules.marker_confidence_min))
		out.push({ reason: 'marker_weak', severity: 'check' });
	return out;
}

/**
 * Combine issues into one Measurement row. Any fail → flag 'fail' and
 * value_mm = null (C4); otherwise any check → 'check'; else 'pass'.
 */
export function finalise(
	site: SiteCode,
	value: number | null,
	issues: Issue[],
	rules: RulesConfig,
	extra: Partial<Measurement> = {}
): Measurement {
	const all = [...issues];
	if (value != null) {
		const [lo, hi] = rules.plausible_mm[site];
		if (!Number.isFinite(value) || value < lo || value > hi)
			all.push({ reason: 'out_of_range', severity: 'fail' });
	} else if (!all.some((i) => i.severity === 'fail')) {
		all.push({ reason: 'view_failed', severity: 'fail' });
	}
	const fails = all.filter((i) => i.severity === 'fail');
	const flag: Flag = fails.length ? 'fail' : all.length ? 'check' : 'pass';
	const reasons: FlagReason[] = [];
	for (const i of [...fails, ...all.filter((x) => x.severity === 'check')])
		if (!reasons.includes(i.reason)) reasons.push(i.reason);
	return {
		site_code: site,
		value_mm: flag === 'fail' || value == null ? null : Math.round(value),
		method: 'auto',
		confidence_flag: flag,
		flag_reasons: reasons,
		...extra
	};
}
