<script lang="ts">
	import { resolve } from '$app/paths';
	import { auth } from '$lib/api';
	import { session } from '$lib/auth/session.svelte';
	import { signOut } from '$lib/dashboard/signout';
	import { t } from '$lib/i18n/t.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Icon from '$lib/ui/Icon.svelte';

	auth();
</script>

<svelte:head><title>{t('auth.pending.title')} · {t('app.name')}</title></svelte:head>

<div class="pending">
	<span class="art"><Icon name="clock" size={44} stroke={1.6} /></span>
	<h1>{t('auth.pending.title')}</h1>
	<p>{t('auth.pending.body')}</p>
	<p class="vt-muted">{t('auth.pending.next')}</p>
	{#if session.user}
		<Button variant="secondary" onclick={signOut}>{t('dash.signOut')}</Button>
	{:else}
		<a class="back" href={resolve('/login')}>{t('auth.pending.back')}</a>
	{/if}
</div>

<style>
	.pending {
		display: grid;
		justify-items: center;
		text-align: center;
		gap: var(--vt-s-8);
		padding-top: var(--vt-s-32);
	}
	.art {
		display: grid;
		place-items: center;
		width: 88px;
		height: 88px;
		border-radius: 50%;
		background: var(--vt-check-fill);
		color: var(--vt-check-ink);
	}
	.back {
		display: inline-flex;
		align-items: center;
		min-height: var(--vt-target);
		font-weight: 700;
	}
</style>
