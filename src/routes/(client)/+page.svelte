<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { setLang, t, type Lang } from '$lib/i18n/t.svelte';
	import { normaliseCode, validateClientCode } from '$lib/domain/validate';
	import { setSetting } from '$lib/db/settings';
	import ClientHeader from '$lib/client/ClientHeader.svelte';
	import Page from '$lib/client/Page.svelte';

	/** Welcome and language choice (9.1). Carries a ?code= deep link forward. */
	const code = $derived(normaliseCode(page.url.searchParams.get('code') ?? ''));
	const validCode = $derived(!validateClientCode(code));

	onMount(() => {
		if (validCode) void setSetting('client_code', code);
	});

	async function choose(lang: Lang) {
		setLang(lang);
		await setSetting('language', lang);
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- query string on a resolved path
		await goto(validCode ? `${resolve('/start')}?code=${code}` : resolve('/start'));
	}
</script>

<svelte:head><title>{t('app.name')}</title></svelte:head>

<ClientHeader title={t('app.name')} />

<Page>
	<p class="wordmark" aria-hidden="true">
		<span>Virtual Tailor</span>
		<svg viewBox="0 0 120 10" width="120" height="10"
			><path
				d="M0 8h120M0 8V2M12 8V5M24 8V2M36 8V5M48 8V2M60 8V5M72 8V2M84 8V5M96 8V2M108 8V5M120 8V2"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			/></svg
		>
	</p>
	<p class="promise">{t('client.welcome.promise')}</p>
	{#if validCode}<p class="code">{t('client.welcome.codeReady', { code })}</p>{/if}

	<h2 class="choose">{t('welcome.chooseLanguage')}</h2>
	<div class="cards">
		<button type="button" class="card" lang="en" onclick={() => choose('en')}>
			<span>English</span><span aria-hidden="true">›</span>
		</button>
		<button type="button" class="card" lang="sw" onclick={() => choose('sw')}>
			<span>Kiswahili</span><span aria-hidden="true">›</span>
		</button>
	</div>

	<nav class="links">
		<a href={resolve('/me')}>{t('client.welcome.haveSaved')}</a>
		<a href={resolve('/help')}>{t('client.welcome.how')}</a>
	</nav>
</Page>

<style>
	.wordmark {
		display: grid;
		gap: 2px;
		margin: var(--vt-s-16) 0 var(--vt-s-12);
		font-size: var(--vt-fs-36);
		font-weight: 800;
		letter-spacing: -0.01em;
		color: var(--vt-thread);
	}
	.wordmark svg {
		color: var(--vt-kitenge);
	}
	.promise {
		font-size: var(--vt-fs-18);
	}
	.code {
		padding: var(--vt-s-8) var(--vt-s-12);
		border-radius: var(--vt-radius);
		background: var(--vt-thread-tint);
		font-weight: 600;
	}
	.choose {
		margin-top: var(--vt-s-32);
	}
	.cards {
		display: grid;
		gap: var(--vt-s-12);
	}
	.card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		min-height: 72px;
		padding: 0 var(--vt-s-24);
		border: 2px solid var(--vt-line);
		border-radius: var(--vt-radius-lg);
		background: var(--vt-paper);
		font-size: var(--vt-fs-22);
		font-weight: 700;
		cursor: pointer;
		box-shadow: var(--vt-shadow);
	}
	.card:hover {
		border-color: var(--vt-thread);
	}
	.links {
		display: grid;
		gap: var(--vt-s-8);
		margin-top: var(--vt-s-32);
	}
	.links a {
		display: flex;
		align-items: center;
		min-height: var(--vt-target);
		font-weight: 600;
	}
</style>
