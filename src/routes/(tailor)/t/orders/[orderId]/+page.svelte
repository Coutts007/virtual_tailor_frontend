<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { api } from '$lib/api';
	import type { MeasurementProfile, Order, OrderStatus } from '$lib/api/types';
	import { problemKey } from '$lib/dashboard/errors';
	import ItemsEditor from '$lib/dashboard/ItemsEditor.svelte';
	import {
		easeError,
		rowsFromOrder,
		toItemInputs,
		unresolved,
		type EditRow
	} from '$lib/dashboard/items';
	import { loadMe, unit } from '$lib/dashboard/me.svelte';
	import StatusSheet, { FLOW } from '$lib/dashboard/StatusSheet.svelte';
	import { network } from '$lib/device/network.svelte';
	import { addDays, DUE_MAX_DAYS, nairobiToday, validateDueDate } from '$lib/domain/validate';
	import { formatDate, formatDateTime, t } from '$lib/i18n/t.svelte';
	import Banner from '$lib/ui/Banner.svelte';
	import Button from '$lib/ui/Button.svelte';
	import DatePicker from '$lib/ui/DatePicker.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import ErrorState from '$lib/ui/ErrorState.svelte';
	import Field from '$lib/ui/Field.svelte';
	import OrderStatusChip from '$lib/ui/OrderStatusChip.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import { toast } from '$lib/ui/toast.svelte';

	const orderId = $derived(page.params.orderId!);
	let order = $state<Order | null>(null);
	let profile = $state<MeasurementProfile | null>(null);
	let loadError = $state<unknown>(null);
	let rows = $state<EditRow[]>([]);
	let editing = $state(false);
	let confirmEdit = $state(false);
	let due = $state('');
	let notes = $state('');
	let saving = $state(false);
	let statusOpen = $state(false);
	let deleteOpen = $state(false);
	let deleting = $state(false);
	const today = nairobiToday();

	async function load() {
		loadError = null;
		try {
			const [o] = await Promise.all([api().getOrder(orderId), loadMe()]);
			order = o;
			due = o.due_date;
			notes = o.notes;
			profile = await api().getProfile(o.profile_id);
			rows = rowsFromOrder(o.items, profile.measurements, unit());
		} catch (e) {
			loadError = e;
		}
	}
	$effect(() => {
		void orderId;
		void load();
	});

	function startEdit() {
		if (order?.status === 'new') editing = true;
		else confirmEdit = true;
	}

	const dueKey = $derived(validateDueDate(due));
	const dueChanged = $derived(!!order && (due !== order.due_date || notes !== order.notes));
	const open = $derived(unresolved(rows));
	const easeBad = $derived(rows.some((r) => easeError(r, unit())));

	async function saveDetails(e: SubmitEvent) {
		e.preventDefault();
		if (!order || (dueKey && due !== order.due_date) || notes.length > 1000) return;
		saving = true;
		try {
			order = await api().updateOrder(order.order_id, { due_date: due, notes: notes.trim() });
			toast(t('tailor.order.updated', { no: order.order_no }), { tone: 'success' });
		} catch (err) {
			toast(t(problemKey(err)), { tone: 'error' });
		} finally {
			saving = false;
		}
	}
	async function saveItems() {
		if (!order || open.length || easeBad) return;
		saving = true;
		try {
			order = await api().updateOrder(order.order_id, { items: toItemInputs(rows, unit()) });
			rows = rowsFromOrder(order.items, profile!.measurements, unit());
			editing = false;
			toast(t('tailor.order.updated', { no: order.order_no }), { tone: 'success' });
		} catch (err) {
			toast(t(problemKey(err)), { tone: 'error' });
		} finally {
			saving = false;
		}
	}
	async function setStatus(s: OrderStatus) {
		if (!order) return;
		order = await api().updateOrder(order.order_id, { status: s });
		toast(t('tailor.status.changed', { no: order.order_no, status: t(`status.${s}`) }), {
			tone: 'success'
		});
	}
	async function remove() {
		if (!order) return;
		deleting = true;
		try {
			await api().deleteOrder(order.order_id);
			toast(t('tailor.order.deleted', { no: order.order_no }), { tone: 'success' });
			await goto(resolve('/t/orders'));
		} catch (err) {
			toast(t(problemKey(err)), { tone: 'error' });
		} finally {
			deleting = false;
			deleteOpen = false;
		}
	}
	const next = $derived(order ? FLOW[FLOW.indexOf(order.status) + 1] : undefined);
</script>

<svelte:head
	><title>{order?.order_no ?? t('tailor.order.title')} · {t('app.name')}</title></svelte:head
>

<a class="back" href={resolve('/t/orders')}>‹ {t('tailor.nav.orders')}</a>

{#if loadError}
	<ErrorState body={t(problemKey(loadError))} onretry={load} />
{:else if !order || !profile}
	<Skeleton lines={8} height={24} />
{:else}
	<header class="head">
		<h1>{order.order_no} · {t(`garment.${order.garment_type}`)}</h1>
		<OrderStatusChip status={order.status} />
	</header>
	<p class="links">
		<a href={resolve('/(tailor)/t/clients/[clientId]', { clientId: order.client_id })}
			><span class="vt-mono">{order.client_code}</span>{#if order.display_name}
				({order.display_name}){/if}</a
		>
		·
		<a
			href={resolve('/(tailor)/t/clients/[clientId]/profiles/[profileId]', {
				clientId: order.client_id,
				profileId: order.profile_id
			})}>{t('tailor.client.profileVersion', { version: order.profile_version })}</a
		>
	</p>

	<section aria-labelledby="status-h" class="panel">
		<h2 id="status-h">{t('tailor.order.statusHeading')}</h2>
		<ol class="stepper">
			{#each FLOW as s, i (s)}
				<li
					class:done={i <= FLOW.indexOf(order.status)}
					aria-current={s === order.status ? 'step' : undefined}
				>
					<span class="dot" aria-hidden="true"></span>{t(`status.${s}`)}
				</li>
			{/each}
		</ol>
		<div class="row">
			{#if next}
				<Button disabled={!network.online} onclick={() => setStatus(next)}
					>{t('tailor.order.moveTo', { status: t(`status.${next}`) })}</Button
				>
			{/if}
			<Button variant="secondary" disabled={!network.online} onclick={() => (statusOpen = true)}
				>{t('tailor.order.changeStatus')}</Button
			>
		</div>
		<details>
			<summary>{t('tailor.order.history')}</summary>
			<ul class="history">
				{#each order.status_history as h, i (i)}
					<li><time datetime={h.at}>{formatDateTime(h.at)}</time> — {t(`status.${h.status}`)}</li>
				{/each}
			</ul>
		</details>
	</section>

	<section aria-labelledby="items-h" class="panel">
		<div class="row between">
			<h2 id="items-h">{t('tailor.order.items')}</h2>
			{#if !editing}
				<Button variant="secondary" icon="pencil" disabled={!network.online} onclick={startEdit}
					>{t('tailor.order.editItems')}</Button
				>
			{/if}
		</div>
		<ItemsEditor
			bind:rows
			unit={unit()}
			editable={editing}
			sex={profile.covariates.sex}
			scalePct={profile.session.scale_disagreement_pct}
		/>
		{#if editing}
			{#if open.length}<p class="block vt-small" role="status">
					{t('tailor.order.mustResolve', { count: open.length })}
				</p>{/if}
			<div class="row">
				<Button
					loading={saving}
					disabled={open.length > 0 || easeBad || !network.online}
					onclick={saveItems}>{t('common.save')}</Button
				>
				<Button
					variant="text"
					onclick={() => (
						(editing = false),
						(rows = rowsFromOrder(order!.items, profile!.measurements, unit()))
					)}>{t('common.cancel')}</Button
				>
			</div>
		{/if}
	</section>

	<section aria-labelledby="details-h" class="panel">
		<h2 id="details-h">{t('tailor.order.details')}</h2>
		<form onsubmit={saveDetails} novalidate>
			<Field
				label={t('tailor.order.due')}
				error={dueKey && due !== order.due_date ? t(dueKey) : null}
			>
				{#snippet children({ id, describedby, invalid })}
					<DatePicker
						{id}
						{describedby}
						{invalid}
						bind:value={due}
						min={today}
						max={addDays(today, DUE_MAX_DAYS)}
					/>
				{/snippet}
			</Field>
			<p class="vt-small vt-muted">
				{t('tailor.orders.due', { date: formatDate(order.due_date) })}
			</p>
			<Field
				label={t('tailor.order.notes')}
				hint={t('tailor.order.notesHint', { count: notes.length })}
				optional
			>
				{#snippet children({ id, describedby })}
					<textarea {id} class="vt-input" rows="3" bind:value={notes} aria-describedby={describedby}
					></textarea>
				{/snippet}
			</Field>
			<Button
				type="submit"
				variant="secondary"
				loading={saving}
				disabled={!dueChanged || !network.online}>{t('tailor.order.saveDetails')}</Button
			>
		</form>
	</section>

	<div class="row actions">
		<Button
			href={resolve('/(tailor)/t/orders/[orderId]/sheet', { orderId: order.order_id })}
			icon="share">{t('tailor.order.sheetShare')}</Button
		>
		{#if order.status === 'new'}
			<Button variant="danger" disabled={!network.online} onclick={() => (deleteOpen = true)}
				>{t('tailor.order.delete')}</Button
			>
		{/if}
	</div>

	<StatusSheet
		bind:open={statusOpen}
		current={order.status}
		orderNo={order.order_no}
		onchoose={setStatus}
	/>

	<Dialog bind:open={confirmEdit} title={t('tailor.order.inProgressTitle')}>
		<p>{t('tailor.order.inProgressBody')}</p>
		{#snippet actions()}
			<Button variant="text" onclick={() => (confirmEdit = false)}>{t('common.cancel')}</Button>
			<Button onclick={() => ((confirmEdit = false), (editing = true))}
				>{t('tailor.order.changeAnyway')}</Button
			>
		{/snippet}
	</Dialog>
	<Dialog bind:open={deleteOpen} title={t('tailor.order.deleteTitle', { no: order.order_no })}>
		<p>{t('tailor.order.deleteBody')}</p>
		{#snippet actions()}
			<Button variant="text" onclick={() => (deleteOpen = false)}>{t('common.cancel')}</Button>
			<Button variant="danger" loading={deleting} onclick={remove}>{t('common.delete')}</Button>
		{/snippet}
	</Dialog>
{/if}

{#if order && !network.online}<Banner tone="offline">{t('dash.offlineDisabled')}</Banner>{/if}

<style>
	.back {
		display: inline-flex;
		align-items: center;
		min-height: var(--vt-target);
		font-weight: 600;
	}
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--vt-s-12);
	}
	.head h1 {
		margin: 0;
	}
	.links a {
		display: inline-flex;
		min-height: var(--vt-target);
		align-items: center;
	}
	.panel {
		margin-top: var(--vt-s-16);
		padding: var(--vt-s-16);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius-lg);
	}
	.stepper {
		list-style: none;
		margin: 0 0 var(--vt-s-12);
		padding: 0;
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 4px;
		font-size: var(--vt-fs-14);
	}
	.stepper li {
		display: grid;
		gap: 4px;
		color: var(--vt-ink-muted);
	}
	.stepper .dot {
		height: 6px;
		border-radius: 3px;
		background: var(--vt-line);
	}
	.stepper .done .dot {
		background: var(--vt-thread);
	}
	.stepper [aria-current='step'] {
		color: var(--vt-ink);
		font-weight: 800;
	}
	.stepper [aria-current='step'] .dot {
		background: var(--vt-kitenge);
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--vt-s-8);
		align-items: center;
	}
	.between {
		justify-content: space-between;
	}
	.history {
		padding-left: var(--vt-s-16);
	}
	summary {
		min-height: var(--vt-target);
		display: flex;
		align-items: center;
		cursor: pointer;
		font-weight: 600;
	}
	.block {
		margin: var(--vt-s-8) 0;
		padding: var(--vt-s-8) var(--vt-s-12);
		border-radius: var(--vt-radius);
		background: var(--vt-check-fill);
		color: var(--vt-check-ink);
		font-weight: 700;
	}
	.actions {
		margin-top: var(--vt-s-24);
	}
	textarea {
		resize: vertical;
	}
</style>
