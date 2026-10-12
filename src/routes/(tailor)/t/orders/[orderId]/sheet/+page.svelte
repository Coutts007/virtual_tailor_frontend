<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { api, auth } from '$lib/api';
	import { mockReady } from '$lib/api/mockReady';
	import type { Order, SheetResponse, ShareVia } from '$lib/api/types';
	import { problemKey } from '$lib/dashboard/errors';
	import { downloadBlob } from '$lib/dashboard/format';
	import { loadMe, meStore } from '$lib/dashboard/me.svelte';
	import { openExternal, waLink } from '$lib/dashboard/share';
	import { network } from '$lib/device/network.svelte';
	import { t } from '$lib/i18n/t.svelte';
	import Banner from '$lib/ui/Banner.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import ErrorState from '$lib/ui/ErrorState.svelte';
	import RadioCards from '$lib/ui/RadioCards.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import { toast } from '$lib/ui/toast.svelte';

	const orderId = $derived(page.params.orderId!);
	let order = $state<Order | null>(null);
	let loadError = $state<unknown>(null);
	let includeName = $state(false);
	let format = $state<'png' | 'pdf'>('png');
	let sheet = $state<SheetResponse | null>(null);
	let previewUrl = $state<string | null>(null);
	let generating = $state(false);
	let genError = $state<string | null>(null);
	let attachHint = $state(false);
	let busy = $state<ShareVia | null>(null);

	$effect(() => {
		void orderId;
		void (async () => {
			try {
				const [o, me] = await Promise.all([api().getOrder(orderId), loadMe()]);
				order = o;
				includeName = !!o.display_name && me.include_name_default;
			} catch (e) {
				loadError = e;
			}
		})();
	});

	// A new choice invalidates the generated sheet.
	$effect(() => {
		void includeName;
		untrack(clearSheet);
	});

	function clearSheet() {
		sheet = null;
		attachHint = false;
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
	}
	onDestroy(clearSheet);

	/** Sheet files are fetched with the auth header (an <img> cannot send it). */
	async function fetchFile(url: string): Promise<Blob> {
		await mockReady();
		const r = await fetch(url, { headers: auth().headers(), cache: 'no-store' });
		if (!r.ok) throw new Error(String(r.status));
		return r.blob();
	}

	async function generate() {
		if (!order) return;
		generating = true;
		genError = null;
		try {
			const s = await api().generateSheet(order.order_id, includeName);
			const png = await fetchFile(s.png_url);
			clearSheet();
			sheet = s;
			previewUrl = URL.createObjectURL(png);
		} catch (e) {
			genError = t(problemKey(e));
		} finally {
			generating = false;
		}
	}

	const fileBase = $derived(order ? `${order.order_no}-${order.client_code}` : 'sheet');

	async function log(via: ShareVia) {
		if (sheet)
			await api()
				.logShare(sheet.sheet_id, via)
				.catch(() => {});
	}

	async function shareWhatsApp() {
		if (!sheet) return;
		busy = 'whatsapp_share';
		try {
			const blob = await fetchFile(sheet.png_url);
			const ext = blob.type === 'image/png' ? 'png' : 'svg';
			const file = new File([blob], `${fileBase}.${ext}`, { type: blob.type });
			if (navigator.canShare?.({ files: [file] })) {
				try {
					await navigator.share({ files: [file], text: sheet.share_text });
					await log('whatsapp_share');
					return;
				} catch (e) {
					if ((e as DOMException).name === 'AbortError') return;
				}
			}
			// Fallback: save the picture, open WhatsApp with the text (iOS path too).
			downloadBlob(blob, file.name);
			openExternal(waLink(sheet.share_text));
			attachHint = true;
			await log('wa_link');
		} catch (e) {
			toast(t(problemKey(e)), { tone: 'error' });
		} finally {
			busy = null;
		}
	}

	async function downloadPdf() {
		if (!sheet) return;
		busy = 'download';
		try {
			downloadBlob(await fetchFile(sheet.pdf_url), `${fileBase}.pdf`);
			await log('download');
		} catch (e) {
			toast(t(problemKey(e)), { tone: 'error' });
		} finally {
			busy = null;
		}
	}

	async function print() {
		if (!sheet) return;
		busy = 'print';
		try {
			const url = URL.createObjectURL(await fetchFile(sheet.pdf_url));
			const w = window.open(url, '_blank');
			w?.addEventListener('load', () => w.print());
			setTimeout(() => URL.revokeObjectURL(url), 60_000);
			await log('print');
		} catch (e) {
			toast(t(problemKey(e)), { tone: 'error' });
		} finally {
			busy = null;
		}
	}
</script>

<svelte:head><title>{t('tailor.share.title')} · {t('app.name')}</title></svelte:head>

<a class="back" href={resolve('/(tailor)/t/orders/[orderId]', { orderId })}
	>‹ {order?.order_no ?? t('tailor.order.title')}</a
>
<h1>{t('tailor.share.title')}</h1>

{#if loadError}
	<ErrorState body={t(problemKey(loadError))} />
{:else if !order || !meStore.me}
	<Skeleton lines={5} />
{:else}
	<section class="panel" aria-labelledby="opts-h">
		<h2 id="opts-h" class="vt-visually-hidden">{t('tailor.share.options')}</h2>
		{#if order.display_name}
			<Checkbox bind:checked={includeName} describedby="name-note"
				>{t('tailor.share.includeName', { name: order.display_name })}</Checkbox
			>
			<p class="vt-small vt-muted" id="name-note">{t('tailor.share.includeNameNote')}</p>
		{/if}
		<RadioCards
			legend={t('tailor.share.format')}
			bind:value={format}
			columns={2}
			options={[
				{ value: 'png', label: t('tailor.share.png'), description: t('tailor.share.pngHint') },
				{ value: 'pdf', label: t('tailor.share.pdf'), description: t('tailor.share.pdfHint') }
			]}
		/>
		<Button size="lg" loading={generating} disabled={!network.online} onclick={generate}
			>{t('tailor.share.generate')}</Button
		>
		{#if genError}<Banner tone="danger">{genError}</Banner>{/if}
	</section>

	{#if sheet && previewUrl}
		<section class="panel" aria-labelledby="prev-h">
			<h2 id="prev-h">{t('tailor.share.preview')}</h2>
			<img
				class="preview"
				src={previewUrl}
				alt={t('tailor.share.previewAlt', { no: order.order_no })}
			/>
			<details>
				<summary>{t('tailor.share.text')}</summary>
				<pre class="text">{sheet.share_text}</pre>
			</details>
			<div class="row">
				{#if format === 'png'}
					<Button icon="share" loading={busy === 'whatsapp_share'} onclick={shareWhatsApp}
						>{t('tailor.share.whatsapp')}</Button
					>
					<Button
						variant="secondary"
						icon="download"
						loading={busy === 'download'}
						onclick={downloadPdf}>{t('tailor.share.downloadPdf')}</Button
					>
				{:else}
					<Button icon="download" loading={busy === 'download'} onclick={downloadPdf}
						>{t('tailor.share.downloadPdf')}</Button
					>
					<Button
						variant="secondary"
						icon="share"
						loading={busy === 'whatsapp_share'}
						onclick={shareWhatsApp}>{t('tailor.share.whatsapp')}</Button
					>
				{/if}
				<Button variant="secondary" icon="print" loading={busy === 'print'} onclick={print}
					>{t('tailor.share.print')}</Button
				>
			</div>
			{#if attachHint}
				<Banner tone="info">{t('tailor.share.attachHint')}</Banner>
			{/if}
		</section>
	{/if}
{/if}

<style>
	.back {
		display: inline-flex;
		align-items: center;
		min-height: var(--vt-target);
		font-weight: 600;
	}
	.panel {
		display: grid;
		gap: var(--vt-s-12);
		margin-top: var(--vt-s-16);
		padding: var(--vt-s-16);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius-lg);
		justify-items: start;
	}
	.preview {
		width: 100%;
		max-width: 28rem;
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius);
		box-shadow: var(--vt-shadow);
	}
	.text {
		white-space: pre-wrap;
		font-family: var(--vt-font);
		background: var(--vt-chalk);
		padding: var(--vt-s-12);
		border-radius: var(--vt-radius);
	}
	summary {
		min-height: var(--vt-target);
		display: flex;
		align-items: center;
		cursor: pointer;
		font-weight: 600;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--vt-s-8);
	}
</style>
