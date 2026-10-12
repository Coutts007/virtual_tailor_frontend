<script lang="ts">
	import '$lib/styles/tokens.css';
	import '$lib/styles/base.css';
	import { onMount, type Snippet } from 'svelte';
	import { dev } from '$app/environment';
	import { locale, t } from '$lib/i18n/t.svelte';
	import { watchNetwork } from '$lib/device/network.svelte';
	import { startWorkers, swState, applyUpdate } from '$lib/sw/register.svelte';
	import Banner from '$lib/ui/Banner.svelte';
	import Toaster from '$lib/ui/Toaster.svelte';

	let { children }: { children: Snippet } = $props();

	$effect(() => {
		document.documentElement.lang = locale.lang;
	});

	onMount(() => {
		const stop = watchNetwork();
		void navigator.storage?.persist?.();
		// Readiness marker for e2e tests once workers (MSW in dev) are up.
		void startWorkers().finally(() => (document.documentElement.dataset.vtReady = 'true'));
		return stop;
	});
</script>

{#if dev && locale.lang === 'sw'}
	<Banner tone="warning" live="off">{t('banner.unreviewedSw')}</Banner>
{/if}

{@render children()}

<Toaster />

{#if swState.updateReady}
	<div class="update-toast" role="status">
		<span>{t('toast.updateReady')}</span>
		<button type="button" onclick={applyUpdate}>{t('toast.refresh')}</button>
	</div>
{/if}

<style>
	.update-toast {
		position: fixed;
		left: 50%;
		bottom: calc(var(--vt-s-16) + var(--vt-safe-bottom));
		transform: translateX(-50%);
		display: flex;
		gap: var(--vt-s-16);
		align-items: center;
		padding: var(--vt-s-8) var(--vt-s-8) var(--vt-s-8) var(--vt-s-16);
		background: var(--vt-ink);
		color: var(--vt-chalk);
		border-radius: var(--vt-radius);
		box-shadow: var(--vt-shadow-lg);
		z-index: 900;
	}
	.update-toast button {
		min-height: var(--vt-target);
		padding: 0 var(--vt-s-16);
		border: 0;
		border-radius: var(--vt-radius);
		background: var(--vt-chalk);
		color: var(--vt-ink);
		font-weight: 700;
	}
</style>
