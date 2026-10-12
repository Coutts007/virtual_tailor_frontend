<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { page } from '$app/state';
	import { t } from '$lib/i18n/t.svelte';
	import Banner from '$lib/ui/Banner.svelte';
	import { loadDraft } from '$lib/client/flow.svelte';
	import { captureInstallPrompt } from '$lib/client/install.svelte';
	import { startClientSync, syncState } from '$lib/client/syncState.svelte';

	let { children }: { children: Snippet } = $props();
	const onCapture = $derived(page.url.pathname.startsWith('/capture'));

	onMount(() => {
		void loadDraft();
		const a = startClientSync();
		const b = captureInstallPrompt();
		return () => (a(), b());
	});
</script>

{#if !onCapture}
	{#if !syncState.persisted && syncState.pending > 0}
		<Banner tone="warning">{t('banner.storage')}</Banner>
	{:else if syncState.stale}
		<Banner tone="warning">{t('banner.reminder')}</Banner>
	{/if}
{/if}

{@render children()}
