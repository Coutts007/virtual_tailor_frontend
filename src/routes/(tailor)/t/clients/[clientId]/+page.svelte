<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { api } from '$lib/api';
	import { isApiError } from '$lib/api/errors';
	import { problemKey } from '$lib/dashboard/errors';
	import { flagSummaryText } from '$lib/dashboard/flags';
	import { len } from '$lib/dashboard/format';
	import { Resource } from '$lib/dashboard/resource.svelte';
	import { network } from '$lib/device/network.svelte';
	import { formatDate, formatDateTime, t } from '$lib/i18n/t.svelte';
	import Banner from '$lib/ui/Banner.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import ErrorState from '$lib/ui/ErrorState.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Icon from '$lib/ui/Icon.svelte';
	import LastUpdated from '$lib/ui/LastUpdated.svelte';
	import OrderStatusChip from '$lib/ui/OrderStatusChip.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import SyncBadge from '$lib/ui/SyncBadge.svelte';
	import { toast } from '$lib/ui/toast.svelte';

	const clientId = $derived(page.params.clientId!);
	const res = new Resource(() => api().getClient(clientId));
	$effect(() => {
		void clientId;
		void res.load();
	});
	const c = $derived(res.data);
	const latest = $derived(c?.profiles[0] ?? null);
	const conflict = $derived(c?.profiles.some((p) => p.has_conflict) ?? false);

	let editing = $state(false);
	let nameDraft = $state('');
	let savingName = $state(false);
	let rotateOpen = $state(false);
	let rotating = $state(false);
	let deleteOpen = $state(false);
	let deleteTyped = $state('');
	let deleting = $state(false);
	let deleteBlocked = $state(false);

	function startEdit() {
		nameDraft = c?.display_name ?? '';
		editing = true;
	}
	async function saveName(e: SubmitEvent) {
		e.preventDefault();
		savingName = true;
		try {
			res.data = await api().updateClient(clientId, { display_name: nameDraft.trim() || null });
			editing = false;
		} catch (err) {
			toast(t(problemKey(err)), { tone: 'error' });
		} finally {
			savingName = false;
		}
	}
	async function rotate() {
		rotating = true;
		try {
			const { client_code } = await api().rotateClientCode(clientId);
			rotateOpen = false;
			toast(t('tailor.client.rotated', { code: client_code }), { tone: 'success' });
			await res.load();
		} catch (err) {
			toast(t(problemKey(err)), { tone: 'error' });
		} finally {
			rotating = false;
		}
	}
	async function remove() {
		deleting = true;
		try {
			await api().deleteClient(clientId);
			deleteOpen = false;
			toast(t('tailor.client.deleted'), { tone: 'success' });
			await goto(resolve('/t/clients'));
		} catch (err) {
			if (isApiError(err, 'client_has_orders')) deleteBlocked = true;
			else toast(t(problemKey(err)), { tone: 'error' });
		} finally {
			deleting = false;
		}
	}
</script>

<svelte:head
	><title>{c?.client_code ?? t('tailor.client.title')} · {t('app.name')}</title></svelte:head
>

<a class="back" href={resolve('/t/clients')}>‹ {t('tailor.clients.title')}</a>

{#if res.loading && !c}
	<Skeleton lines={6} height={24} />
{:else if res.error && !c}
	<ErrorState body={t(problemKey(res.error))} onretry={() => res.load()} />
{:else if c}
	<header class="head">
		<h1><span class="vt-mono code">{c.client_code}</span></h1>
		<LastUpdated at={res.updatedAt} />
	</header>

	<dl class="facts">
		<div>
			<dt>{t('tailor.client.displayName')}</dt>
			<dd>
				{#if editing}
					<form class="inline" onsubmit={saveName}>
						<Field label={t('tailor.client.displayName')} hint={t('tailor.issue.nameHint')}>
							{#snippet children({ id, describedby })}
								<!-- svelte-ignore a11y_autofocus -->
								<input
									{id}
									class="vt-input"
									bind:value={nameDraft}
									maxlength="60"
									aria-describedby={describedby}
									autofocus
								/>
							{/snippet}
						</Field>
						<div class="row">
							<Button type="submit" loading={savingName} disabled={!network.online}
								>{t('common.save')}</Button
							>
							<Button variant="text" onclick={() => (editing = false)}>{t('common.cancel')}</Button>
						</div>
					</form>
				{:else}
					<span>{c.display_name ?? '—'}</span>
					<Button variant="text" icon="pencil" onclick={startEdit} disabled={!network.online}
						>{t('common.edit')}</Button
					>
				{/if}
			</dd>
		</div>
		<div>
			<dt>{t('tailor.client.height')}</dt>
			<dd class="vt-num">{c.height_mm ? len(c.height_mm) : '—'}</dd>
		</div>
		<div>
			<dt>{t('tailor.client.created')}</dt>
			<dd>{formatDate(c.created_at)}</dd>
		</div>
	</dl>

	{#if conflict}
		<Banner tone="info">
			<a href={resolve('/t/conflicts')}
				><Icon name="cloud" size={18} /> {t('tailor.client.newerOnPhone')}</a
			>
		</Banner>
	{/if}

	<div class="actions">
		{#if latest}
			<Button href={`${resolve('/t/orders/new')}?profileId=${latest.profile_id}`} icon="plus"
				>{t('tailor.client.newOrderLatest')}</Button
			>
		{/if}
		<Button variant="secondary" onclick={() => (rotateOpen = true)} disabled={!network.online}
			>{t('tailor.client.rotate')}</Button
		>
		<Button
			variant="danger"
			onclick={() => ((deleteTyped = ''), (deleteBlocked = false), (deleteOpen = true))}
			disabled={!network.online}>{t('tailor.client.delete')}</Button
		>
	</div>

	<section aria-labelledby="profiles-h">
		<h2 id="profiles-h">{t('tailor.client.profiles')}</h2>
		{#if c.profiles.length === 0}
			<EmptyState
				title={t('tailor.client.noProfiles')}
				body={t('tailor.client.noProfilesBody')}
				icon="phone"
			/>
		{:else}
			<ul class="cards">
				{#each c.profiles as p (p.profile_id + p.version)}
					<li>
						<a
							class="card"
							href={resolve('/(tailor)/t/clients/[clientId]/profiles/[profileId]', {
								clientId,
								profileId: p.profile_id
							})}
						>
							<span class="title"
								>{t('tailor.client.profileVersion', { version: p.version })} · {formatDateTime(
									p.captured_at
								)}</span
							>
							<span class="meta"
								>{t(`tailor.mode.${p.capture_mode}`)} · {flagSummaryText(p.flags)}</span
							>
							<span class="badges"
								><SyncBadge status={p.sync_status} />{#if p.has_conflict}<span class="vt-small"
										><Icon name="cloud" size={16} /> {t('tailor.client.newerOnPhone')}</span
									>{/if}</span
							>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section aria-labelledby="orders-h">
		<h2 id="orders-h">{t('tailor.client.orders')}</h2>
		{#if c.orders.length === 0}
			<p class="vt-muted">{t('tailor.client.noOrders')}</p>
		{:else}
			<ul class="cards">
				{#each c.orders as o (o.order_id)}
					<li>
						<a class="card" href={resolve('/(tailor)/t/orders/[orderId]', { orderId: o.order_id })}>
							<span class="title">{o.order_no} · {t(`garment.${o.garment_type}`)}</span>
							<span class="meta">{t('tailor.orders.due', { date: formatDate(o.due_date) })}</span>
							<span class="badges"><OrderStatusChip status={o.status} /></span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<Dialog bind:open={rotateOpen} title={t('tailor.client.rotateTitle')}>
		<p>{t('tailor.client.rotateBody', { code: c.client_code })}</p>
		{#snippet actions()}
			<Button variant="text" onclick={() => (rotateOpen = false)}>{t('common.cancel')}</Button>
			<Button loading={rotating} onclick={rotate}>{t('tailor.client.rotateConfirm')}</Button>
		{/snippet}
	</Dialog>

	<Dialog bind:open={deleteOpen} title={t('tailor.client.deleteTitle')}>
		{#if deleteBlocked}
			<Banner tone="danger">{t('tailor.client.deleteHasOrders')}</Banner>
			<p><a href={resolve('/t/orders')}>{t('tailor.client.goOrders')}</a></p>
		{:else}
			<p>{t('tailor.client.deleteBody')}</p>
			<Field label={t('tailor.client.deleteType', { code: c.client_code })}>
				{#snippet children({ id, describedby })}
					<input
						{id}
						class="vt-input vt-mono"
						bind:value={deleteTyped}
						autocomplete="off"
						aria-describedby={describedby}
					/>
				{/snippet}
			</Field>
		{/if}
		{#snippet actions()}
			<Button variant="text" onclick={() => (deleteOpen = false)}>{t('common.cancel')}</Button>
			{#if !deleteBlocked}
				<Button
					variant="danger"
					loading={deleting}
					disabled={deleteTyped.trim().toUpperCase() !== c.client_code}
					onclick={remove}>{t('tailor.client.deleteConfirm')}</Button
				>
			{/if}
		{/snippet}
	</Dialog>
{/if}

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
		align-items: baseline;
		justify-content: space-between;
		gap: var(--vt-s-8);
	}
	.code {
		font-size: var(--vt-fs-36);
	}
	.facts {
		display: grid;
		gap: var(--vt-s-8);
		margin: 0 0 var(--vt-s-16);
	}
	.facts > div {
		display: grid;
		grid-template-columns: 9rem 1fr;
		gap: var(--vt-s-8);
		align-items: center;
	}
	dt {
		color: var(--vt-ink-muted);
	}
	dd {
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--vt-s-8);
	}
	.inline {
		width: 100%;
	}
	.row,
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--vt-s-8);
	}
	.actions {
		margin: var(--vt-s-16) 0 var(--vt-s-24);
	}
	section {
		margin-top: var(--vt-s-24);
	}
	.cards {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--vt-s-8);
	}
	.card {
		display: grid;
		gap: 4px;
		padding: var(--vt-s-12) var(--vt-s-16);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius);
		color: var(--vt-ink);
		text-decoration: none;
		box-shadow: var(--vt-shadow);
	}
	.card:hover {
		border-color: var(--vt-thread);
	}
	.title {
		font-weight: 700;
	}
	.meta {
		color: var(--vt-ink-muted);
		font-size: var(--vt-fs-14);
	}
	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: var(--vt-s-8);
		align-items: center;
	}
</style>
