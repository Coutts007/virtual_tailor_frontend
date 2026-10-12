<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n/t.svelte';

	const kind = $derived(
		page.status === 404 ? 'notFound' : page.status === 403 ? 'forbidden' : 'generic'
	);
</script>

<svelte:head><title>{t(`error.${kind}.title`)} · {t('app.name')}</title></svelte:head>

<main id="main" class="wrap">
	<p class="code vt-num" aria-hidden="true">{page.status}</p>
	<h1>{t(`error.${kind}.title`)}</h1>
	<p>{t(`error.${kind}.body`)}</p>
	<a class="home" href={resolve('/')}>{t('common.goHome')}</a>
</main>

<style>
	.wrap {
		max-width: 32rem;
		margin: 0 auto;
		padding: var(--vt-s-48) var(--vt-s-16);
	}
	.code {
		font-size: var(--vt-fs-56);
		font-weight: 800;
		color: var(--vt-line-strong);
		margin: 0;
	}
	.home {
		display: inline-flex;
		align-items: center;
		min-height: var(--vt-target);
		padding: 0 var(--vt-s-24);
		border-radius: var(--vt-radius);
		background: var(--vt-thread);
		color: var(--vt-thread-ink);
		font-weight: 700;
		text-decoration: none;
	}
</style>
