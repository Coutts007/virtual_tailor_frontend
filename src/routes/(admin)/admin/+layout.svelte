<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { session } from '$lib/auth/session.svelte';
	import { refreshStudyMode, studyMode } from '$lib/dashboard/studyMode.svelte';
	import { t } from '$lib/i18n/t.svelte';
	import AccountMenu from '$lib/ui/AccountMenu.svelte';
	import DashboardShell, { type NavItem } from '$lib/ui/DashboardShell.svelte';

	let { children }: { children: Snippet } = $props();

	const nav = $derived<NavItem[]>([
		{
			href: resolve('/admin/accounts'),
			label: t('admin.nav.accounts'),
			icon: 'user',
			match: '/admin/accounts'
		},
		{
			href: resolve('/admin/audit'),
			label: t('admin.nav.audit'),
			icon: 'clock',
			match: '/admin/audit'
		},
		{
			href: resolve('/admin/settings'),
			label: t('admin.nav.settings'),
			icon: 'pencil',
			match: '/admin/settings'
		},
		...(studyMode.on
			? [
					{
						href: resolve('/admin/study/participants'),
						label: t('admin.nav.study'),
						icon: 'ruler' as const,
						match: '/admin/study'
					}
				]
			: [])
	]);

	onMount(() => void refreshStudyMode());

	$effect(() => {
		if (!session.user && session.ended === 'expired') {
			const next = encodeURIComponent(page.url.pathname + page.url.search);
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved path plus a query
			void goto(`${resolve('/login')}?next=${next}`);
		}
	});
</script>

<DashboardShell {nav}>
	{#snippet account()}
		<AccountMenu settingsHref={resolve('/admin/settings')} extra={t('admin.roleLabel')} />
	{/snippet}
	{@render children()}
</DashboardShell>
