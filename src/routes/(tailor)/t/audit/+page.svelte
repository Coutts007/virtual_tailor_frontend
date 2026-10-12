<script lang="ts">
	import { api } from '$lib/api';
	import type { AuditEntry, AuditQuery } from '$lib/api/types';
	import { problemKey } from '$lib/dashboard/errors';
	import { Resource } from '$lib/dashboard/resource.svelte';
	import { t } from '$lib/i18n/t.svelte';
	import AuditFilters from '$lib/ui/AuditFilters.svelte';
	import AuditRow from '$lib/ui/AuditRow.svelte';
	import Button from '$lib/ui/Button.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import ErrorState from '$lib/ui/ErrorState.svelte';
	import LastUpdated from '$lib/ui/LastUpdated.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';

	const PAGE_SIZE = 25;
	let query = $state<AuditQuery>({});
	let items = $state<AuditEntry[]>([]);
	let pageNo = $state(1);
	let more = $state(false);
	const res = new Resource(() => api().listAudit({ ...query, page: 1, page_size: PAGE_SIZE }));

	$effect(() => {
		void JSON.stringify(query);
		void (async () => {
			await res.load();
			if (res.data) {
				items = res.data.items;
				pageNo = 1;
			}
		})();
	});
	async function loadMore() {
		more = true;
		try {
			const r = await api().listAudit({ ...query, page: pageNo + 1, page_size: PAGE_SIZE });
			items = [...items, ...r.items];
			pageNo += 1;
		} finally {
			more = false;
		}
	}
</script>

<svelte:head><title>{t('tailor.audit.title')} · {t('app.name')}</title></svelte:head>

<div class="head">
	<h1>{t('tailor.audit.title')}</h1>
	<LastUpdated at={res.updatedAt} />
</div>
<p class="vt-muted">{t('tailor.audit.intro')}</p>
<AuditFilters bind:query />

{#if res.loading && !res.data}
	<Skeleton lines={6} />
{:else if res.error && !res.data}
	<ErrorState body={t(problemKey(res.error))} onretry={() => res.load()} />
{:else if items.length === 0}
	<EmptyState title={t('audit.empty')} icon="clock" />
{:else}
	<ul class="list">
		{#each items as e (e.log_id)}<AuditRow entry={e} />{/each}
	</ul>
	{#if items.length < (res.data?.total ?? 0)}
		<div class="more">
			<Button variant="secondary" loading={more} onclick={loadMore}>{t('common.loadMore')}</Button>
		</div>
	{/if}
{/if}

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--vt-s-8);
	}
	.list {
		margin: 0;
		padding: 0;
	}
	.more {
		display: grid;
		justify-items: center;
		padding: var(--vt-s-16);
	}
</style>
