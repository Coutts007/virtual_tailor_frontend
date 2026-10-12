<script lang="ts" module>
	import type { IconName } from './Icon.svelte';
	export interface NavItem {
		href: string;
		label: string;
		icon: IconName;
		/** Path prefix that marks this item current. */
		match: string;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { t } from '$lib/i18n/t.svelte';
	import { network } from '$lib/device/network.svelte';
	import Banner from './Banner.svelte';
	import Icon from './Icon.svelte';
	import LangToggle from './LangToggle.svelte';

	/**
	 * Dashboard frame (Section 13): bottom navigation on phones, left sidebar at
	 * ≥ 1024 px, header with section title, EN | SW, an optional badge and the
	 * account menu. The page itself owns the single h1.
	 */
	let {
		nav,
		account,
		badge,
		children
	}: {
		nav: NavItem[];
		account: Snippet;
		badge?: Snippet;
		children: Snippet;
	} = $props();

	const current = $derived(nav.find((n) => page.url.pathname.startsWith(n.match)));
	let menuOpen = $state(false);
	let menuEl: HTMLDivElement | undefined = $state();

	function onWindowClick(e: MouseEvent) {
		if (menuOpen && menuEl && !menuEl.contains(e.target as Node)) menuOpen = false;
	}
	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') menuOpen = false;
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onKey} />

<a class="vt-skip-link" href="#main">{t('common.skipToContent')}</a>

<div class="shell">
	<aside class="sidebar" aria-label={t('dash.nav')}>
		<div class="brand">
			<span class="mark" aria-hidden="true">VT</span>
			<span class="word">{t('app.name')}</span>
		</div>
		<nav aria-label={t('dash.nav')}>
			<ul>
				{#each nav as n (n.href)}
					<li>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- hrefs are built with resolve() by the layout -->
						<a href={n.href} aria-current={current === n ? 'page' : undefined}>
							<Icon name={n.icon} />
							<span>{n.label}</span>
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</aside>

	<div class="col">
		<header class="bar">
			<span class="mark small" aria-hidden="true">VT</span>
			<p class="section">{current?.label ?? t('app.name')}</p>
			<div class="tools">
				{#if badge}{@render badge()}{/if}
				<LangToggle />
				<div class="account" bind:this={menuEl}>
					<button
						type="button"
						class="acct-btn"
						aria-expanded={menuOpen}
						aria-haspopup="true"
						aria-label={t('dash.account')}
						onclick={() => (menuOpen = !menuOpen)}
					>
						<Icon name="user" />
					</button>
					{#if menuOpen}
						<div class="menu">{@render account()}</div>
					{/if}
				</div>
			</div>
		</header>
		{#if !network.online}
			<Banner tone="offline">{t('dash.offline')}</Banner>
		{/if}
		<main id="main" class="main" tabindex="-1">
			{@render children()}
		</main>
	</div>

	<nav class="bottom" aria-label={t('dash.nav')}>
		<ul>
			{#each nav as n (n.href)}
				<li>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- hrefs are built with resolve() by the layout -->
					<a href={n.href} aria-current={current === n ? 'page' : undefined}>
						<Icon name={n.icon} size={22} />
						<span>{n.label}</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</div>

<style>
	.shell {
		min-height: 100dvh;
		display: grid;
		grid-template-columns: 1fr;
	}
	.sidebar {
		display: none;
	}
	.col {
		min-width: 0;
		padding-bottom: calc(72px + var(--vt-safe-bottom));
	}
	.bar {
		position: sticky;
		top: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		gap: var(--vt-s-12);
		min-height: 60px;
		padding: calc(var(--vt-s-8) + var(--vt-safe-top)) var(--vt-s-16) var(--vt-s-8);
		background: var(--vt-paper);
		border-bottom: 1px solid var(--vt-line);
	}
	.mark {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: 9px;
		background: var(--vt-thread);
		color: var(--vt-thread-ink);
		font-weight: 800;
		font-size: var(--vt-fs-14);
		flex: none;
	}
	.section {
		margin: 0;
		font-weight: 800;
		font-size: var(--vt-fs-18);
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.tools {
		display: flex;
		align-items: center;
		gap: var(--vt-s-8);
	}
	.account {
		position: relative;
	}
	.acct-btn {
		width: var(--vt-target);
		height: var(--vt-target);
		border-radius: 50%;
		border: 2px solid var(--vt-line);
		background: var(--vt-paper);
		color: var(--vt-ink);
		cursor: pointer;
	}
	.menu {
		position: absolute;
		right: 0;
		top: calc(100% + 6px);
		min-width: 15rem;
		padding: var(--vt-s-8);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius);
		box-shadow: var(--vt-shadow-lg);
		z-index: 30;
	}
	@media (max-width: 420px) {
		.mark.small {
			display: none;
		}
		.bar {
			gap: var(--vt-s-8);
			padding-left: var(--vt-s-12);
			padding-right: var(--vt-s-12);
		}
	}
	.main {
		max-width: 72rem;
		margin: 0 auto;
		padding: var(--vt-s-16) var(--vt-s-16) var(--vt-s-48);
		outline: none;
	}
	.bottom {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 20;
		background: var(--vt-paper);
		border-top: 1px solid var(--vt-line);
		padding-bottom: var(--vt-safe-bottom);
	}
	.bottom ul {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.bottom a {
		display: grid;
		justify-items: center;
		gap: 2px;
		min-height: 60px;
		padding: var(--vt-s-8) 2px;
		color: var(--vt-ink-muted);
		text-decoration: none;
		font-size: 0.75rem;
		font-weight: 600;
	}
	.bottom a[aria-current='page'] {
		color: var(--vt-thread);
		box-shadow: inset 0 3px 0 var(--vt-kitenge);
	}
	@media (min-width: 1024px) {
		.shell {
			grid-template-columns: 15rem 1fr;
		}
		.sidebar {
			display: block;
			position: sticky;
			top: 0;
			height: 100dvh;
			padding: var(--vt-s-16);
			background: var(--vt-paper);
			border-right: 1px solid var(--vt-line);
		}
		.brand {
			display: flex;
			align-items: center;
			gap: var(--vt-s-8);
			margin-bottom: var(--vt-s-24);
			font-weight: 800;
		}
		.sidebar ul {
			list-style: none;
			margin: 0;
			padding: 0;
			display: grid;
			gap: 4px;
		}
		.sidebar a {
			display: flex;
			align-items: center;
			gap: var(--vt-s-12);
			min-height: var(--vt-target);
			padding: 0 var(--vt-s-12);
			border-radius: var(--vt-radius);
			color: var(--vt-ink);
			text-decoration: none;
			font-weight: 600;
		}
		.sidebar a[aria-current='page'] {
			background: var(--vt-thread-tint);
			color: var(--vt-thread);
			box-shadow: inset 3px 0 0 var(--vt-kitenge);
		}
		.bottom,
		.mark.small {
			display: none;
		}
		.col {
			padding-bottom: 0;
		}
		.main {
			padding: var(--vt-s-24) var(--vt-s-32) var(--vt-s-48);
		}
	}
</style>
