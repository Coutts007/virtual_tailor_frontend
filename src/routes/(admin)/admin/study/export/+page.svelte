<script lang="ts">
	import { api } from '$lib/api';
	import { problemKey } from '$lib/dashboard/errors';
	import { downloadBlob } from '$lib/dashboard/format';
	import { network } from '$lib/device/network.svelte';
	import { nairobiToday } from '$lib/domain/validate';
	import { t } from '$lib/i18n/t.svelte';
	import Button from '$lib/ui/Button.svelte';
	import StudyImageVault from '$lib/ui/StudyImageVault.svelte';
	import { toast } from '$lib/ui/toast.svelte';

	let busy = $state<'captures' | 'reference' | null>(null);
	let status = $state('');

	async function download(kind: 'captures' | 'reference') {
		busy = kind;
		status = t('admin.export.preparing');
		try {
			const csv = await api().exportStudyCsv(kind);
			downloadBlob(
				new Blob([csv], { type: 'text/csv;charset=utf-8' }),
				`vt-study-${kind}-${nairobiToday()}.csv`
			);
			status = t('admin.export.done', { rows: Math.max(0, csv.trim().split('\n').length - 1) });
		} catch (e) {
			status = '';
			toast(t(problemKey(e)), { tone: 'error' });
		} finally {
			busy = null;
		}
	}
</script>

<svelte:head><title>{t('admin.study.exports')} · {t('app.name')}</title></svelte:head>

<h1>{t('admin.study.exports')}</h1>
<p class="vt-muted">{t('admin.export.intro')}</p>

<div class="grid">
	<section class="panel" aria-labelledby="cap-h">
		<h2 id="cap-h">{t('admin.export.captures')}</h2>
		<p class="vt-small">{t('admin.export.capturesHint')}</p>
		<Button
			icon="download"
			loading={busy === 'captures'}
			disabled={!network.online || busy !== null}
			onclick={() => download('captures')}>{t('admin.export.capturesButton')}</Button
		>
	</section>
	<section class="panel" aria-labelledby="ref-h">
		<h2 id="ref-h">{t('admin.export.reference')}</h2>
		<p class="vt-small">{t('admin.export.referenceHint')}</p>
		<Button
			icon="download"
			loading={busy === 'reference'}
			disabled={!network.online || busy !== null}
			onclick={() => download('reference')}>{t('admin.export.referenceButton')}</Button
		>
	</section>
</div>
<p class="vt-small" role="status" aria-live="polite">{status}</p>

<StudyImageVault />

<style>
	.grid {
		display: grid;
		gap: var(--vt-s-16);
		margin-bottom: var(--vt-s-16);
	}
	@media (min-width: 768px) {
		.grid {
			grid-template-columns: 1fr 1fr;
		}
	}
	.panel {
		display: grid;
		gap: var(--vt-s-8);
		justify-items: start;
		padding: var(--vt-s-16);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius-lg);
	}
</style>
