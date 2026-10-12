<script lang="ts">
	import { api } from '$lib/api';
	import type { AuditQuery } from '$lib/api/types';
	import { problemKey } from '$lib/dashboard/errors';
	import { downloadBlob } from '$lib/dashboard/format';
	import { Resource } from '$lib/dashboard/resource.svelte';
	import { network } from '$lib/device/network.svelte';
	import { nairobiToday } from '$lib/domain/validate';
	import { formatDateTime, t } from '$lib/i18n/t.svelte';
	import AuditFilters from '$lib/ui/AuditFilters.svelte';
	import Button from '$lib/ui/Button.svelte';
	import DataTable from '$lib/ui/DataTable.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import ErrorState from '$lib/ui/ErrorState.svelte';
	import LastUpdated from '$lib/ui/LastUpdated.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import { toast } from '$lib/ui/toast.svelte';

	const PAGE_SIZE = 25;
	let query = $state<AuditQuery>({});
	let pageNo = $state(1);
	let exporting = $state(false);
	const res = new Resource(() => api().listAudit({ ...query, page: pageNo, page_size: PAGE_SIZE }));

	$effect(() => {
		void JSON.stringify(query);
		pageNo = 1;
	});
	$effect(() => {
		void [JSON.stringify(query), pageNo];
		void res.load();
	});
	const pages = $derived(Math.max(1, Math.ceil((res.data?.total ?? 0) / PAGE_SIZE)));

	async function exportCsv() {
		exporting = true;
		try {
			const csv = await api().exportAuditCsv(query);
			downloadBlob(
				new Blob([csv], { type: 'text/csv;charset=utf-8' }),
				`vt-audit-${nairobiToday()}.csv`
			);
			toast(t('admin.audit.exported'), { tone: 'success' });
		} catch (e) {
			toast(t(problemKey(e)), { tone: 'error' });
		} finally {
			exporting = false;
		}
	}

	const columns = $derived([
		{ key: 'when', label: t('admin.audit.when'), primary: true },
		{ key: 'user', label: t('audit.user') },
		{ key: 'role', label: t('audit.role') },
		{ key: 'action', label: t('audit.action') },
		{ key: 'entity', label: t('audit.entity') },
		{ key: 'summary', label: t('admin.audit.summary') }
	]);
</script>

<svelte:head><title>{t('admin.audit.title')} · {t('app.name')}</title></svelte:head>

<div class="head">
	<h1>{t('admin.audit.title')}</h1>
	<Button
		variant="secondary"
		icon="download"
		loading={exporting}
		disabled={!network.online}
		onclick={exportCsv}>{t('admin.audit.export')}</Button
	>
</div>
<p class="vt-muted">{t('admin.audit.intro')}</p>
<AuditFilters bind:query full />
<LastUpdated at={res.updatedAt} />

{#if res.loading && !res.data}
	<Skeleton lines={8} />
{:else if res.error && !res.data}
	<ErrorState body={t(problemKey(res.error))} onretry={() => res.load()} />
{:else if res.data && res.data.items.length === 0}
	<EmptyState title={t('audit.empty')} icon="clock" />
{:else if res.data}
	<DataTable {columns} rows={res.data.items} key={(e) => e.log_id} caption={t('admin.audit.title')}>
		{#snippet cell(e, col)}
			{#if col.key === 'when'}<time datetime={e.occurred_at} class="vt-num"
					>{formatDateTime(e.occurred_at)}</time
				>
			{:else if col.key === 'user'}<span class="email">{e.user_email}</span>
			{:else if col.key === 'role'}{e.role}
			{:else if col.key === 'action'}{t(`audit.action.${e.action}`)}
			{:else if col.key === 'entity'}{e.entity_type}
			{:else}{e.summary}{/if}
		{/snippet}
	</DataTable>
	<nav class="pager" aria-label={t('admin.audit.pages')}>
		<Button variant="secondary" disabled={pageNo <= 1} onclick={() => pageNo--}
			>‹ {t('common.previous')}</Button
		>
		<span class="vt-num" aria-live="polite"
			>{t('common.of', { current: pageNo, total: pages })}</span
		>
		<Button variant="secondary" disabled={pageNo >= pages} onclick={() => pageNo++}
			>{t('common.next')} ›</Button
		>
	</nav>
{/if}

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--vt-s-8);
	}
	.email {
		overflow-wrap: anywhere;
	}
	.pager {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--vt-s-16);
		margin-top: var(--vt-s-16);
	}
</style>
