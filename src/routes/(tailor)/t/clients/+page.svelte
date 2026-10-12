<script lang="ts">
	import { resolve } from '$app/paths';
	import { api } from '$lib/api';
	import type { ClientFilter, ClientSort, ClientSummary } from '$lib/api/types';
	import { flagSummaryText } from '$lib/dashboard/flags';
	import { Resource } from '$lib/dashboard/resource.svelte';
	import { formatDate, t } from '$lib/i18n/t.svelte';
	import DataTable from '$lib/ui/DataTable.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import ErrorState from '$lib/ui/ErrorState.svelte';
	import Fab from '$lib/ui/Fab.svelte';
	import Field from '$lib/ui/Field.svelte';
	import LastUpdated from '$lib/ui/LastUpdated.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import StatusChips from '$lib/ui/StatusChips.svelte';
	import SyncBadge from '$lib/ui/SyncBadge.svelte';
	import Button from '$lib/ui/Button.svelte';

	const PAGE_SIZE = 25;
	let search = $state('');
	let query = $state('');
	let sort = $state<ClientSort>('last_capture');
	let filters = $state<ClientFilter[]>([]);
	let items = $state<ClientSummary[]>([]);
	let total = $state(0);
	let pageNo = $state(1);
	let more = $state(false);
	let sentinel: HTMLElement | undefined = $state();

	const res = new Resource(() =>
		api().listClients({ search: query, sort, filter: filters[0], page: 1, page_size: PAGE_SIZE })
	);

	// Debounce search by 300 ms (Section 13.2).
	let debounce: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		const s = search;
		clearTimeout(debounce);
		debounce = setTimeout(() => (query = s.trim()), 300);
		return () => clearTimeout(debounce);
	});

	$effect(() => {
		void [query, sort, filters[0]];
		void reload();
	});

	async function reload() {
		await res.load();
		if (res.data) {
			items = res.data.items;
			total = res.data.total;
			pageNo = 1;
		}
	}

	async function loadMore() {
		if (more || items.length >= total) return;
		more = true;
		try {
			const r = await api().listClients({
				search: query,
				sort,
				filter: filters[0],
				page: pageNo + 1,
				page_size: PAGE_SIZE
			});
			items = [...items, ...r.items];
			pageNo += 1;
		} finally {
			more = false;
		}
	}

	// Infinite scroll, with the "Load more" button as fallback.
	$effect(() => {
		if (!sentinel) return;
		const io = new IntersectionObserver((e) => {
			if (e[0]?.isIntersecting) void loadMore();
		});
		io.observe(sentinel);
		return () => io.disconnect();
	});

	const columns = $derived([
		{ key: 'code', label: t('tailor.clients.code'), primary: true },
		{ key: 'name', label: t('tailor.clients.name') },
		{ key: 'last', label: t('tailor.clients.lastCapture') },
		{ key: 'sync', label: t('tailor.clients.sync') },
		{ key: 'flags', label: t('tailor.clients.flags') },
		{ key: 'orders', label: t('tailor.clients.openOrders'), align: 'end' as const }
	]);
</script>

<svelte:head><title>{t('tailor.clients.title')} · {t('app.name')}</title></svelte:head>

<div class="head">
	<h1>{t('tailor.clients.title')}</h1>
	<LastUpdated at={res.updatedAt} />
</div>

<div class="tools">
	<Field label={t('common.search')} hint={t('tailor.clients.searchHint')}>
		{#snippet children({ id, describedby })}
			<input
				{id}
				class="vt-input"
				type="search"
				bind:value={search}
				aria-describedby={describedby}
				autocomplete="off"
			/>
		{/snippet}
	</Field>
	<Field label={t('tailor.clients.sort')}>
		{#snippet children({ id })}
			<Select
				{id}
				bind:value={sort}
				options={[
					{ value: 'last_capture', label: t('tailor.clients.sortLast') },
					{ value: 'code', label: t('tailor.clients.sortCode') },
					{ value: 'name', label: t('tailor.clients.sortName') }
				]}
			/>
		{/snippet}
	</Field>
</div>
<StatusChips
	label={t('tailor.clients.filters')}
	multiple={false}
	bind:selected={filters}
	chips={[
		{ value: 'new', label: t('tailor.clients.filterNew') },
		{ value: 'flags', label: t('tailor.clients.filterFlags') },
		{ value: 'none', label: t('tailor.clients.filterNone') }
	]}
/>

<div class="list">
	{#if res.loading && !res.data}
		<Skeleton lines={6} height={28} />
	{:else if res.error && !res.data}
		<ErrorState body={res.offlineError ? t('error.offline') : undefined} onretry={reload} />
	{:else if items.length === 0}
		{#if query || filters.length}
			<EmptyState title={t('tailor.clients.noMatch')} icon="search" />
		{:else}
			<EmptyState
				title={t('tailor.clients.emptyTitle')}
				body={t('tailor.clients.emptyBody')}
				icon="user"
			/>
		{/if}
	{:else}
		<p class="vt-small vt-muted" aria-live="polite">
			{t('tailor.clients.count', { count: total })}
		</p>
		<DataTable {columns} rows={items} key={(c) => c.client_id} caption={t('tailor.clients.title')}>
			{#snippet cell(c, col)}
				{#if col.key === 'code'}
					<a
						class="code vt-mono"
						href={resolve('/(tailor)/t/clients/[clientId]', { clientId: c.client_id })}
						>{c.client_code}</a
					>
				{:else if col.key === 'name'}{c.display_name ?? '—'}
				{:else if col.key === 'last'}{c.last_capture_at
						? formatDate(c.last_capture_at)
						: t('tailor.clients.never')}
				{:else if col.key === 'sync'}{#if c.latest_sync_status}<SyncBadge
							status={c.latest_sync_status}
						/>{:else}—{/if}
				{:else if col.key === 'flags'}{flagSummaryText(c.flags)}
				{:else}<span class="vt-num">{c.open_orders}</span>{/if}
			{/snippet}
		</DataTable>
		{#if items.length < total}
			<div class="more" bind:this={sentinel}>
				<Button variant="secondary" loading={more} onclick={loadMore}>{t('common.loadMore')}</Button
				>
			</div>
		{/if}
	{/if}
</div>

<Fab href={resolve('/t/clients/new')}>{t('tailor.clients.newCode')}</Fab>

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--vt-s-8);
	}
	.tools {
		display: grid;
		gap: 0 var(--vt-s-16);
	}
	@media (min-width: 768px) {
		.tools {
			grid-template-columns: 2fr 1fr;
		}
	}
	.list {
		margin-top: var(--vt-s-16);
		padding-bottom: 80px;
	}
	.code {
		font-size: var(--vt-fs-18);
		font-weight: 800;
		display: inline-flex;
		align-items: center;
		min-height: var(--vt-target);
	}
	.more {
		display: grid;
		justify-items: center;
		padding: var(--vt-s-16);
	}
</style>
