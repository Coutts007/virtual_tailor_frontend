<script lang="ts">
	import { base, resolve } from '$app/paths';
	import { t } from '$lib/i18n/t.svelte';
	import Icon from '$lib/ui/Icon.svelte';
	import LangToggle from '$lib/ui/LangToggle.svelte';
	import ProgressSteps, { type StepKey } from '$lib/ui/ProgressSteps.svelte';

	/**
	 * Client header (Section 9): back arrow where meaningful, the screen title
	 * (the page's one h1), EN | SW, and the ⋮ menu (My measurements, Help, Privacy).
	 */
	let {
		title,
		back,
		step
	}: {
		title: string;
		back?: '/' | '/start' | '/consent' | '/check' | '/sheet' | '/setup' | '/review' | '/me';
		step?: StepKey;
	} = $props();

	let open = $state(false);
	let menuEl: HTMLDivElement | undefined = $state();

	function onDocClick(e: MouseEvent) {
		if (open && menuEl && !menuEl.contains(e.target as Node)) open = false;
	}
	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}
</script>

<svelte:document onclick={onDocClick} onkeydown={onKey} />

<header class="hdr">
	<div class="bar">
		{#if back}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- back is a typed route literal resolved via base -->
			<a class="icon-btn" href={base + back} aria-label={t('common.back')}
				><Icon name="chevron-left" /></a
			>
		{:else}
			<span class="mark" aria-hidden="true">VT</span>
		{/if}
		<h1>{title}</h1>
		<LangToggle />
		<div class="menu" bind:this={menuEl}>
			<button
				type="button"
				class="icon-btn"
				aria-label={t('client.menu.label')}
				aria-expanded={open}
				aria-controls="client-menu"
				onclick={() => (open = !open)}
			>
				<Icon name="more" />
			</button>
			{#if open}
				<ul id="client-menu" class="list">
					<li><a href={resolve('/me')} onclick={() => (open = false)}>{t('client.menu.me')}</a></li>
					<li>
						<a href={resolve('/help')} onclick={() => (open = false)}>{t('client.menu.help')}</a>
					</li>
					<li>
						<a href={resolve('/privacy')} onclick={() => (open = false)}
							>{t('client.menu.privacy')}</a
						>
					</li>
				</ul>
			{/if}
		</div>
	</div>
	{#if step}<div class="steps"><ProgressSteps current={step} /></div>{/if}
</header>

<style>
	.hdr {
		position: sticky;
		top: 0;
		z-index: 20;
		background: var(--vt-chalk);
		border-bottom: 1px solid var(--vt-line);
		padding-top: var(--vt-safe-top);
	}
	.bar {
		display: flex;
		align-items: center;
		gap: var(--vt-s-8);
		max-width: 40rem;
		margin: 0 auto;
		padding: var(--vt-s-8) var(--vt-s-12);
	}
	h1 {
		flex: 1;
		margin: 0;
		font-size: var(--vt-fs-18);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.mark {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		flex: none;
		border-radius: 10px;
		background: var(--vt-thread);
		color: var(--vt-thread-ink);
		font-weight: 800;
	}
	.icon-btn {
		display: grid;
		place-items: center;
		width: var(--vt-target);
		height: var(--vt-target);
		flex: none;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--vt-ink);
		cursor: pointer;
	}
	.icon-btn:hover {
		background: var(--vt-thread-tint);
	}
	.menu {
		position: relative;
	}
	.list {
		position: absolute;
		right: 0;
		top: calc(100% + 4px);
		min-width: 14rem;
		margin: 0;
		padding: var(--vt-s-4) 0;
		list-style: none;
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius);
		box-shadow: var(--vt-shadow-lg);
	}
	.list a {
		display: flex;
		align-items: center;
		min-height: var(--vt-target);
		padding: 0 var(--vt-s-16);
		color: var(--vt-ink);
		text-decoration: none;
		font-weight: 600;
	}
	.list a:hover {
		background: var(--vt-thread-tint);
	}
	.steps {
		max-width: 40rem;
		margin: 0 auto;
		padding: 0 var(--vt-s-16) var(--vt-s-8);
	}
	@media (max-width: 360px) {
		.bar :global(.toggle button) {
			min-width: 40px;
		}
	}
</style>
