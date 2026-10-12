<script lang="ts">
	import { resolve } from '$app/paths';
	import { api } from '$lib/api';
	import type { OrderStatus, OrderSummary } from '$lib/api/types';
	import { refreshConflicts } from '$lib/dashboard/conflicts.svelte';
	import { problemKey } from '$lib/dashboard/errors';
	import { isOverdue } from '$lib/dashboard/format';
	import { Resource } from '$lib/dashboard/resource.svelte';
	import StatusSheet from '$lib/dashboard/StatusSheet.svelte';
	import { network } from '$lib/device/network.svelte';
	import { nairobiToday } from '$lib/domain/validate';
	import { formatDate, t } from '$lib/i18n/t.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import ErrorState from '$lib/ui/ErrorState.svelte';
	import Fab from '$lib/ui/Fab.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Icon from '$lib/ui/Icon.svelte';
	import LastUpdated from '$lib/ui/LastUpdated.svelte';
	import OrderStatusChip from '$lib/ui/OrderStatusChip.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import StatusChips from '$lib/ui/StatusChips.svelte';
	import { toast } from '$lib/ui/toast.svelte';

	const ACTIVE: OrderStatus[] = ['new', 'cutting', 'fitting', 'ready'];
	const PAGE_SIZE = 25;
	let selected = $state<OrderStatus[]>([]);
	let showCollected = $state(false);
	let sort = $state<'due' | 'created'>('due');
	let items = $state<OrderSummary[]>([]);
	let pageNo = $state(1);
	let more = $state(false);
	const today = nairobiToday();

	const statuses = $derived<OrderStatus[]>(
		selected.length ? selected : showCollected ? [...ACTIVE, 'collected'] : ACTIVE
	);
	const res = new Resource(() =>
		api().listOrders({ status: statuses, sort, page: 1, page_size: PAGE_SIZE })
	);

	$effect(() => {
		void [statuses.join(), sort];
		void reload();
	});
	$effect(() => {
		if (!showCollected && selected.includes('collected'))
			selected = selected.filter((s) => s !== 'collected');
	});

	async function reload() {
		await res.load();
		if (res.data) {
			items = res.data.items;
			pageNo = 1;
		}
	}
	async function loadMore() {
		more = true;
		try {
			const r = await api().listOrders({
				status: statuses,
				sort,
				page: pageNo + 1,
				page_size: PAGE_SIZE
			});
			items = [...items, ...r.items];
			pageNo += 1;
		} finally {
			more = false;
		}
	}

	const counts = $derived(res.data?.counts ?? {});
	const chips = $derived(
		(showCollected ? [...ACTIVE, 'collected' as const] : ACTIVE).map((s) => ({
			value: s,
			label: t(`status.${s}`),
			count: counts[s] ?? 0
		}))
	);

	let sheetFor = $state<OrderSummary | null>(null);
	let sheetOpen = $state(false);
	async function changeStatus(s: OrderStatus) {
		if (!sheetFor) return;
		try {
			await api().updateOrder(sheetFor.order_id, { status: s });
			toast(t('tailor.status.changed', { no: sheetFor.order_no, status: t(`status.${s}`) }), {
				tone: 'success'
			});
			await reload();
		} catch (e) {
			toast(t(problemKey(e)), { tone: 'error' });
			throw e;
		}
	}
	$effect(() => {
		void refreshConflicts();
	});
</script>

<svelte:head><title>{t('tailor.orders.title')} · {t('app.name')}</title></svelte:head>

<div class="head">
	<h1>{t('tailor.orders.title')}</h1>
	<LastUpdated at={res.updatedAt} />
</div>

<StatusChips label={t('tailor.orders.filter')} bind:selected {chips} />
<div class="tools">
	<Checkbox bind:checked={showCollected}>{t('tailor.orders.showCollected')}</Checkbox>
	<Field label={t('tailor.orders.sort')}>
		{#snippet children({ id })}
			<Select
				{id}
				bind:value={sort}
				options={[
					{ value: 'due', label: t('tailor.orders.sortDue') },
					{ value: 'created', label: t('tailor.orders.sortCreated') }
				]}
			/>
		{/snippet}
	</Field>
</div>

{#if res.loading && !res.data}
	<Skeleton lines={6} height={40} />
{:else if res.error && !res.data}
	<ErrorState body={t(problemKey(res.error))} onretry={reload} />
{:else if items.length === 0}
	<EmptyState
		title={t('tailor.orders.emptyTitle')}
		body={t('tailor.orders.emptyBody')}
		icon="ruler"
	/>
{:else}
	<ul class="cards">
		{#each items as o (o.order_id)}
			{@const overdue = isOverdue(o.due_date, o.status, today)}
			<li class="card">
				<a class="main" href={resolve('/(tailor)/t/orders/[orderId]', { orderId: o.order_id })}>
					<span class="title"
						>{o.order_no} · {t(`garment.${o.garment_type}`)} ·
						<span class="vt-mono">{o.client_code}</span>{#if o.display_name}
							({o.display_name}){/if}</span
					>
					<span class="meta"
						>{t('tailor.orders.due', { date: formatDate(o.due_date) })} · {t(
							'tailor.client.profileVersion',
							{ version: o.profile_version }
						)}</span
					>
				</a>
				<div class="tags">
					<OrderStatusChip status={o.status} />
					{#if overdue}<span class="tag overdue"
							><Icon name="alert" size={16} />{t('tailor.orders.overdue')}</span
						>{/if}
					{#if o.flagged_sites}<span class="tag flagged"
							><Icon name="triangle" size={16} />{t('tailor.orders.flagged', {
								count: o.flagged_sites
							})}</span
						>{/if}
					{#if o.has_conflict}<span class="tag conflict"
							><Icon name="cloud" size={16} />{t('tailor.orders.conflict')}</span
						>{/if}
				</div>
				<div class="acts">
					<Button
						variant="secondary"
						href={resolve('/(tailor)/t/orders/[orderId]/sheet', { orderId: o.order_id })}
						icon="share">{t('tailor.orders.sheet')}</Button
					>
					<Button
						variant="secondary"
						disabled={!network.online}
						onclick={() => ((sheetFor = o), (sheetOpen = true))}
					>
						{t('tailor.orders.status')} ›<span class="vt-visually-hidden"> {o.order_no}</span>
					</Button>
				</div>
			</li>
		{/each}
	</ul>
	{#if items.length < (res.data?.total ?? 0)}
		<div class="more">
			<Button variant="secondary" loading={more} onclick={loadMore}>{t('common.loadMore')}</Button>
		</div>
	{/if}
{/if}

{#if sheetFor}
	<StatusSheet
		bind:open={sheetOpen}
		current={sheetFor.status}
		orderNo={sheetFor.order_no}
		onchoose={changeStatus}
	/>
{/if}

<Fab href={resolve('/t/orders/new')}>{t('tailor.orders.new')}</Fab>

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--vt-s-8);
	}
	.tools {
		display: flex;
		flex-wrap: wrap;
		gap: var(--vt-s-16);
		align-items: flex-end;
		margin: var(--vt-s-12) 0;
	}
	.cards {
		list-style: none;
		margin: 0;
		padding: 0 0 96px;
		display: grid;
		gap: var(--vt-s-12);
	}
	@media (min-width: 1024px) {
		.cards {
			grid-template-columns: 1fr 1fr;
		}
	}
	.card {
		display: grid;
		gap: var(--vt-s-8);
		padding: var(--vt-s-16);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius);
		box-shadow: var(--vt-shadow);
	}
	.main {
		display: grid;
		gap: 2px;
		color: var(--vt-ink);
		text-decoration: none;
	}
	.title {
		font-weight: 800;
		font-size: var(--vt-fs-18);
	}
	.meta {
		color: var(--vt-ink-muted);
	}
	.tags,
	.acts {
		display: flex;
		flex-wrap: wrap;
		gap: var(--vt-s-8);
		align-items: center;
	}
	.tag {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: var(--vt-fs-14);
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 999px;
	}
	.overdue {
		color: #fff;
		background: var(--vt-fail);
	}
	.flagged {
		color: var(--vt-check-ink);
		background: var(--vt-check-fill);
	}
	.conflict {
		color: var(--vt-thread);
		background: var(--vt-thread-tint);
	}
	.more {
		display: grid;
		justify-items: center;
		padding-bottom: 96px;
	}
</style>
