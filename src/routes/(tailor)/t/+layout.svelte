<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { session } from '$lib/auth/session.svelte';
	import { conflictsStore, refreshConflicts } from '$lib/dashboard/conflicts.svelte';
	import { loadMe } from '$lib/dashboard/me.svelte';
	import { t } from '$lib/i18n/t.svelte';
	import AccountMenu from '$lib/ui/AccountMenu.svelte';
	import DashboardShell from '$lib/ui/DashboardShell.svelte';
	import Icon from '$lib/ui/Icon.svelte';

	let { children }: { children: Snippet } = $props();

	const nav = $derived([
		{
			href: resolve('/t/clients'),
			label: t('tailor.nav.clients'),
			icon: 'user' as const,
			match: '/t/clients'
		},
		{
			href: resolve('/t/orders'),
			label: t('tailor.nav.orders'),
			icon: 'ruler' as const,
			match: '/t/orders'
		},
		{
			href: resolve('/t/audit'),
			label: t('tailor.nav.audit'),
			icon: 'clock' as const,
			match: '/t/audit'
		},
		{
			href: resolve('/t/settings'),
			label: t('tailor.nav.settings'),
			icon: 'pencil' as const,
			match: '/t/settings'
		}
	]);

	onMount(() => {
		void loadMe().catch(() => {});
		void refreshConflicts();
	});

	// Session ended (expiry, 401, sign-out): back to login, keeping the place.
	$effect(() => {
		if (!session.user && session.ended === 'expired') {
			const next = encodeURIComponent(page.url.pathname + page.url.search);
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved path plus a query
			void goto(`${resolve('/login')}?next=${next}`);
		}
	});
</script>

<DashboardShell {nav}>
	{#snippet badge()}
		{#if conflictsStore.count > 0}
			<a
				class="conflicts"
				href={resolve('/t/conflicts')}
				aria-label={t('tailor.conflicts.badge', { count: conflictsStore.count })}
			>
				<Icon name="cloud" size={20} />
				<span class="vt-num" aria-hidden="true">{conflictsStore.count}</span>
			</a>
		{/if}
	{/snippet}
	{#snippet account()}
		<AccountMenu settingsHref={resolve('/t/settings')} />
	{/snippet}
	{@render children()}
</DashboardShell>

<style>
	.conflicts {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		min-height: var(--vt-target);
		padding: 0 var(--vt-s-12);
		border-radius: 999px;
		background: var(--vt-thread-tint);
		color: var(--vt-thread);
		font-weight: 800;
		text-decoration: none;
	}
</style>
