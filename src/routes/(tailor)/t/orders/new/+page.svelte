<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { goto, beforeNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { api } from '$lib/api';
	import { ApiError } from '$lib/api/errors';
	import type {
		ClientDetail,
		ClientSummary,
		GarmentType,
		MeasurementProfile,
		SiteCode
	} from '$lib/api/types';
	import { problemKey } from '$lib/dashboard/errors';
	import { flagSummaryText } from '$lib/dashboard/flags';
	import ItemsEditor from '$lib/dashboard/ItemsEditor.svelte';
	import {
		easeError,
		rowsFromProfile,
		toItemInputs,
		unresolved,
		type EditRow
	} from '$lib/dashboard/items';
	import { loadMe, meStore, unit } from '$lib/dashboard/me.svelte';
	import { network } from '$lib/device/network.svelte';
	import { GARMENT_SITES, GARMENTS, SITES } from '$lib/domain/sites';
	import { mmToUnit } from '$lib/domain/units';
	import { addDays, DUE_MAX_DAYS, nairobiToday, validateDueDate } from '$lib/domain/validate';
	import { formatDate, formatDateTime, t } from '$lib/i18n/t.svelte';
	import Banner from '$lib/ui/Banner.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import DatePicker from '$lib/ui/DatePicker.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import ErrorState from '$lib/ui/ErrorState.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import { toast } from '$lib/ui/toast.svelte';

	const profileId = $derived(page.url.searchParams.get('profileId'));
	const pickClientId = $derived(page.url.searchParams.get('clientId'));

	// --- picker (no profile yet): client → profile (Section 13.7 FAB) ---
	let search = $state('');
	let clients = $state<ClientSummary[] | null>(null);
	let pickClient = $state<ClientDetail | null>(null);
	let pickError = $state<unknown>(null);
	$effect(() => {
		if (profileId) return;
		const q = search.trim();
		const h = setTimeout(async () => {
			try {
				clients = (await api().listClients({ search: q, page_size: 25 })).items.filter(
					(c) => c.latest_profile_id
				);
			} catch (e) {
				pickError = e;
			}
		}, 300);
		return () => clearTimeout(h);
	});
	$effect(() => {
		if (profileId || !pickClientId) {
			pickClient = null;
			return;
		}
		void api()
			.getClient(pickClientId)
			.then((c) => (pickClient = c))
			.catch((e) => (pickError = e));
	});

	// --- the order form ---
	let profile = $state<MeasurementProfile | null>(null);
	let client = $state<ClientDetail | null>(null);
	let loadError = $state<unknown>(null);
	let garment = $state<GarmentType>('shirt');
	let showAll = $state(false);
	let due = $state('');
	let notes = $state('');
	let rows = $state<EditRow[]>([]);
	let submitted = $state(false);
	let saving = $state(false);
	let saveError = $state<string | null>(null);
	let baseline = $state('');
	let confirmLeave = $state(false);
	let leaving = false;

	$effect(() => {
		const id = profileId;
		if (!id) return;
		profile = null;
		loadError = null;
		void (async () => {
			try {
				const [p] = await Promise.all([api().getProfile(id), loadMe()]);
				profile = p;
				client = p.client_id ? await api().getClient(p.client_id) : null;
				rebuild();
				await tick();
				baseline = snapshot;
			} catch (e) {
				loadError = e;
			}
		})();
	});

	const sites = $derived<SiteCode[]>(showAll ? [...SITES] : GARMENT_SITES[garment]);

	/** Rebuild rows for the garment, keeping edits on sites that stay. */
	function rebuild() {
		if (!profile) return;
		const fresh = rowsFromProfile(sites, profile.measurements, {}, unit());
		const prev = untrack(() => rows);
		rows = fresh.map((f) => prev.find((r) => r.site_code === f.site_code) ?? f);
	}
	$effect(() => {
		void sites;
		untrack(rebuild);
	});

	const presets = $derived(meStore.me?.ease_presets?.[garment] ?? null);
	function applyPresets() {
		if (!presets) return;
		for (const r of rows) {
			const mm = presets[r.site_code];
			if (mm != null) r.ease = mmToUnit(mm, unit());
		}
		toast(t('tailor.order.presetsApplied'), { tone: 'success' });
	}

	const today = nairobiToday();
	const dueKey = $derived(validateDueDate(due));
	const dueErr = $derived(submitted && dueKey ? t(dueKey) : null);
	const open = $derived(unresolved(rows));
	const easeBad = $derived(rows.some((r) => easeError(r, unit())));
	const notesBad = $derived(notes.length > 1000);
	const canSave = $derived(
		!!profile && open.length === 0 && !easeBad && !notesBad && !dueKey && network.online && !saving
	);

	const snapshot = $derived(JSON.stringify({ garment, due, notes, showAll, rows }));
	const dirty = $derived(baseline !== '' && snapshot !== baseline);

	beforeNavigate((nav) => {
		if (leaving || !dirty || !profile || nav.type === 'leave') return;
		if (nav.to?.url.pathname === page.url.pathname) return;
		nav.cancel();
		pendingNav = nav.to?.url.href ?? null;
		confirmLeave = true;
	});
	let pendingNav = $state<string | null>(null);
	async function leave() {
		leaving = true;
		confirmLeave = false;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- target came from the router
		await goto(pendingNav ?? resolve('/t/orders'));
	}

	async function save(e: SubmitEvent) {
		e.preventDefault();
		submitted = true;
		saveError = null;
		if (!canSave || !profile || !client) return;
		saving = true;
		try {
			const o = await api().createOrder({
				client_id: client.client_id,
				profile_id: profile.profile_id,
				garment_type: garment,
				due_date: due,
				notes: notes.trim(),
				items: toItemInputs(rows, unit())
			});
			leaving = true;
			toast(t('tailor.order.saved', { no: o.order_no }), { tone: 'success' });
			await goto(resolve('/(tailor)/t/orders/[orderId]', { orderId: o.order_id }));
		} catch (err) {
			saveError = err instanceof ApiError ? t(problemKey(err)) : t('error.generic.body');
		} finally {
			saving = false;
		}
	}

	function choose(id: string) {
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- same route with a query
		void goto(`${resolve('/t/orders/new')}?profileId=${id}`, { replaceState: true });
	}
	function changeProfile() {
		leaving = true;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- same route with a query
		void goto(`${resolve('/t/orders/new')}?clientId=${client?.client_id ?? ''}`).then(
			() => (leaving = false)
		);
	}
</script>

<svelte:head><title>{t('tailor.order.newTitle')} · {t('app.name')}</title></svelte:head>

<a class="back" href={resolve('/t/orders')}>‹ {t('tailor.nav.orders')}</a>
<h1>{t('tailor.order.newTitle')}</h1>

{#if !profileId}
	<!-- Picker: client, then profile -->
	{#if pickClient}
		<h2>{t('tailor.order.pickProfile', { code: pickClient.client_code })}</h2>
		{#if pickClient.profiles.length === 0}
			<EmptyState title={t('tailor.client.noProfiles')} icon="phone" />
		{:else}
			<ul class="picks">
				{#each pickClient.profiles as p (p.profile_id + p.version)}
					<li>
						<button type="button" class="pick" onclick={() => choose(p.profile_id)}>
							<span class="title"
								>{t('tailor.client.profileVersion', { version: p.version })} · {formatDateTime(
									p.captured_at
								)}</span
							>
							<span class="vt-small vt-muted">{flagSummaryText(p.flags)}</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
		<Button variant="text" href={resolve('/t/orders/new')}>{t('tailor.order.otherClient')}</Button>
	{:else}
		<h2>{t('tailor.order.pickClient')}</h2>
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
		{#if pickError}
			<ErrorState body={t(problemKey(pickError))} />
		{:else if clients === null}
			<Skeleton lines={4} />
		{:else if clients.length === 0}
			<EmptyState title={t('tailor.order.noClientsWithProfiles')} icon="user" />
		{:else}
			<ul class="picks">
				{#each clients as c (c.client_id)}
					<li>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved path plus a query -->
						<a class="pick" href={`${resolve('/t/orders/new')}?clientId=${c.client_id}`}>
							<span class="title vt-mono">{c.client_code}</span>
							<span
								>{c.display_name ?? '—'} · {c.last_capture_at
									? formatDate(c.last_capture_at)
									: ''}</span
							>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
{:else if loadError}
	<ErrorState body={t(problemKey(loadError))} />
{:else if !profile}
	<Skeleton lines={8} height={24} />
{:else}
	<p class="sub">
		{t('tailor.order.subline', {
			client: client
				? `${client.client_code}${client.display_name ? ` (${client.display_name})` : ''}`
				: profile.client_code,
			date: formatDate(profile.captured_at),
			version: profile.version
		})}
		<Button variant="text" onclick={changeProfile}>{t('tailor.order.changeProfile')}</Button>
	</p>

	<form class="form" novalidate onsubmit={save}>
		<div class="two">
			<Field label={t('tailor.order.garment')}>
				{#snippet children({ id, describedby })}
					<Select
						{id}
						{describedby}
						bind:value={garment}
						options={GARMENTS.map((g) => ({ value: g, label: t(`garment.${g}`) }))}
					/>
				{/snippet}
			</Field>
			<Field label={t('tailor.order.due')} hint={t('tailor.order.dueHint')} error={dueErr}>
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
		</div>

		<div class="row">
			<Checkbox bind:checked={showAll}>{t('tailor.order.showAll')}</Checkbox>
			{#if presets}
				<Button variant="secondary" onclick={applyPresets}
					>{t('tailor.order.applyPresets', { garment: t(`garment.${garment}`) })}</Button
				>
			{/if}
		</div>

		<ItemsEditor
			bind:rows
			unit={unit()}
			sex={profile.covariates.sex}
			scalePct={profile.session.scale_disagreement_pct}
		/>

		<Field
			label={t('tailor.order.notes')}
			hint={t('tailor.order.notesHint', { count: notes.length })}
			error={notesBad ? t('tailor.order.notesTooLong') : null}
			optional
		>
			{#snippet children({ id, describedby, invalid })}
				<textarea
					{id}
					class="vt-input"
					rows="4"
					bind:value={notes}
					placeholder={t('tailor.order.notesPlaceholder')}
					aria-describedby={describedby}
					aria-invalid={invalid || undefined}
				></textarea>
			{/snippet}
		</Field>

		{#if open.length}
			<p class="block vt-small" role="status">
				{t('tailor.order.mustResolve', { count: open.length })}
			</p>
		{/if}
		{#if saveError}<Banner tone="danger">{saveError}</Banner>{/if}
		{#if !network.online}<p class="vt-small vt-muted">{t('dash.offlineDisabled')}</p>{/if}

		<div class="row">
			<Button
				type="submit"
				size="lg"
				loading={saving}
				disabled={open.length > 0 || easeBad || !network.online}>{t('tailor.order.save')}</Button
			>
			<Button variant="secondary" href={resolve('/t/orders')}>{t('common.cancel')}</Button>
		</div>
	</form>
{/if}

<Dialog bind:open={confirmLeave} title={t('tailor.order.leaveTitle')}>
	<p>{t('tailor.order.leaveBody')}</p>
	{#snippet actions()}
		<Button variant="text" onclick={() => (confirmLeave = false)}
			>{t('tailor.order.keepEditing')}</Button
		>
		<Button variant="danger" onclick={leave}>{t('tailor.order.discard')}</Button>
	{/snippet}
</Dialog>

<style>
	.back {
		display: inline-flex;
		align-items: center;
		min-height: var(--vt-target);
		font-weight: 600;
	}
	.sub {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--vt-s-8);
		color: var(--vt-ink-muted);
	}
	.form {
		display: grid;
		gap: var(--vt-s-16);
	}
	.two {
		display: grid;
		gap: 0 var(--vt-s-16);
	}
	@media (min-width: 768px) {
		.two {
			grid-template-columns: 1fr 1fr;
		}
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--vt-s-8);
		align-items: center;
	}
	.block {
		margin: 0;
		padding: var(--vt-s-8) var(--vt-s-12);
		border-radius: var(--vt-radius);
		background: var(--vt-check-fill);
		color: var(--vt-check-ink);
		font-weight: 700;
	}
	textarea {
		resize: vertical;
	}
	.picks {
		list-style: none;
		margin: 0 0 var(--vt-s-16);
		padding: 0;
		display: grid;
		gap: var(--vt-s-8);
	}
	.pick {
		display: grid;
		gap: 2px;
		width: 100%;
		min-height: var(--vt-target);
		padding: var(--vt-s-12) var(--vt-s-16);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius);
		background: var(--vt-paper);
		color: var(--vt-ink);
		text-align: left;
		text-decoration: none;
		font: inherit;
		cursor: pointer;
	}
	.pick:hover {
		border-color: var(--vt-thread);
	}
	.title {
		font-weight: 800;
	}
</style>
