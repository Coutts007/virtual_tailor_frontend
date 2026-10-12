/**
 * Measurement module (Section 11): pure, deterministic, no DOM. Input is the
 * per-view median landmarks, mask and marker corners; output is the nine
 * measurement rows with flags, the scales and the rules provenance.
 */
import { ALL_SITES } from '$lib/domain/sites';
import { finalise, globalIssues, SITE_VIEWS, type GlobalFlagContext } from './flags';
import { View } from './levels';
import { configHash, resolveRules } from './rules';
import { disagreementPct, markerScale, statureScale } from './scale';
import { SITE_RULES, torsoFrame, type SiteContext } from './sites';
import type { MeasureInput, MeasureResult, ViewName } from './types';

export { RULES_VERSION, DEFAULT_RULES, configHash, resolveRules } from './rules';
export { ellipsePerimeter, girth } from './girth';
export type * from './types';

export function computeProfile(input: MeasureInput): MeasureResult {
	const rules = resolveRules(input.config);
	const front = new View(input.front);
	const side = new View(input.side);
	const mf = markerScale(input.front.marker, input.front.frame, rules);
	const ms = markerScale(input.side.marker, input.side.frame, rules);

	const failed_views: ViewName[] = [];
	if (!mf.ok || !front.bounds || !(torsoFrame(front).span > 0)) failed_views.push('front');
	if (!ms.ok || !side.bounds) failed_views.push('side');

	const scale_front = failed_views.includes('front') ? 0 : mf.scale;
	const scale_side = failed_views.includes('side') ? 0 : ms.scale;
	const scale_stature = front.bounds ? statureScale(input.height_mm, front.heightPx) : 0;
	const disagreement = disagreementPct(scale_front, scale_stature);

	const g: GlobalFlagContext = {
		disagreement_pct: disagreement,
		level_unchecked: input.level_unchecked,
		loose: input.clothing_fit === 'loose',
		marker_confidence: { front: mf.confidence, side: ms.confidence },
		failed_views
	};
	const ctx: SiteContext = { front, side, sf: scale_front, ss: scale_side, rules, sex: input.sex };

	const measurements = ALL_SITES.map((site) => {
		const global = globalIssues(site, g, rules);
		if (SITE_VIEWS[site].some((v) => failed_views.includes(v)))
			return finalise(site, null, global, rules);
		const r = SITE_RULES[site](ctx);
		return finalise(site, r.value, [...r.issues, ...global], rules, {
			correction_factor: r.correction_factor,
			level_fraction: r.level_fraction,
			half_width_mm: r.half_width_mm,
			half_depth_mm: r.half_depth_mm
		});
	});
	// Drop undefined optional fields so payloads stay compact.
	for (const m of measurements)
		for (const k of Object.keys(m) as (keyof typeof m)[]) if (m[k] === undefined) delete m[k];

	let retake_view: ViewName | null = failed_views[0] ?? null;
	if (!retake_view && disagreement > rules.scale_fail_pct)
		retake_view = ms.confidence < mf.confidence ? 'side' : 'front';

	return {
		measurements,
		scale_front_mm_px: round4(scale_front),
		scale_side_mm_px: round4(scale_side),
		scale_stature_mm_px: round4(scale_stature),
		scale_disagreement_pct: Math.round(disagreement * 100) / 100,
		retake_view,
		failed_views,
		stature_estimated_mm: failed_views.includes('front')
			? null
			: Math.round(front.heightPx * scale_front),
		rules_version: rules.rules_version,
		config_hash: configHash(rules)
	};
}

function round4(v: number) {
	return Math.round(v * 1e4) / 1e4;
}
