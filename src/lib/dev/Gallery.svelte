<script lang="ts">
	/*
	 * Component gallery (Section 8.4), development builds only. Demo content is
	 * sample data; component strings themselves come from the i18n dictionaries.
	 */
	import { formatLength } from '$lib/domain/units';
	import { ISO_TERMS, SITES } from '$lib/domain/sites';
	import {
		validateClientCode,
		validateHeightCm,
		validateDueDate,
		nairobiToday,
		addDays
	} from '$lib/domain/validate';
	import { t, locale } from '$lib/i18n/t.svelte';
	import type { AuditEntry, Flag, OrderStatus, SyncStatus } from '$lib/api/types';
	import AuditRow from '$lib/ui/AuditRow.svelte';
	import Banner from '$lib/ui/Banner.svelte';
	import BottomSheet from '$lib/ui/BottomSheet.svelte';
	import Button from '$lib/ui/Button.svelte';
	import CheckList, { type CheckKey, type RowState } from '$lib/ui/CheckList.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import CodeInput from '$lib/ui/CodeInput.svelte';
	import Countdown from '$lib/ui/Countdown.svelte';
	import DataTable from '$lib/ui/DataTable.svelte';
	import DatePicker from '$lib/ui/DatePicker.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import ErrorState from '$lib/ui/ErrorState.svelte';
	import Field from '$lib/ui/Field.svelte';
	import FlagBadge from '$lib/ui/FlagBadge.svelte';
	import LangToggle from '$lib/ui/LangToggle.svelte';
	import LevelBubble from '$lib/ui/LevelBubble.svelte';
	import NumberInput from '$lib/ui/NumberInput.svelte';
	import PasswordInput from '$lib/ui/PasswordInput.svelte';
	import ProgressSteps, { type StepKey } from '$lib/ui/ProgressSteps.svelte';
	import QRCode from '$lib/ui/QRCode.svelte';
	import RadioCards from '$lib/ui/RadioCards.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Silhouette, { type SilhouetteItem } from '$lib/ui/Silhouette.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import StatusChips from '$lib/ui/StatusChips.svelte';
	import SyncBadge from '$lib/ui/SyncBadge.svelte';
	import { toast } from '$lib/ui/toast.svelte';

	let loading = $state(false);
	let code = $state('AB12');
	let codeTouched = $state(false);
	let height = $state<number | null>(250);
	let sex = $state<'female' | 'male' | 'unspecified'>('female');
	let agree = $state(false);
	let due = $state(addDays(nairobiToday(), -1));
	let garment = $state<'shirt' | 'dress' | 'trousers'>('shirt');
	let password = $state('blue tea');
	let dialogOpen = $state(false);
	let sheetOpen = $state(false);
	let beta = $state(84);
	let gamma = $state(1);
	let step = $state<StepKey>('consent');
	let count = $state(3);
	let statuses = $state<OrderStatus[]>(['new']);
	let selectedSite = $state<SilhouetteItem['site'] | null>('waist');

	const sampleMm: Record<string, number | null> = {
		neck: 372,
		shoulder: 405,
		chest: 985,
		waist: 860,
		hip: 1012,
		sleeve: 592,
		outleg: 1005,
		inleg: null
	};
	const sampleFlag: Record<string, Flag> = { waist: 'check', inleg: 'fail' };
	const items: SilhouetteItem[] = $derived(
		SITES.map((s) => ({
			site: s,
			label: t(s === 'chest' && sex === 'female' ? 'site.bust' : `site.${s}`),
			value: formatLength(sampleMm[s] ?? null, 'cm', locale.lang === 'sw' ? 'sw-KE' : 'en-KE'),
			flag: sampleFlag[s] ?? 'pass',
			iso: ISO_TERMS[s]
		}))
	);
	const checks: Partial<Record<CheckKey, RowState>> = {
		level: 'pass',
		frame: 'pass',
		distance: 'fail',
		symmetry: 'pending'
	};
	const audit: AuditEntry[] = [
		{
			log_id: '1',
			occurred_at: '2027-05-12T07:42:00Z',
			user_email: 'wanjiru@vt.test',
			role: 'tailor',
			action: 'override',
			entity_type: 'order',
			entity_id: 'x',
			summary: 'ORD-0231 Waist overridden'
		},
		{
			log_id: '2',
			occurred_at: '2027-05-12T07:30:00Z',
			user_email: 'wanjiru@vt.test',
			role: 'tailor',
			action: 'profile_view',
			entity_type: 'profile',
			entity_id: 'y',
			summary: 'Profile AB1234 v2'
		}
	];
	type Row = { code: string; name: string; last: string; sync: SyncStatus };
	const rows: Row[] = [
		{ code: 'AB1234', name: 'Amina', last: '12 May 2027', sync: 'synced' },
		{ code: 'MW3310', name: '—', last: '30 Apr 2027', sync: 'pending' },
		{ code: 'DK4402', name: 'Dennis', last: '8 May 2027', sync: 'conflict' }
	];
</script>

<svelte:head><title>{t('dev.ui.title')} · VT</title></svelte:head>

<header class="top">
	<h1>{t('dev.ui.title')}</h1>
	<LangToggle />
</header>

<main id="main" class="gallery">
	<section>
		<h2>Button</h2>
		<div class="row">
			<Button>{t('common.continue')}</Button>
			<Button variant="secondary">{t('common.back')}</Button>
			<Button variant="text">{t('common.cancel')}</Button>
			<Button variant="danger" icon="x">{t('common.delete')}</Button>
			<Button
				{loading}
				onclick={() => ((loading = true), setTimeout(() => (loading = false), 1500))}
				>{t('common.save')}</Button
			>
			<Button disabled>{t('common.save')}</Button>
		</div>
		<Button size="lg" full icon="chevron-right">{t('common.continue')}</Button>
	</section>

	<section>
		<h2>LangToggle · Banner · Toast</h2>
		<div class="row"><LangToggle /></div>
		<Banner tone="offline">{t('banner.offline')}</Banner>
		<Banner tone="warning">{t('banner.unreviewedSw')}</Banner>
		<div class="row">
			<Button variant="secondary" onclick={() => toast(t('common.copied'), { tone: 'success' })}
				>Toast</Button
			>
			<Button
				variant="secondary"
				onclick={() =>
					toast(t('toast.updateReady'), {
						action: { label: t('toast.refresh'), run: () => {} },
						timeout: 0
					})}>Toast + action</Button
			>
		</div>
	</section>

	<section>
		<h2>Field · CodeInput · NumberInput</h2>
		<Field
			label={t('code.label')}
			hint={t('code.hint')}
			error={codeTouched && validateClientCode(code) ? t('validate.code') : null}
		>
			{#snippet children({ id, describedby, invalid })}
				<CodeInput
					{id}
					{describedby}
					{invalid}
					bind:value={code}
					onblur={() => (codeTouched = true)}
				/>
			{/snippet}
		</Field>
		<Field
			label={t('site.stature')}
			hint="120–220"
			error={validateHeightCm(height) ? t('validate.height') : null}
		>
			{#snippet children({ id, describedby, invalid })}
				<NumberInput {id} {describedby} {invalid} bind:value={height} unit={t('unit.cm')} />
			{/snippet}
		</Field>
		<Field label="Ease" optional>
			{#snippet children({ id, describedby })}
				<NumberInput {id} {describedby} decimals={1} value={2.5} unit={t('unit.cm')} />
			{/snippet}
		</Field>
		<Field label="Password" error={null}>
			{#snippet children({ id, describedby, invalid })}
				<PasswordInput
					{id}
					{describedby}
					{invalid}
					bind:value={password}
					meter
					autocomplete="new-password"
				/>
			{/snippet}
		</Field>
	</section>

	<section>
		<h2>RadioCards · Checkbox · DatePicker · Select</h2>
		<RadioCards
			legend="Sex"
			hint="Used only to pick the chest level rule."
			bind:value={sex}
			options={[
				{ value: 'female', label: 'Female' },
				{ value: 'male', label: 'Male' },
				{ value: 'unspecified', label: 'Prefer not to say' }
			]}
		/>
		<Checkbox bind:checked={agree}>I agree to be measured from my photos.</Checkbox>
		<div style="height: 16px"></div>
		<Field label="Due date" error={validateDueDate(due) ? t(validateDueDate(due)!) : null}>
			{#snippet children({ id, describedby, invalid })}
				<DatePicker
					{id}
					{describedby}
					{invalid}
					bind:value={due}
					min={nairobiToday()}
					max={addDays(nairobiToday(), 180)}
				/>
			{/snippet}
		</Field>
		<Field label="Garment">
			{#snippet children({ id, describedby })}
				<Select
					{id}
					{describedby}
					bind:value={garment}
					options={[
						{ value: 'shirt', label: t('garment.shirt') },
						{ value: 'dress', label: t('garment.dress') },
						{ value: 'trousers', label: t('garment.trousers') }
					]}
				/>
			{/snippet}
		</Field>
	</section>

	<section>
		<h2>Dialog · BottomSheet</h2>
		<div class="row">
			<Button variant="secondary" onclick={() => (dialogOpen = true)}>Open dialog</Button>
			<Button variant="secondary" onclick={() => (sheetOpen = true)}>Open bottom sheet</Button>
		</div>
		<Dialog bind:open={dialogOpen} title="Delete these measurements from this phone?">
			<p>They have not been sent.</p>
			{#snippet actions()}
				<Button variant="text" onclick={() => (dialogOpen = false)}>{t('common.cancel')}</Button>
				<Button variant="danger" onclick={() => (dialogOpen = false)}>{t('common.delete')}</Button>
			{/snippet}
		</Dialog>
		<BottomSheet bind:open={sheetOpen} title={t('site.waist')}>
			<p>{t('flagReason.scale_disagree', { pct: 3.2 })}</p>
			<FlagBadge flag="check" reason={t('flagReason.scale_disagree', { pct: 3.2 })} />
		</BottomSheet>
	</section>

	<section>
		<h2>FlagBadge · SyncBadge · StatusChips</h2>
		<div class="row">
			<FlagBadge flag="pass" />
			<FlagBadge flag="check" />
			<FlagBadge flag="fail" />
		</div>
		<FlagBadge flag="fail" reason={t('flagReason.crotch_not_found')} />
		<div class="row">
			{#each ['pending', 'synced', 'conflict', 'rejected'] as const as s (s)}<SyncBadge
					status={s}
				/>{/each}
		</div>
		<StatusChips
			label="Order status"
			bind:selected={statuses}
			chips={(['new', 'cutting', 'fitting', 'ready', 'collected'] as const).map((s, i) => ({
				value: s,
				label: t(`status.${s}`),
				count: [3, 2, 2, 2, 1][i]
			}))}
		/>
	</section>

	<section>
		<h2>Silhouette</h2>
		<Silhouette
			{items}
			selected={selectedSite}
			onselect={(s) => (selectedSite = s as SilhouetteItem['site'])}
			title="Measurement diagram"
		/>
		<Silhouette {items} mode="numbers" />
	</section>

	<section class="dark vt-theme-capture">
		<h2>LevelBubble · CheckList · Countdown (capture theme)</h2>
		<div class="row">
			<label>beta <input type="range" min="70" max="110" bind:value={beta} /> {beta}°</label>
			<label>gamma <input type="range" min="-10" max="10" bind:value={gamma} /> {gamma}°</label>
		</div>
		<div class="row capture">
			<LevelBubble {beta} {gamma} />
			<LevelBubble {beta} {gamma} variant="bar" />
			<CheckList states={checks} />
			<div class="cd">
				<Countdown n={count} />
				<Button variant="secondary" onclick={() => (count = count > 1 ? count - 1 : 3)}>−1</Button>
			</div>
		</div>
		<LevelBubble beta={null} gamma={null} />
	</section>

	<section>
		<h2>ProgressSteps</h2>
		<ProgressSteps current={step} />
		<div class="row">
			{#each ['details', 'consent', 'setup', 'front', 'side', 'review'] as const as s (s)}
				<Button variant="text" onclick={() => (step = s)}>{s}</Button>
			{/each}
		</div>
		<CheckList states={checks} tone="onLight" />
	</section>

	<section>
		<h2>DataTable (table ≥ 768 px, cards below)</h2>
		<DataTable
			columns={[
				{ key: 'code', label: 'Code', primary: true },
				{ key: 'name', label: 'Name' },
				{ key: 'last', label: 'Last capture' },
				{ key: 'sync', label: 'Sync', align: 'end' }
			]}
			{rows}
			key={(r) => r.code}
		>
			{#snippet cell(row, col)}
				{#if col.key === 'sync'}<SyncBadge status={row.sync} />
				{:else if col.key === 'code'}<span class="vt-mono">{row.code}</span>
				{:else}{row[col.key as 'name' | 'last']}{/if}
			{/snippet}
		</DataTable>
	</section>

	<section>
		<h2>EmptyState · ErrorState · Skeleton</h2>
		<EmptyState
			title="No clients yet."
			body="Issue a code and send it to your client on WhatsApp."
			icon="user"
		>
			{#snippet action()}<Button icon="plus">New client code</Button>{/snippet}
		</EmptyState>
		<ErrorState body={t('error.offline')} onretry={() => toast(t('common.retry'))} />
		<Skeleton lines={4} />
	</section>

	<section>
		<h2>QRCode · AuditRow</h2>
		<QRCode text="https://vt.example/start?code=AB1234" size={180} />
		<ul class="audit">
			{#each audit as e (e.log_id)}<AuditRow entry={e} showUser />{/each}
		</ul>
	</section>
</main>

<style>
	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--vt-s-16);
		border-bottom: 1px solid var(--vt-line);
		background: var(--vt-paper);
		position: sticky;
		top: 0;
		z-index: 10;
	}
	.top h1 {
		margin: 0;
		font-size: var(--vt-fs-22);
	}
	.gallery {
		max-width: 64rem;
		margin: 0 auto;
		padding: var(--vt-s-16);
		display: grid;
		gap: var(--vt-s-24);
	}
	section {
		display: grid;
		gap: var(--vt-s-12);
		padding: var(--vt-s-16);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius-lg);
	}
	section h2 {
		font-size: var(--vt-fs-16);
		color: var(--vt-ink-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--vt-s-8);
		align-items: center;
	}
	.dark {
		background: var(--vt-capture-bg);
		color: #fff;
		border-color: #333;
	}
	.dark h2 {
		color: #c9c4bc;
	}
	.capture {
		gap: var(--vt-s-24);
		align-items: flex-start;
	}
	.cd {
		display: grid;
		gap: var(--vt-s-8);
		justify-items: center;
	}
	.audit {
		padding: 0;
		margin: 0;
	}
</style>
