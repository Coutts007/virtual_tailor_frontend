<script lang="ts">
	import { t } from '$lib/i18n/t.svelte';
	import Icon from './Icon.svelte';

	/** 403 / 404 screen for dashboard route groups (Section 7.2): never a blank page. */
	let { status, home }: { status: number; home: string } = $props();
	const kind = $derived(status === 404 ? 'notFound' : status === 403 ? 'forbidden' : 'generic');
</script>

<div class="forbidden">
	<span class="art"><Icon name={status === 403 ? 'alert' : 'info'} size={40} stroke={1.6} /></span>
	<p class="code vt-num" aria-hidden="true">{status}</p>
	<h1>{t(`error.${kind}.title`)}</h1>
	<p>{t(`error.${kind}.body`)}</p>
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- callers pass a resolved path -->
	<a class="home" href={home}>{t('common.goHome')}</a>
</div>

<style>
	.forbidden {
		display: grid;
		justify-items: center;
		text-align: center;
		gap: var(--vt-s-8);
		padding: var(--vt-s-48) var(--vt-s-16);
	}
	.art {
		display: grid;
		place-items: center;
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: var(--vt-thread-tint);
		color: var(--vt-thread);
	}
	.code {
		margin: 0;
		font-size: var(--vt-fs-36);
		font-weight: 800;
		color: var(--vt-line-strong);
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
