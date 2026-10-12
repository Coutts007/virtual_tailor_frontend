<script lang="ts">
	import { api } from '$lib/api';
	import type { Account } from '$lib/api/types';
	import { session } from '$lib/auth/session.svelte';
	import { problemKey } from '$lib/dashboard/errors';
	import MeasurerForm from '$lib/dashboard/MeasurerForm.svelte';
	import { Resource } from '$lib/dashboard/resource.svelte';
	import { network } from '$lib/device/network.svelte';
	import { formatDate, t } from '$lib/i18n/t.svelte';
	import Button from '$lib/ui/Button.svelte';
	import DataTable from '$lib/ui/DataTable.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import ErrorState from '$lib/ui/ErrorState.svelte';
	import Field from '$lib/ui/Field.svelte';
	import LastUpdated from '$lib/ui/LastUpdated.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import { toast } from '$lib/ui/toast.svelte';

	type Tab = 'pending' | 'active' | 'disabled';
	const TABS: Tab[] = ['pending', 'active', 'disabled'];
	let tab = $state<Tab>('pending');
	const res = new Resource(() => api().listAccounts());
	$effect(() => void res.load());

	const all = $derived(res.data ?? []);
	const inTab = (a: Account, tb: Tab) =>
		tb === 'disabled' ? a.status === 'disabled' || a.status === 'rejected' : a.status === tb;
	const rows = $derived(all.filter((a) => inTab(a, tab)));
	const count = (tb: Tab) => all.filter((a) => inTab(a, tb)).length;

	let selected = $state<string[]>([]);
	let busy = $state<string | null>(null);
	let rejectFor = $state<Account | null>(null);
	let rejectReason = $state('');
	let rejectTried = $state(false);
	let disableFor = $state<Account | null>(null);
	let measurerOpen = $state(false);

	async function act(a: Account, verb: 'approve' | 'disable' | 'enable' | 'reject') {
		busy = a.user_id + verb;
		try {
			if (verb === 'approve') await api().approveAccount(a.user_id);
			if (verb === 'disable') await api().disableAccount(a.user_id);
			if (verb === 'enable') await api().enableAccount(a.user_id);
			if (verb === 'reject') await api().rejectAccount(a.user_id, rejectReason.trim());
			toast(t(`admin.accounts.done.${verb}`, { email: a.email }), { tone: 'success' });
			await res.load();
		} catch (e) {
			toast(t(problemKey(e)), { tone: 'error' });
		} finally {
			busy = null;
		}
	}
	async function bulkApprove() {
		busy = 'bulk';
		let n = 0;
		for (const id of selected) {
			try {
				await api().approveAccount(id);
				n++;
			} catch {
				/* reported below by count */
			}
		}
		selected = [];
		toast(t('admin.accounts.bulkDone', { count: n }), { tone: 'success' });
		busy = null;
		await res.load();
	}
	async function confirmReject() {
		rejectTried = true;
		if (!rejectFor || !rejectReason.trim()) return;
		const a = rejectFor;
		rejectFor = null;
		await act(a, 'reject');
		rejectReason = '';
		rejectTried = false;
	}

	const columns = $derived([
		...(tab === 'pending' ? [{ key: 'sel', label: t('admin.accounts.select') }] : []),
		{ key: 'email', label: t('auth.email'), primary: true },
		{ key: 'role', label: t('audit.role') },
		{ key: 'business', label: t('auth.register.business') },
		{ key: 'phone', label: t('auth.register.phone') },
		{ key: 'area', label: t('auth.register.area') },
		{ key: 'registered', label: t('admin.accounts.registered') },
		{ key: 'actions', label: t('admin.accounts.actions'), align: 'end' as const }
	]);
	const roleLabel = (r: Account['role']) =>
		t(
			r === 'tailor' ? 'audit.roleTailor' : r === 'admin' ? 'audit.roleAdmin' : 'audit.roleMeasurer'
		);
</script>

<svelte:head><title>{t('admin.accounts.title')} · {t('app.name')}</title></svelte:head>

<div class="head">
	<h1>{t('admin.accounts.title')}</h1>
	<LastUpdated at={res.updatedAt} />
</div>

<div class="tabs" role="tablist" aria-label={t('admin.accounts.title')}>
	{#each TABS as tb (tb)}
		<button
			type="button"
			role="tab"
			id={`tab-${tb}`}
			aria-selected={tab === tb}
			aria-controls="accounts-panel"
			tabindex={tab === tb ? 0 : -1}
			onclick={() => ((tab = tb), (selected = []))}
			onkeydown={(e) => {
				const i = TABS.indexOf(tab);
				if (e.key === 'ArrowRight') tab = TABS[(i + 1) % 3]!;
				if (e.key === 'ArrowLeft') tab = TABS[(i + 2) % 3]!;
				if (e.key.startsWith('Arrow')) document.getElementById(`tab-${tab}`)?.focus();
			}}
		>
			{t(`admin.accounts.tab.${tb}`)} <span class="vt-num count">{count(tb)}</span>
		</button>
	{/each}
</div>

<div id="accounts-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
	{#if tab === 'pending' && selected.length}
		<div class="bulk">
			<Button loading={busy === 'bulk'} disabled={!network.online} onclick={bulkApprove}
				>{t('admin.accounts.bulkApprove', { count: selected.length })}</Button
			>
		</div>
	{/if}
	{#if res.loading && !res.data}
		<Skeleton lines={5} />
	{:else if res.error && !res.data}
		<ErrorState body={t(problemKey(res.error))} onretry={() => res.load()} />
	{:else if rows.length === 0}
		<EmptyState title={t(`admin.accounts.empty.${tab}`)} icon="user" />
	{:else}
		<DataTable {columns} {rows} key={(a) => a.user_id} caption={t(`admin.accounts.tab.${tab}`)}>
			{#snippet cell(a, col)}
				{#if col.key === 'sel'}
					<input
						type="checkbox"
						class="sel"
						aria-label={t('admin.accounts.selectOne', { email: a.email })}
						checked={selected.includes(a.user_id)}
						onchange={(e) => {
							const on = (e.currentTarget as HTMLInputElement).checked;
							selected = on ? [...selected, a.user_id] : selected.filter((x) => x !== a.user_id);
						}}
					/>
				{:else if col.key === 'email'}<span class="email">{a.email}</span
					>{#if a.status === 'rejected'}<span class="vt-small vt-muted">
							· {t('admin.accounts.rejected')}{a.reject_reason ? `: ${a.reject_reason}` : ''}</span
						>{/if}
				{:else if col.key === 'role'}{roleLabel(a.role)}{#if a.measurer_code}
						{a.measurer_code}{/if}
				{:else if col.key === 'business'}{a.business_name ?? '—'}
				{:else if col.key === 'phone'}{a.phone ?? '—'}
				{:else if col.key === 'area'}{a.area ?? '—'}
				{:else if col.key === 'registered'}{formatDate(a.registered_at)}
				{:else}
					<span class="acts">
						{#if a.status === 'pending'}
							<Button
								loading={busy === a.user_id + 'approve'}
								disabled={!network.online}
								onclick={() => act(a, 'approve')}
								>{t('admin.accounts.approve')}<span class="vt-visually-hidden">
									{a.email}</span
								></Button
							>
							<Button
								variant="secondary"
								disabled={!network.online}
								onclick={() => ((rejectFor = a), (rejectReason = ''), (rejectTried = false))}
								>{t('admin.accounts.reject')}<span class="vt-visually-hidden">
									{a.email}</span
								></Button
							>
						{:else if a.status === 'active' && a.user_id !== session.user?.user_id}
							<Button
								variant="secondary"
								disabled={!network.online}
								onclick={() => (disableFor = a)}
								>{t('admin.accounts.disable')}<span class="vt-visually-hidden">
									{a.email}</span
								></Button
							>
						{:else if a.status === 'disabled' || a.status === 'rejected'}
							<Button
								variant="secondary"
								loading={busy === a.user_id + 'enable'}
								disabled={!network.online}
								onclick={() => act(a, 'enable')}
								>{t('admin.accounts.enable')}<span class="vt-visually-hidden">
									{a.email}</span
								></Button
							>
						{/if}
					</span>
				{/if}
			{/snippet}
		</DataTable>
	{/if}
</div>

<section class="panel" aria-labelledby="m-h">
	<h2 id="m-h">{t('admin.measurer.title')}</h2>
	<p class="vt-muted">{t('admin.measurer.intro')}</p>
	<Button variant="secondary" icon="plus" onclick={() => (measurerOpen = true)}
		>{t('admin.measurer.create')}</Button
	>
</section>

<Dialog
	open={!!rejectFor}
	onclose={() => (rejectFor = null)}
	title={t('admin.accounts.rejectTitle', { email: rejectFor?.email ?? '' })}
>
	<Field
		label={t('admin.accounts.reason')}
		error={rejectTried && !rejectReason.trim() ? t('validate.required') : null}
	>
		{#snippet children({ id, describedby, invalid })}
			<input
				{id}
				class="vt-input"
				bind:value={rejectReason}
				maxlength="200"
				aria-describedby={describedby}
				aria-invalid={invalid || undefined}
			/>
		{/snippet}
	</Field>
	{#snippet actions()}
		<Button variant="text" onclick={() => (rejectFor = null)}>{t('common.cancel')}</Button>
		<Button variant="danger" onclick={confirmReject}>{t('admin.accounts.reject')}</Button>
	{/snippet}
</Dialog>

<Dialog
	open={!!disableFor}
	onclose={() => (disableFor = null)}
	title={t('admin.accounts.disableTitle', { email: disableFor?.email ?? '' })}
>
	<p>{t('admin.accounts.disableBody')}</p>
	{#snippet actions()}
		<Button variant="text" onclick={() => (disableFor = null)}>{t('common.cancel')}</Button>
		<Button
			variant="danger"
			onclick={() => {
				const a = disableFor!;
				disableFor = null;
				void act(a, 'disable');
			}}>{t('admin.accounts.disable')}</Button
		>
	{/snippet}
</Dialog>

<Dialog bind:open={measurerOpen} title={t('admin.measurer.create')}>
	<MeasurerForm
		oncreated={(a) => {
			measurerOpen = false;
			toast(t('admin.measurer.created', { code: a.measurer_code ?? '' }), { tone: 'success' });
			void res.load();
		}}
	/>
</Dialog>

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--vt-s-8);
	}
	.tabs {
		display: flex;
		gap: var(--vt-s-4);
		border-bottom: 2px solid var(--vt-line);
		margin-bottom: var(--vt-s-16);
		overflow-x: auto;
	}
	[role='tab'] {
		display: inline-flex;
		align-items: center;
		gap: var(--vt-s-8);
		min-height: var(--vt-target);
		padding: 0 var(--vt-s-16);
		border: 0;
		border-bottom: 3px solid transparent;
		margin-bottom: -2px;
		background: transparent;
		color: var(--vt-ink-muted);
		font-weight: 700;
		cursor: pointer;
	}
	[role='tab'][aria-selected='true'] {
		color: var(--vt-thread);
		border-bottom-color: var(--vt-kitenge);
	}
	.count {
		padding: 0 6px;
		border-radius: 999px;
		background: var(--vt-chalk);
		color: var(--vt-ink);
		font-size: var(--vt-fs-14);
	}
	.bulk {
		margin-bottom: var(--vt-s-12);
	}
	.sel {
		width: 24px;
		height: 24px;
		accent-color: var(--vt-thread);
	}
	.email {
		font-weight: 700;
		overflow-wrap: anywhere;
	}
	.acts {
		display: inline-flex;
		flex-wrap: wrap;
		gap: var(--vt-s-8);
		justify-content: flex-end;
	}
	.panel {
		margin-top: var(--vt-s-24);
		padding: var(--vt-s-16);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius-lg);
	}
</style>
