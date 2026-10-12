<script lang="ts">
	import type { CaptureSession, Measurement, Sex } from '$lib/api/types';
	import { ISO_TERMS, SITES } from '$lib/domain/sites';
	import { formatLength } from '$lib/domain/units';
	import { INTL_LOCALE, locale, t } from '$lib/i18n/t.svelte';
	import BottomSheet from '$lib/ui/BottomSheet.svelte';
	import FlagBadge from '$lib/ui/FlagBadge.svelte';
	import Silhouette, { type SilhouetteItem } from '$lib/ui/Silhouette.svelte';
	import { GIRTHS, SITE_VIEW, reasonKey, siteLabelKey, type DisplaySite } from './present';

	/**
	 * Silhouette + accessible list + flag explanation strip (Section 9.10).
	 * Read-only: clients never edit values.
	 */
	let {
		measurements,
		sex,
		session
	}: {
		measurements: Measurement[];
		sex?: Sex;
		session: Pick<CaptureSession, 'scale_disagreement_pct'>;
	} = $props();

	let selected = $state<DisplaySite | null>(null);
	let sheetOpen = $state(false);

	const byId = $derived(
		Object.fromEntries(measurements.map((m) => [m.site_code, m])) as Record<string, Measurement>
	);
	const fmt = (mm: number | null) => formatLength(mm, 'cm', INTL_LOCALE[locale.lang]);
	const label = (s: DisplaySite) => t(siteLabelKey(s, sex));

	function reasonText(m: Measurement): string {
		const r = m.flag_reasons[0];
		if (!r) return '';
		return t(reasonKey(r), { pct: session.scale_disagreement_pct.toFixed(1) });
	}

	const items: SilhouetteItem[] = $derived(
		SITES.filter((s) => byId[s]).map((s) => ({
			site: s,
			label: label(s),
			value: fmt(byId[s]!.value_mm),
			flag: byId[s]!.confidence_flag,
			iso: ISO_TERMS[s]
		}))
	);
	const flagged = $derived(SITES.filter((s) => byId[s] && byId[s]!.confidence_flag !== 'pass'));

	function open(site: DisplaySite) {
		selected = site;
		sheetOpen = true;
	}
	const sel = $derived(selected ? byId[selected] : null);
</script>

<Silhouette
	{items}
	selected={sheetOpen ? selected : null}
	onselect={(s) => open(s as DisplaySite)}
/>

<section class="flags" aria-labelledby="flags-h">
	<h2 id="flags-h">{t('review.flagsTitle')}</h2>
	{#if flagged.length === 0}
		<p class="ok">{t('review.noFlags')}</p>
	{:else}
		<ul>
			{#each flagged as s (s)}
				<li class={byId[s]!.confidence_flag}>
					<strong>{label(s)}</strong> — {t(`flag.${byId[s]!.confidence_flag}`)}: {reasonText(
						byId[s]!
					)}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section aria-labelledby="list-h">
	<h2 id="list-h">{t('review.listTitle')}</h2>
	<ul class="list">
		{#each SITES.filter((s) => byId[s]) as s (s)}
			{@const m = byId[s]!}
			<li>
				<button type="button" class="row" onclick={() => open(s)}>
					<span class="name">
						{label(s)}
						<span class="iso">{ISO_TERMS[s]}</span>
					</span>
					<span class="val vt-num">{fmt(m.value_mm)}</span>
					<FlagBadge flag={m.confidence_flag} size="sm" />
				</button>
			</li>
		{/each}
	</ul>
</section>

<BottomSheet bind:open={sheetOpen} title={selected ? label(selected) : ''}>
	{#if selected && sel}
		<p class="big vt-num">{fmt(sel.value_mm)}</p>
		<FlagBadge flag={sel.confidence_flag} reason={reasonText(sel) || undefined} />
		<dl>
			<dt>{t('review.detail.what')}</dt>
			<dd>{t(`review.what.${selected}`)}</dd>
			<dt>{t('review.detail.how')}</dt>
			<dd>{t(GIRTHS.includes(selected) ? 'review.how.girth' : 'review.how.length')}</dd>
			<dt>{t('review.detail.view')}</dt>
			<dd>{t(`review.fromView.${SITE_VIEW[selected]}`)}</dd>
		</dl>
		<p class="vt-small vt-muted">{ISO_TERMS[selected]}</p>
	{/if}
</BottomSheet>

<style>
	h2 {
		font-size: var(--vt-fs-18);
		margin-top: var(--vt-s-24);
	}
	.flags ul {
		padding: 0;
		margin: 0;
		list-style: none;
		display: grid;
		gap: var(--vt-s-8);
	}
	.flags li {
		padding: var(--vt-s-8) var(--vt-s-12);
		border-radius: var(--vt-radius);
		border-left: 4px solid;
	}
	.flags li.check {
		background: var(--vt-check-fill);
		border-color: var(--vt-check);
		color: var(--vt-check-ink);
	}
	.flags li.fail {
		background: var(--vt-fail-fill);
		border-color: var(--vt-fail);
	}
	.ok {
		color: var(--vt-pass);
		font-weight: 600;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--vt-line);
	}
	.row {
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-items: center;
		gap: var(--vt-s-12);
		width: 100%;
		min-height: 56px;
		padding: var(--vt-s-8) var(--vt-s-4);
		border: 0;
		border-bottom: 1px solid var(--vt-line);
		background: transparent;
		text-align: left;
		cursor: pointer;
	}
	.name {
		display: grid;
		font-weight: 700;
	}
	.iso {
		font-weight: 400;
		font-size: 0.75rem;
		color: var(--vt-ink-muted);
	}
	.val {
		font-weight: 700;
		font-size: var(--vt-fs-18);
	}
	.big {
		font-size: var(--vt-fs-36);
		font-weight: 800;
		margin: 0;
	}
	dl {
		display: grid;
		gap: var(--vt-s-4);
	}
	dt {
		font-weight: 700;
		margin-top: var(--vt-s-8);
	}
	dd {
		margin: 0;
	}
</style>
