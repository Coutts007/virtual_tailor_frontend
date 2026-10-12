<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n/t.svelte';
	import { setSetting } from '$lib/db/settings';
	import { draft } from '$lib/client/flow.svelte';
	import ClientHeader from '$lib/client/ClientHeader.svelte';
	import Page from '$lib/client/Page.svelte';
	import ProtocolArt from '$lib/client/ProtocolArt.svelte';
	import Banner from '$lib/ui/Banner.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Icon from '$lib/ui/Icon.svelte';

	/**
	 * Measuring sheet (9.5). The print check protects the scale: the app cannot
	 * detect a mis-scaled print, so the client verifies the 10 cm line once per sheet.
	 */
	let source = $state<'have' | 'print' | 'preview' | null>(null);
	let answer = $state<'yes' | 'no' | null>(draft.print_check_ok ? 'yes' : null);

	async function setAnswer(a: 'yes' | 'no') {
		answer = a;
		draft.print_check_ok = a === 'yes';
		await setSetting('print_check_ok', a === 'yes');
	}
</script>

<svelte:head><title>{t('sheet.title')} · {t('app.name')}</title></svelte:head>

<ClientHeader title={t('sheet.title')} back="/check" step="setup" />

<Page>
	<div class="intro">
		<ProtocolArt art="sheet" size={88} />
		<p>{t('sheet.intro')}</p>
	</div>

	<div class="options">
		<button
			type="button"
			class="opt"
			aria-pressed={source === 'have'}
			onclick={() => (source = 'have')}
		>
			<Icon name="check" /> <span>{t('sheet.have')}</span>
		</button>
		<button
			type="button"
			class="opt"
			aria-pressed={source === 'print'}
			onclick={() => (source = 'print')}
		>
			<Icon name="print" /> <span>{t('sheet.print')}</span>
		</button>
		<button
			type="button"
			class="opt"
			aria-pressed={source === 'preview'}
			onclick={() => (source = 'preview')}
		>
			<Icon name="eye" /> <span>{t('sheet.preview')}</span>
		</button>
	</div>

	{#if source === 'print'}
		<div class="panel">
			<p>{t('sheet.printHint')}</p>
			<Button variant="secondary" icon="download" href="/marker/vt-measuring-sheet-A4.pdf"
				>{t('sheet.download')}</Button
			>
		</div>
	{:else if source === 'preview'}
		<div class="panel">
			<img
				class="preview"
				src="/marker/vt-measuring-sheet-preview.svg"
				alt={t('sheet.previewAlt')}
				width="210"
				height="297"
			/>
		</div>
	{/if}

	<section class="check" aria-labelledby="pc-h">
		<h2 id="pc-h">{t('sheet.check.title')}</h2>
		<p>{t('sheet.check.line')}</p>
		<p class="vt-muted">{t('sheet.check.card')}</p>
		<div class="yn" role="group" aria-labelledby="pc-h">
			<Button
				variant={answer === 'yes' ? 'primary' : 'secondary'}
				aria-pressed={answer === 'yes'}
				onclick={() => setAnswer('yes')}>{t('sheet.check.yes')}</Button
			>
			<Button
				variant={answer === 'no' ? 'danger' : 'secondary'}
				aria-pressed={answer === 'no'}
				onclick={() => setAnswer('no')}>{t('sheet.check.no')}</Button
			>
		</div>
		{#if answer === 'no'}<Banner tone="danger">{t('sheet.check.bad')}</Banner>{/if}
		{#if answer === 'yes'}<p class="ok" role="status">
				<Icon name="check" size={20} stroke={3} />
				{t('sheet.check.ok')}
			</p>{/if}
	</section>

	<section aria-labelledby="tips-h">
		<h2 id="tips-h">{t('sheet.tips.title')}</h2>
		<ul>
			<li>{t('sheet.tip1')}</li>
			<li>{t('sheet.tip2')}</li>
			<li>{t('sheet.tip3')}</li>
		</ul>
	</section>

	{#snippet actions()}
		<Button size="lg" full disabled={answer !== 'yes'} onclick={() => goto(resolve('/setup'))}
			>{t('common.continue')}</Button
		>
	{/snippet}
</Page>

<style>
	.intro {
		display: flex;
		gap: var(--vt-s-16);
		align-items: center;
	}
	.options {
		display: grid;
		gap: var(--vt-s-8);
		margin: var(--vt-s-16) 0;
	}
	.opt {
		display: flex;
		gap: var(--vt-s-12);
		align-items: center;
		min-height: 56px;
		padding: 0 var(--vt-s-16);
		border: 2px solid var(--vt-line);
		border-radius: var(--vt-radius);
		background: var(--vt-paper);
		font-weight: 700;
		text-align: left;
		cursor: pointer;
		color: var(--vt-ink);
	}
	.opt[aria-pressed='true'] {
		border-color: var(--vt-thread);
		background: var(--vt-thread-tint);
	}
	.opt :global(.icon) {
		color: var(--vt-thread);
	}
	.panel {
		display: grid;
		gap: var(--vt-s-8);
		justify-items: start;
		padding: var(--vt-s-16);
		border-radius: var(--vt-radius);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
	}
	.preview {
		width: 100%;
		max-width: 18rem;
		height: auto;
		border: 1px solid var(--vt-line);
		justify-self: center;
	}
	.check {
		margin-top: var(--vt-s-24);
	}
	.yn {
		display: flex;
		gap: var(--vt-s-8);
		margin-bottom: var(--vt-s-12);
	}
	.check :global(.banner) {
		border-radius: var(--vt-radius);
	}
	.ok {
		display: flex;
		gap: var(--vt-s-4);
		align-items: center;
		color: var(--vt-pass);
		font-weight: 700;
	}
</style>
