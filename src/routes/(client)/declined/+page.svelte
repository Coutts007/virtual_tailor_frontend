<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n/t.svelte';
	import { clearDetails } from '$lib/client/flow.svelte';
	import ClientHeader from '$lib/client/ClientHeader.svelte';
	import Page from '$lib/client/Page.svelte';
	import Button from '$lib/ui/Button.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';

	let cleared = $state(false);
</script>

<svelte:head><title>{t('declined.title')} · {t('app.name')}</title></svelte:head>

<ClientHeader title={t('declined.title')} back="/consent" />

<Page>
	<EmptyState title={t('declined.body')} body={t('declined.alt')} icon="user" />
	<div class="acts">
		{#if cleared}
			<p class="done" role="status">{t('declined.cleared')}</p>
		{:else}
			<Button
				variant="secondary"
				full
				onclick={async () => (await clearDetails(), (cleared = true))}>{t('declined.clear')}</Button
			>
		{/if}
		<Button variant="text" href={resolve('/consent')}>{t('declined.back')}</Button>
	</div>
</Page>

<style>
	.acts {
		display: grid;
		gap: var(--vt-s-8);
	}
	.done {
		text-align: center;
		color: var(--vt-pass);
		font-weight: 700;
	}
</style>
