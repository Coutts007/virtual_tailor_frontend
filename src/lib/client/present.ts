/** Presentation helpers for measurements on client screens (9.10, 9.12). */
import type { Flag, FlagReason, Measurement, Sex, SiteCode } from '$lib/api/types';
import type { MessageKey } from '$lib/i18n/en';
import type { View } from '$lib/capture/checks';

export type DisplaySite = Exclude<SiteCode, 'stature'>;

export function siteLabelKey(site: SiteCode, sex?: Sex): MessageKey {
	if (site === 'chest' && sex === 'female') return 'site.bust';
	return `site.${site}`;
}

/** Which photo each site comes from (Table 3.1). */
export const SITE_VIEW: Record<DisplaySite, View | 'both'> = {
	neck: 'both',
	shoulder: 'front',
	chest: 'both',
	waist: 'both',
	hip: 'both',
	sleeve: 'front',
	outleg: 'side',
	inleg: 'front'
};

export const GIRTHS: DisplaySite[] = ['neck', 'chest', 'waist', 'hip'];

const SEVERITY: Record<Flag, number> = { pass: 0, check: 1, fail: 2 };

/** Primary reason key for a flagged measurement. */
export function reasonKey(r: FlagReason): MessageKey {
	return `flagReason.${r}`;
}

/** The worst flagged site, and the view to retake for it (9.10 retake row). */
export function worstSite(
	ms: Measurement[],
	markerConf: { front: number; side: number }
): { site: DisplaySite; view: View } | null {
	let worst: Measurement | null = null;
	for (const m of ms) {
		if (m.site_code === 'stature' || m.confidence_flag === 'pass') continue;
		if (!worst || SEVERITY[m.confidence_flag] > SEVERITY[worst.confidence_flag]) worst = m;
	}
	if (!worst) return null;
	const site = worst.site_code as DisplaySite;
	const v = SITE_VIEW[site];
	return {
		site,
		view: v === 'both' ? (markerConf.front <= markerConf.side ? 'front' : 'side') : v
	};
}

export function flagCounts(ms: Measurement[]) {
	const c = { pass: 0, check: 0, fail: 0 };
	for (const m of ms) if (m.site_code !== 'stature') c[m.confidence_flag]++;
	return c;
}
