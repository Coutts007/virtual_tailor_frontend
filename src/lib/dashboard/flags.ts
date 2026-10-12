import type { FlagSummary, Measurement, SiteCode, Sex } from '$lib/api/types';
import type { MessageKey } from '$lib/i18n/en';
import { t } from '$lib/i18n/t.svelte';

/** "7 good · 1 check" (only non-zero parts). */
export function flagSummaryText(f: FlagSummary | null | undefined): string {
	if (!f) return '—';
	const parts: string[] = [];
	if (f.pass) parts.push(t('tailor.flags.good', { count: f.pass }));
	if (f.check) parts.push(t('tailor.flags.check', { count: f.check }));
	if (f.fail) parts.push(t('tailor.flags.fail', { count: f.fail }));
	return parts.join(' · ') || '—';
}

/** Plain-language reasons for a measurement's flag (FR-08). */
export function reasonText(m: Pick<Measurement, 'flag_reasons'>, scalePct?: number): string {
	return m.flag_reasons
		.map((r) => t(`flagReason.${r}`, { pct: (scalePct ?? 0).toFixed(1) }))
		.join(' ');
}

/** Tailor's site label; chest reads "Bust" for female clients (Section 9.10). */
export function siteLabel(site: SiteCode, sex?: Sex): string {
	const key: MessageKey =
		site === 'chest' && sex === 'female' ? 'site.bust' : (`site.${site}` as MessageKey);
	return t(key);
}
