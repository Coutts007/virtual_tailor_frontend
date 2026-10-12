<script lang="ts">
	import { api } from '$lib/api';
	import type { ConflictPair, MeasurementProfile } from '$lib/api/types';
	import { refreshConflicts } from '$lib/dashboard/conflicts.svelte';
	import { problemKey } from '$lib/dashboard/errors';
	import { siteLabel } from '$lib/dashboard/flags';
	import { len } from '$lib/dashboard/format';
	import { loadMe } from '$lib/dashboard/me.svelte';
	import { Resource } from '$lib/dashboard/resource.svelte';
	import { network } from '$lib/device/network.svelte';
	import { SITES } from '$lib/domain/sites';
	import { formatDateTime, t } from '$lib/i18n/t.svelte';
	import Button from '$lib/ui/Button.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import ErrorState from '$lib/ui/ErrorState.svelte';
	import FlagBadge from '$lib/ui/FlagBadge.svelte';
	import LastUpdated from '$lib/ui/LastUpdated.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import { toast } from '$lib/ui/toast.svelte';

	/** Differences ≥ 5 mm are highlighted. */
	const DIFF_MM = 5;
	const res = new Resource(async () => {
		await loadMe();
		return api().listConflicts();
	});
	$effect(() => void res.load());
	let busy = $state<string | null>(null);

	const val = (p: MeasurementProfile, site: string) =>
		p.measurements.find((m) => m.site_code === site);
	function differs(c: ConflictPair, site: string) {
		const a = val(c.server, site)?.value_mm;
		const b = val(c.device, site)?.value_mm;
		if (a == null || b == null) return a !== b;
		return Math.abs(a - b) >= DIFF_MM;
	}

	async function resolveIt(c: ConflictPair, keep: 'newer' | 'server') {
		busy = c.profile_id + keep;
		try {
			await api().resolveConflict(c.profile_id, keep);
			toast(
				t(keep === 'newer' ? 'tailor.conflicts.keptNewer' : 'tailor.conflicts.keptServer', {
					code: c.client_code
				}),
				{ tone: 'success' }
			);
			await res.load();
			await refreshConflicts();
		} catch (e) {
			toast(t(problemKey(e)), { tone: 'error' });
		} finally {
			busy = null;
		}
	}
</script>

<svelte:head><title>{t('tailor.conflicts.title')} · {t('app.name')}</title></svelte:head>

<div class="head">
	<h1>{t('tailor.conflicts.title')}</h1>
	<LastUpdated at={res.updatedAt} />
</div>
<p class="vt-muted">{t('tailor.conflicts.intro')}</p>

{#if res.loading && !res.data}
	<Skeleton lines={6} />
{:else if res.error && !res.data}
	<ErrorState body={t(problemKey(res.error))} onretry={() => res.load()} />
{:else if res.data && res.data.length === 0}
	<EmptyState title={t('tailor.conflicts.empty')} icon="check" />
{:else if res.data}
	{#each res.data as c (c.profile_id)}
		<section class="pair" aria-labelledby={`c-${c.profile_id}`}>
			<h2 id={`c-${c.profile_id}`}>
				<span class="vt-mono">{c.client_code}</span>{#if c.display_name}
					({c.display_name}){/if}
			</h2>
			<div class="scroll">
				<table>
					<thead>
						<tr>
							<th scope="col">{t('tailor.sheet.site')}</th>
							<th scope="col"
								>{t('tailor.conflicts.server', { version: c.server.version })}<br /><span
									class="vt-small">{formatDateTime(c.server.captured_at)}</span
								></th
							>
							<th scope="col"
								>{t('tailor.conflicts.device', { version: c.device.version })}<br /><span
									class="vt-small">{formatDateTime(c.device.captured_at)}</span
								></th
							>
						</tr>
					</thead>
					<tbody>
						{#each SITES as site (site)}
							{@const a = val(c.server, site)}
							{@const b = val(c.device, site)}
							<tr class:diff={differs(c, site)}>
								<th scope="row"
									>{siteLabel(site, c.server.covariates.sex)}{#if differs(c, site)}<span
											class="vt-visually-hidden"
										>
											({t('tailor.conflicts.different')})</span
										>{/if}</th
								>
								<td
									><span class="vt-num">{len(a?.value_mm)}</span>
									{#if a}<FlagBadge flag={a.confidence_flag} size="sm" />{/if}</td
								>
								<td
									><span class="vt-num">{len(b?.value_mm)}</span>
									{#if b}<FlagBadge flag={b.confidence_flag} size="sm" />{/if}</td
								>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="row">
				<Button
					loading={busy === c.profile_id + 'newer'}
					disabled={!network.online}
					onclick={() => resolveIt(c, 'newer')}>{t('tailor.conflicts.useNewer')}</Button
				>
				<Button
					variant="secondary"
					loading={busy === c.profile_id + 'server'}
					disabled={!network.online}
					onclick={() => resolveIt(c, 'server')}>{t('tailor.conflicts.keepServer')}</Button
				>
			</div>
		</section>
	{/each}
{/if}

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--vt-s-8);
	}
	.pair {
		margin-top: var(--vt-s-16);
		padding: var(--vt-s-16);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius-lg);
	}
	.scroll {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}
	th,
	td {
		text-align: left;
		padding: var(--vt-s-8);
		border-bottom: 1px solid var(--vt-line);
		vertical-align: top;
	}
	tr.diff td,
	tr.diff th {
		background: var(--vt-check-fill);
		color: var(--vt-check-ink);
		font-weight: 700;
	}
	tr.diff th {
		box-shadow: inset 4px 0 0 var(--vt-check);
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--vt-s-8);
		margin-top: var(--vt-s-12);
	}
</style>
