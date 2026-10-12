<script lang="ts">
	import { translate, t, type Lang, locale } from '$lib/i18n/t.svelte';
	import { copyText, openExternal, waLink } from '$lib/dashboard/share';
	import Button from './Button.svelte';
	import QRCode from './QRCode.svelte';
	import { toast } from './toast.svelte';

	/**
	 * Share card for a new client code (Section 13.3): big code, QR of the deep
	 * link, WhatsApp message in EN or SW, copy and print.
	 */
	let { code, link, displayName }: { code: string; link: string; displayName?: string | null } =
		$props();
	let msgLang = $state<Lang>(locale.lang);
	const message = $derived(translate(msgLang, 'tailor.issue.message', { link, code }));

	async function sendWhatsApp() {
		if (navigator.share) {
			try {
				await navigator.share({ text: message });
				return;
			} catch (e) {
				if ((e as DOMException).name === 'AbortError') return;
			}
		}
		openExternal(waLink(message));
	}

	async function copy() {
		toast((await copyText(link)) ? t('common.copied') : t('tailor.issue.copyFailed'), {
			tone: 'success'
		});
	}
</script>

<section class="share" aria-labelledby="share-h">
	<h2 id="share-h">{t('tailor.issue.readyTitle')}</h2>
	<div class="printable">
		<p class="label">
			{t('tailor.issue.codeLabel')}{#if displayName}: {displayName}{/if}
		</p>
		<p class="code vt-mono" aria-label={code.split('').join(' ')}>{code}</p>
		<QRCode text={link} size={200} label={t('tailor.issue.qrLabel', { code })} />
		<p class="link vt-small">{link}</p>
	</div>

	<div class="lang" role="group" aria-label={t('tailor.issue.messageLang')}>
		<span class="vt-small vt-muted">{t('tailor.issue.messageLang')}</span>
		{#each ['en', 'sw'] as const as l (l)}
			<button type="button" aria-pressed={msgLang === l} onclick={() => (msgLang = l)}
				>{t(`lang.${l}`)}</button
			>
		{/each}
	</div>
	<p class="msg" lang={msgLang}>{message}</p>

	<div class="actions">
		<Button icon="share" onclick={sendWhatsApp}>{t('tailor.issue.whatsapp')}</Button>
		<Button variant="secondary" icon="copy" onclick={copy}>{t('tailor.issue.copy')}</Button>
		<Button variant="secondary" icon="print" onclick={() => window.print()}
			>{t('tailor.issue.print')}</Button
		>
	</div>
</section>

<style>
	.share {
		display: grid;
		gap: var(--vt-s-12);
		padding: var(--vt-s-24) var(--vt-s-16);
		background: var(--vt-paper);
		border: 2px solid var(--vt-thread);
		border-radius: var(--vt-radius-lg);
	}
	.printable {
		display: grid;
		justify-items: center;
		gap: var(--vt-s-8);
		text-align: center;
	}
	.label {
		margin: 0;
		font-weight: 700;
	}
	.code {
		margin: 0;
		font-size: var(--vt-fs-56);
		font-weight: 800;
		letter-spacing: 0.08em;
		line-height: 1;
	}
	.link {
		overflow-wrap: anywhere;
		color: var(--vt-ink-muted);
	}
	.lang {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--vt-s-8);
	}
	.lang button {
		min-height: 40px;
		padding: 0 var(--vt-s-12);
		border: 2px solid var(--vt-line);
		border-radius: 999px;
		background: var(--vt-paper);
		font-weight: 700;
		cursor: pointer;
	}
	.lang button[aria-pressed='true'] {
		border-color: var(--vt-thread);
		background: var(--vt-thread-tint);
	}
	.msg {
		margin: 0;
		padding: var(--vt-s-12);
		border-radius: var(--vt-radius);
		background: var(--vt-chalk);
		white-space: pre-wrap;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--vt-s-8);
	}
	@media print {
		:global(body *) {
			visibility: hidden;
		}
		.printable,
		.printable :global(*) {
			visibility: visible;
		}
		.printable {
			position: fixed;
			inset: 0;
			align-content: center;
		}
	}
</style>
