<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n/t.svelte';
	import { setSetting } from '$lib/db/settings';
	import { getDeviceInfo } from '$lib/device/deviceInfo';
	import { runPreflight, type CheckStatus, type PreflightRow } from '$lib/device/preflight';
	import { modelsCached, MODEL_DOWNLOAD_MB } from '$lib/vision/assets';
	import { isSimulated } from '$lib/vision';
	import { draft, loadDraft } from '$lib/client/flow.svelte';
	import ClientHeader from '$lib/client/ClientHeader.svelte';
	import Page from '$lib/client/Page.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Icon, { type IconName } from '$lib/ui/Icon.svelte';
	import QRCode from '$lib/ui/QRCode.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';

	/** Phone check (9.4): plain-language checklist and one overall verdict. Never a dead end. */
	let running = $state(true);
	let showOther = $state(false);
	const result = $derived(draft.preflight);

	onMount(async () => {
		await loadDraft();
		const device = await getDeviceInfo();
		const r = await runPreflight(device, {
			modelsCached: await modelsCached(),
			modelMb: MODEL_DOWNLOAD_MB,
			simulated: isSimulated()
		});
		draft.preflight = r;
		await setSetting('preflight', r);
		running = false;
	});

	const ICON: Record<CheckStatus, IconName> = {
		pass: 'check',
		caution: 'triangle',
		fail: 'x',
		skip: 'circle',
		pending: 'clock'
	};

	function message(row: PreflightRow): string | null {
		if (row.id === 'models')
			return row.detail?.cached
				? t('check.msg.modelsCached')
				: t('check.msg.modelsDownload', { mb: row.detail?.mb ?? MODEL_DOWNLOAD_MB });
		if (row.detail?.simulated) return t('check.msg.simulated');
		if (row.status === 'pending') return t('check.msg.cameraLater');
		if (row.status === 'pass' || row.status === 'skip') return null;
		return t(`check.msg.${row.id}`);
	}
	const shareUrl = $derived(
		typeof location === 'undefined'
			? ''
			: `${location.origin}/start${draft.client_code ? `?code=${draft.client_code}` : ''}`
	);
</script>

<svelte:head><title>{t('check.title')} · {t('app.name')}</title></svelte:head>

<ClientHeader title={t('check.title')} back="/consent" step="setup" />

<Page>
	{#if running || !result}
		<p aria-live="polite">{t('check.running')}</p>
		<Skeleton lines={6} height={28} />
	{:else}
		<div class="verdict {result.verdict}" role="status">
			<Icon
				name={result.verdict === 'ready' ? 'check' : result.verdict === 'slower' ? 'triangle' : 'x'}
				size={32}
				stroke={3}
			/>
			<div>
				<h2>{t(`check.verdict.${result.verdict}`)}</h2>
				<p>{t(`check.verdictBody.${result.verdict}`)}</p>
			</div>
		</div>
		<ul class="rows">
			{#each result.rows as row (row.id)}
				{@const msg = message(row)}
				<li class={row.status}>
					<Icon name={ICON[row.status]} size={22} stroke={2.6} />
					<span class="name">{t(`check.row.${row.id}`)}</span>
					<span class="status">{t(`check.status.${row.status}`)}</span>
					{#if msg}<span class="msg">{msg}</span>{/if}
				</li>
			{/each}
		</ul>

		{#if result.verdict === 'cannot'}
			<div class="alts">
				<h2>{t('check.inPerson')}</h2>
				<p>{t('check.inPersonBody', { code: draft.client_code || '—' })}</p>
				<Button
					variant="secondary"
					full
					onclick={() => (showOther = !showOther)}
					aria-expanded={showOther}>{t('check.otherPhone')}</Button
				>
				{#if showOther}
					<p>{t('check.otherPhoneBody')}</p>
					<p class="url vt-mono">{shareUrl}</p>
					<QRCode text={shareUrl} size={180} />
				{/if}
			</div>
		{/if}
	{/if}

	{#snippet actions()}
		{#if result && !running && result.verdict !== 'cannot'}
			<Button
				size="lg"
				full
				onclick={() => goto(draft.print_check_ok ? resolve('/setup') : resolve('/sheet'))}
				>{t('common.continue')}</Button
			>
		{/if}
	{/snippet}
</Page>

<style>
	.verdict {
		display: flex;
		gap: var(--vt-s-12);
		align-items: flex-start;
		padding: var(--vt-s-16);
		border-radius: var(--vt-radius-lg);
		margin-bottom: var(--vt-s-16);
	}
	.verdict h2 {
		margin: 0 0 var(--vt-s-4);
	}
	.verdict p {
		margin: 0;
	}
	.ready {
		background: var(--vt-pass-fill);
		color: var(--vt-pass);
	}
	.ready p,
	.slower p {
		color: var(--vt-ink);
	}
	.slower {
		background: var(--vt-check-fill);
		color: var(--vt-check-ink);
	}
	.cannot {
		background: var(--vt-fail-fill);
		color: var(--vt-fail);
	}
	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.rows li {
		display: grid;
		grid-template-columns: 28px 1fr auto;
		gap: 2px var(--vt-s-8);
		align-items: center;
		padding: var(--vt-s-12) 0;
		border-bottom: 1px solid var(--vt-line);
	}
	.name {
		font-weight: 600;
	}
	.status {
		font-size: var(--vt-fs-14);
		font-weight: 700;
	}
	.msg {
		grid-column: 2 / 4;
		font-size: var(--vt-fs-14);
		color: var(--vt-ink-muted);
	}
	li.pass :global(.icon),
	li.pass .status {
		color: var(--vt-pass);
	}
	li.caution :global(.icon) {
		color: var(--vt-check);
	}
	li.caution .status {
		color: var(--vt-check-ink);
	}
	li.fail :global(.icon),
	li.fail .status {
		color: var(--vt-fail);
	}
	li.skip,
	li.pending {
		color: var(--vt-ink-muted);
	}
	.alts {
		margin-top: var(--vt-s-24);
		display: grid;
		gap: var(--vt-s-8);
	}
	.url {
		word-break: break-all;
		padding: var(--vt-s-8);
		background: var(--vt-paper);
		border-radius: var(--vt-radius);
	}
</style>
