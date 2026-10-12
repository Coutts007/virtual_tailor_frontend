<script lang="ts">
	import type { UnitPref } from '$lib/api/types';
	import { mmToUnit, unitToMm } from '$lib/domain/units';
	import { t } from '$lib/i18n/t.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import Field from '$lib/ui/Field.svelte';
	import FlagBadge from '$lib/ui/FlagBadge.svelte';
	import NumberInput from '$lib/ui/NumberInput.svelte';
	import { easeError, finishedMm, isResolved, type EditRow } from './items';
	import { reasonText, siteLabel } from './flags';
	import { len } from './format';
	import type { Sex } from '$lib/api/types';

	/**
	 * Measurements table of an order: Site · Body · Ease · Finished (Section 13.6).
	 * Body is read-only with an override; flagged rows must be confirmed or
	 * overridden; failed rows need an override or "Will measure at fitting".
	 */
	let {
		rows = $bindable(),
		unit,
		editable = true,
		sex,
		scalePct
	}: {
		rows: EditRow[];
		unit: UnitPref;
		editable?: boolean;
		sex?: Sex;
		scalePct?: number;
	} = $props();

	let overrideIdx = $state<number | null>(null);
	let overrideValue = $state<number | null>(null);
	let overrideReason = $state('');
	let overrideTried = $state(false);
	let dialogOpen = $state(false);
	const unitLabel = $derived(t(`unit.${unit}`));
	const overrideErr = $derived(
		overrideTried && (overrideValue == null || overrideValue <= 0) ? t('validate.number') : null
	);

	function openOverride(i: number) {
		const r = rows[i]!;
		overrideIdx = i;
		overrideValue = r.body_mm == null ? null : mmToUnit(r.body_mm, unit);
		overrideReason = r.override_reason ?? '';
		overrideTried = false;
		dialogOpen = true;
	}
	function applyOverride() {
		overrideTried = true;
		if (overrideIdx == null || overrideErr || overrideValue == null) return;
		const r = rows[overrideIdx]!;
		r.body_mm = unitToMm(overrideValue, unit);
		r.overridden = true;
		r.override_reason = overrideReason.trim() || undefined;
		r.pending_fitting = false;
		dialogOpen = false;
	}
	function undoOverride(i: number) {
		const r = rows[i]!;
		r.body_mm = r.auto_mm;
		r.overridden = false;
		r.override_reason = undefined;
	}
</script>

<div class="items" role="region" aria-label={t('tailor.order.items')}>
	<table>
		<caption class="vt-visually-hidden">{t('tailor.order.items')}</caption>
		<thead>
			<tr>
				<th scope="col">{t('tailor.sheet.site')}</th>
				<th scope="col" class="end">{t('tailor.order.body')}</th>
				<th scope="col">{t('tailor.order.ease', { unit: unitLabel })}</th>
				<th scope="col" class="end">{t('tailor.order.finished')}</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as r, i (r.site_code)}
				{@const resolved = isResolved(r)}
				<tr class:flagged={r.flag !== 'pass'} class:open={!resolved}>
					<th scope="row" class="site">
						<span class="name">{siteLabel(r.site_code, sex)}</span>
						{#if r.flag !== 'pass'}
							<FlagBadge flag={r.flag} size="sm" />
							{#if !r.overridden && !r.pending_fitting}
								<span class="help vt-small"
									>{t('tailor.order.flaggedHelp', {
										reason: reasonText({ flag_reasons: r.reasons }, scalePct)
									})}</span
								>
							{/if}
						{/if}
					</th>
					<td class="end body" data-label={t('tailor.order.body')}>
						<span class="vt-num">{len(r.body_mm)}</span>
						{#if r.overridden}<span class="vt-small ov">{t('tailor.order.overridden')}</span>{/if}
						{#if editable}
							<span class="bodyacts">
								<Button variant="text" icon="pencil" onclick={() => openOverride(i)}>
									<span class="vt-visually-hidden">{siteLabel(r.site_code, sex)}: </span>{t(
										'tailor.order.override'
									)}
								</Button>
								{#if r.overridden}<Button variant="text" onclick={() => undoOverride(i)}
										>{t('tailor.order.undoOverride')}</Button
									>{/if}
							</span>
						{/if}
					</td>
					<td data-label={t('tailor.order.ease', { unit: unitLabel })}>
						{#if editable}
							<NumberInput
								bind:value={r.ease}
								decimals={unit === 'cm' ? 1 : 3}
								unit={unitLabel}
								invalid={easeError(r, unit)}
								describedby={easeError(r, unit) ? `ease-err-${r.site_code}` : undefined}
								id={`ease-${r.site_code}`}
							/>
							<label class="vt-visually-hidden" for={`ease-${r.site_code}`}
								>{siteLabel(r.site_code, sex)} {t('tailor.order.ease', { unit: unitLabel })}</label
							>
							{#if easeError(r, unit)}<span class="err vt-small" id={`ease-err-${r.site_code}`}
									>{t('validate.ease')}</span
								>{/if}
						{:else}
							<span class="vt-num">{r.ease ?? 0} {unitLabel}</span>
						{/if}
					</td>
					<td class="end" data-label={t('tailor.order.finished')}>
						<strong class="vt-num"
							>{r.pending_fitting && !r.overridden
								? t('tailor.order.atFitting')
								: len(finishedMm(r, unit))}</strong
						>
					</td>
				</tr>
				{#if editable && r.flag !== 'pass' && !r.overridden}
					<tr class="confirmrow">
						<td colspan="4">
							{#if r.body_mm != null}
								<Checkbox bind:checked={r.flag_confirmed}
									>{t('tailor.order.confirmed', { site: siteLabel(r.site_code, sex) })}</Checkbox
								>
							{:else}
								<Checkbox bind:checked={r.pending_fitting}
									>{t('tailor.order.measureAtFitting', {
										site: siteLabel(r.site_code, sex)
									})}</Checkbox
								>
							{/if}
						</td>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</div>

<Dialog
	bind:open={dialogOpen}
	title={t('tailor.order.overrideTitle', {
		site: overrideIdx != null ? siteLabel(rows[overrideIdx]!.site_code, sex) : ''
	})}
>
	<Field label={t('tailor.order.overrideValue', { unit: unitLabel })} error={overrideErr}>
		{#snippet children({ id, describedby, invalid })}
			<NumberInput
				{id}
				{describedby}
				{invalid}
				bind:value={overrideValue}
				decimals={unit === 'cm' ? 1 : 3}
				unit={unitLabel}
			/>
		{/snippet}
	</Field>
	<Field label={t('tailor.order.overrideReason')} optional>
		{#snippet children({ id, describedby })}
			<input
				{id}
				class="vt-input"
				bind:value={overrideReason}
				maxlength="200"
				aria-describedby={describedby}
			/>
		{/snippet}
	</Field>
	<p class="vt-small vt-muted">{t('tailor.order.overrideRecorded')}</p>
	{#snippet actions()}
		<Button variant="text" onclick={() => (dialogOpen = false)}>{t('common.cancel')}</Button>
		<Button onclick={applyOverride}>{t('tailor.order.overrideSave')}</Button>
	{/snippet}
</Dialog>

<style>
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th,
	td {
		padding: var(--vt-s-8);
		border-bottom: 1px solid var(--vt-line);
		vertical-align: top;
		text-align: left;
	}
	thead th {
		font-size: var(--vt-fs-14);
		color: var(--vt-ink-muted);
	}
	.end {
		text-align: right;
	}
	.site {
		display: grid;
		gap: 4px;
		justify-items: start;
		font-weight: 400;
	}
	.name {
		font-weight: 700;
	}
	.help {
		color: var(--vt-check-ink);
	}
	tr.open > .site {
		box-shadow: inset 4px 0 0 var(--vt-check);
		padding-left: var(--vt-s-12);
	}
	.items :global(.num) {
		max-width: 9.5rem;
	}
	.items :global(.vt-input) {
		width: 100%;
		min-height: var(--vt-target);
		padding: var(--vt-s-8) var(--vt-s-12);
		border: 2px solid var(--vt-line-strong);
		border-radius: var(--vt-radius);
		background: var(--vt-paper);
	}
	.items :global(.vt-input[aria-invalid='true']) {
		border-color: var(--vt-fail);
	}
	.body {
		white-space: nowrap;
	}
	.bodyacts {
		display: flex;
		justify-content: flex-end;
		flex-wrap: wrap;
	}
	.ov {
		display: block;
		color: var(--vt-thread);
		font-weight: 700;
	}
	.err {
		color: var(--vt-fail);
		font-weight: 600;
	}
	.confirmrow td {
		border-bottom: 1px solid var(--vt-line);
		padding-top: 0;
	}
	@media (max-width: 767.98px) {
		thead {
			display: none;
		}
		table,
		tbody,
		tr,
		th,
		td {
			display: block;
		}
		tr:not(.confirmrow) {
			margin-top: var(--vt-s-12);
			padding: var(--vt-s-12);
			border: 1px solid var(--vt-line);
			border-radius: var(--vt-radius);
			background: var(--vt-paper);
		}
		tr:has(+ .confirmrow) {
			border-radius: var(--vt-radius) var(--vt-radius) 0 0;
		}
		tr.open:not(.confirmrow) {
			border-left: 4px solid var(--vt-check);
		}
		tr.open > .site {
			box-shadow: none;
			padding-left: 0;
		}
		tr.confirmrow {
			padding: 0 var(--vt-s-12) var(--vt-s-12);
			border: 1px solid var(--vt-line);
			border-top: 0;
			border-radius: 0 0 var(--vt-radius) var(--vt-radius);
			background: var(--vt-paper);
		}
		th,
		td {
			border: 0;
			padding: 4px 0;
		}
		td[data-label]::before {
			content: attr(data-label);
			display: block;
			font-size: var(--vt-fs-14);
			color: var(--vt-ink-muted);
			text-align: left;
		}
		.end {
			text-align: left;
		}
		.bodyacts {
			justify-content: flex-start;
		}
	}
</style>
