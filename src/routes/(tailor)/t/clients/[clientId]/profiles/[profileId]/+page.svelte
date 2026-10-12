<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { api } from '$lib/api';
	import type { CheckState, ViewChecks } from '$lib/api/types';
	import { problemKey } from '$lib/dashboard/errors';
	import { reasonText, siteLabel } from '$lib/dashboard/flags';
	import { len } from '$lib/dashboard/format';
	import { Resource } from '$lib/dashboard/resource.svelte';
	import { ISO_TERMS, SITES } from '$lib/domain/sites';
	import { formatDateTime, t } from '$lib/i18n/t.svelte';
	import Banner from '$lib/ui/Banner.svelte';
	import Button from '$lib/ui/Button.svelte';
	import DataTable from '$lib/ui/DataTable.svelte';
	import ErrorState from '$lib/ui/ErrorState.svelte';
	import FlagBadge from '$lib/ui/FlagBadge.svelte';
	import Icon from '$lib/ui/Icon.svelte';
	import Silhouette from '$lib/ui/Silhouette.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';

	const clientId = $derived(page.params.clientId!);
	const profileId = $derived(page.params.profileId!);
	// Opening this page logs a profile view on the server (FR-20).
	const res = new Resource(() => api().getProfile(profileId));
	$effect(() => {
		void profileId;
		void res.load();
	});
	const p = $derived(res.data);

	const rows = $derived(
		p
			? SITES.map((site, i) => {
					const m = p.measurements.find((x) => x.site_code === site)!;
					return { n: i + 1, site, m };
				})
			: []
	);
	const stature = $derived(p?.measurements.find((m) => m.site_code === 'stature'));
	const flagged = $derived(rows.filter((r) => r.m.confidence_flag !== 'pass'));
	const items = $derived(
		rows.map((r) => ({
			site: r.site,
			label: siteLabel(r.site, p?.covariates.sex),
			value: len(r.m.value_mm),
			flag: r.m.confidence_flag
		}))
	);
	const columns = $derived([
		{ key: 'site', label: t('tailor.sheet.site'), primary: true },
		{ key: 'value', label: t('tailor.sheet.value'), align: 'end' as const },
		{ key: 'flag', label: t('tailor.sheet.flag') },
		{ key: 'method', label: t('tailor.sheet.method') }
	]);
	const CHECKS = [
		'level',
		'frame',
		'marker',
		'symmetry',
		'arms',
		'light'
	] as const satisfies readonly (keyof ViewChecks)[];
	const checkWord = (s: CheckState) => t(`tailor.check.${s}`);
</script>

<svelte:head><title>{t('tailor.sheet.title')} · {t('app.name')}</title></svelte:head>

<a class="back" href={resolve('/(tailor)/t/clients/[clientId]', { clientId })}
	>‹ {p?.client_code ?? t('tailor.client.title')}</a
>

{#if res.loading && !p}
	<Skeleton lines={8} height={24} />
{:else if res.error && !p}
	<ErrorState body={t(problemKey(res.error))} onretry={() => res.load()} />
{:else if p}
	<h1>{t('tailor.sheet.heading', { code: p.client_code, version: p.version })}</h1>
	<p class="summary vt-muted">
		{formatDateTime(p.captured_at)} · {t('tailor.client.profileVersion', { version: p.version })} · {t(
			`tailor.mode.${p.session.capture_mode}`
		)}
		· {p.session.device_model} · {t('tailor.sheet.model', { variant: p.session.model_variant })} · {t(
			'tailor.sheet.rules',
			{ version: p.rules_version }
		)}
	</p>

	{#if flagged.length}
		<Banner tone="warning"
			><Icon name="triangle" size={18} /> {t('tailor.sheet.confirmAtFitting')}</Banner
		>
	{/if}

	<div class="grid">
		<div class="table">
			<DataTable {columns} {rows} key={(r) => r.site} caption={t('tailor.sheet.title')}>
				{#snippet cell(r, col)}
					{#if col.key === 'site'}
						<span class="site"
							><span class="num" aria-hidden="true">{r.n}</span><span
								>{siteLabel(r.site, p.covariates.sex)}<br /><span class="iso"
									>{ISO_TERMS[r.site]}</span
								></span
							></span
						>
					{:else if col.key === 'value'}<span class="vt-num val">{len(r.m.value_mm)}</span>
					{:else if col.key === 'flag'}<FlagBadge
							flag={r.m.confidence_flag}
							reason={reasonText(r.m, p.session.scale_disagreement_pct) || undefined}
						/>
					{:else}{r.m.method === 'override'
							? t('tailor.sheet.methodOverride')
							: t('tailor.sheet.methodAuto')}{/if}
				{/snippet}
			</DataTable>
			{#if stature}
				<p class="vt-small">
					{t('tailor.sheet.heightCheck', {
						entered: len(p.covariates.height_mm_entered),
						estimated: len(stature.value_mm)
					})}
				</p>
			{/if}
		</div>
		<div class="fig">
			<Silhouette {items} mode="numbers" title={t('tailor.sheet.diagram')} />
		</div>
	</div>

	<section aria-labelledby="checks-h">
		<h2 id="checks-h">{t('tailor.sheet.checks')}</h2>
		<table class="checks">
			<thead
				><tr
					><th scope="col">{t('tailor.sheet.check')}</th><th scope="col">{t('steps.front')}</th><th
						scope="col">{t('steps.side')}</th
					></tr
				></thead
			>
			<tbody>
				{#each CHECKS as k (k)}
					<tr
						><th scope="row">{t(`tailor.checkName.${k}`)}</th><td
							>{checkWord(p.session.front_checks[k])}</td
						><td>{checkWord(p.session.side_checks[k])}</td></tr
					>
				{/each}
			</tbody>
		</table>
		<ul class="facts">
			<li>{t('tailor.sheet.scaleDiff', { pct: p.session.scale_disagreement_pct.toFixed(1) })}</li>
			<li>{t('tailor.sheet.retakes', { count: p.session.retake_count })}</li>
			<li>
				{t('tailor.sheet.fitDeclared', { fit: t(`tailor.fit.${p.covariates.clothing_fit}`) })}
			</li>
		</ul>
	</section>

	<div class="actions">
		<Button href={`${resolve('/t/orders/new')}?profileId=${p.profile_id}`} icon="plus"
			>{t('tailor.sheet.newOrder')}</Button
		>
		<Button variant="secondary" icon="print" onclick={() => window.print()}
			>{t('tailor.sheet.print')}</Button
		>
	</div>
{/if}

<style>
	.back {
		display: inline-flex;
		align-items: center;
		min-height: var(--vt-target);
		font-weight: 600;
	}
	.summary {
		font-size: var(--vt-fs-14);
	}
	.grid {
		display: grid;
		gap: var(--vt-s-24);
		margin-top: var(--vt-s-16);
	}
	@media (min-width: 1024px) {
		.grid {
			grid-template-columns: 1fr 14rem;
			align-items: start;
		}
	}
	.site {
		display: inline-flex;
		gap: var(--vt-s-8);
		align-items: flex-start;
		text-align: left;
	}
	.num {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--vt-thread);
		color: var(--vt-thread-ink);
		font-size: 0.75rem;
		font-weight: 800;
		flex: none;
	}
	.iso {
		font-size: 0.75rem;
		color: var(--vt-ink-muted);
		font-weight: 400;
	}
	.val {
		font-weight: 800;
		white-space: nowrap;
	}
	section {
		margin-top: var(--vt-s-24);
	}
	.checks {
		border-collapse: collapse;
		min-width: 18rem;
	}
	.checks th,
	.checks td {
		text-align: left;
		padding: var(--vt-s-8) var(--vt-s-12);
		border-bottom: 1px solid var(--vt-line);
	}
	.facts {
		padding-left: var(--vt-s-16);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--vt-s-8);
		margin-top: var(--vt-s-24);
	}
	@media print {
		.actions,
		.back {
			display: none;
		}
	}
</style>
