<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { t } from '$lib/i18n/t.svelte';

	let { children }: { children: Snippet } = $props();
	const links = $derived([
		{ href: resolve('/admin/study/participants'), label: t('admin.study.participants') },
		{ href: resolve('/admin/study/measurers'), label: t('admin.study.measurers') },
		{ href: resolve('/admin/study/export'), label: t('admin.study.exports') }
	]);
</script>

<nav class="sub" aria-label={t('admin.nav.study')}>
	{#each links as l (l.href)}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved above -->
		<a href={l.href} aria-current={page.url.pathname === l.href ? 'page' : undefined}>{l.label}</a>
	{/each}
	<!-- Study capture (15.1) is the client flow run by the researcher; owned by the capture app. -->
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- route owned by the capture app -->
	<a href="/study/capture">{t('admin.study.capture')} ›</a>
</nav>

{@render children()}

<style>
	.sub {
		display: flex;
		flex-wrap: wrap;
		gap: var(--vt-s-8);
		margin-bottom: var(--vt-s-16);
	}
	.sub a {
		display: inline-flex;
		align-items: center;
		min-height: var(--vt-target);
		padding: 0 var(--vt-s-16);
		border: 2px solid var(--vt-line);
		border-radius: 999px;
		background: var(--vt-paper);
		color: var(--vt-ink);
		font-weight: 700;
		text-decoration: none;
	}
	.sub a[aria-current='page'] {
		border-color: var(--vt-thread);
		background: var(--vt-thread);
		color: var(--vt-thread-ink);
	}
</style>
