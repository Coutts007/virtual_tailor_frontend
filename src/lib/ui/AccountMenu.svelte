<script lang="ts">
	import { session } from '$lib/auth/session.svelte';
	import { signOut } from '$lib/dashboard/signout';
	import { t } from '$lib/i18n/t.svelte';
	import Icon from './Icon.svelte';

	/** Contents of the header account menu. */
	let { settingsHref, extra }: { settingsHref?: string; extra?: string } = $props();
</script>

<div class="acct">
	<p class="who">
		<span class="email">{session.user?.email}</span>
		{#if extra}<span class="vt-small vt-muted">{extra}</span>{/if}
	</p>
	{#if settingsHref}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved by caller -->
		<a class="item" href={settingsHref}><Icon name="pencil" size={20} />{t('dash.settings')}</a>
	{/if}
	<button type="button" class="item" onclick={signOut}
		><Icon name="chevron-right" size={20} />{t('dash.signOut')}</button
	>
</div>

<style>
	.acct {
		display: grid;
		gap: 2px;
	}
	.who {
		display: grid;
		margin: 0;
		padding: var(--vt-s-8);
		border-bottom: 1px solid var(--vt-line);
		overflow-wrap: anywhere;
	}
	.email {
		font-weight: 700;
	}
	.item {
		display: flex;
		align-items: center;
		gap: var(--vt-s-8);
		min-height: var(--vt-target);
		padding: 0 var(--vt-s-8);
		border: 0;
		border-radius: 8px;
		background: transparent;
		color: var(--vt-ink);
		font: inherit;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		text-align: left;
	}
	.item:hover {
		background: var(--vt-thread-tint);
	}
</style>
