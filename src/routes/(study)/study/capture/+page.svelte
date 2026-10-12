<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { api } from '$lib/api';
	import type { Participant, StudyBlock } from '$lib/api/types';
	import { t } from '$lib/i18n/t.svelte';
	import { PARTICIPANT_CODE_RE, validateHeightCm } from '$lib/domain/validate';
	import { getDeviceInfo } from '$lib/device/deviceInfo';
	import { setSetting } from '$lib/db/settings';
	import { capture, draft, loadDraft, newSession } from '$lib/client/flow.svelte';
	import Page from '$lib/client/Page.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import ErrorState from '$lib/ui/ErrorState.svelte';
	import Field from '$lib/ui/Field.svelte';
	import LangToggle from '$lib/ui/LangToggle.svelte';
	import NumberInput from '$lib/ui/NumberInput.svelte';
	import RadioCards from '$lib/ui/RadioCards.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';

	/**
	 * Study capture start (15.1): the researcher runs the client flow on the study
	 * phone with covariates; consent is paper-based ("study-paper-1.0"). The
	 * profile carries the study block (C6) and the participant's client code.
	 */
	const IPHONES = [
		'iPhone 11',
		'iPhone 12',
		'iPhone 13',
		'iPhone 14',
		'iPhone 15',
		'iPhone SE (2nd/3rd gen)',
		'Other iPhone'
	];
	let participants = $state<Participant[] | null>(null);
	let loadError = $state(false);
	let code = $state(page.url.searchParams.get('participant') ?? '');
	let setNo = $state<'1' | '2' | '3'>((page.url.searchParams.get('set') as '1' | '2' | '3') ?? '1');
	// Default comes from the set number (effect below); the researcher can override it.
	// eslint-disable-next-line svelte/prefer-writable-derived
	let mode = $state<'self' | 'assisted'>('self');
	let lighting = $state<StudyBlock['lighting']>('window');
	let distance = $state<number | null>(2.3);
	let fit = $state<'fitted' | 'loose'>('fitted');
	let stature = $state<number | null>(null);
	let phone = $state('');
	let isIphone = $state(false);
	let lux = $state<number | null>(null);
	let paper = $state(false);
	let submitted = $state(false);

	const participant = $derived(
		participants?.find((p) => p.participant_code === code.toUpperCase()) ?? null
	);
	const codeErr = $derived(
		submitted && !PARTICIPANT_CODE_RE.test(code.toUpperCase())
			? t('study.ref.participantInvalid')
			: submitted && participants && !participant
				? t('study.cap.participantUnknown', { code: code.toUpperCase() })
				: null
	);
	const distErr = $derived(
		submitted &&
			(distance == null ||
				distance < 1.5 ||
				distance > 3.5 ||
				Math.round(distance * 10) !== distance * 10)
			? t('study.cap.distanceErr')
			: null
	);
	const statureErr = $derived(submitted && validateHeightCm(stature) ? t('validate.height') : null);

	// The set number sets the default mode; the researcher can still override it (bound radio).
	$effect(() => {
		// Sets 1 and 3 are self-capture, set 2 assisted (Section 3.6.2).
		mode = setNo === '2' ? 'assisted' : 'self';
	});

	async function loadParticipants() {
		loadError = false;
		try {
			participants = await api().listParticipants();
		} catch {
			loadError = true;
		}
	}

	onMount(async () => {
		await loadDraft();
		void loadParticipants();
		const d = await getDeviceInfo();
		isIphone = d.device_model === 'iPhone';
		phone = isIphone ? IPHONES[0]! : d.device_model;
	});

	async function start(e: SubmitEvent) {
		e.preventDefault();
		submitted = true;
		if (codeErr || distErr || statureErr || !participant || !paper) return;
		const p = participant;
		draft.client_code = p.client_code;
		draft.code_verified = true;
		draft.height_cm = stature;
		draft.sex = p.sex;
		draft.fit = fit;
		draft.capture_mode = mode;
		draft.consent = {
			consent_version: 'study-paper-1.0',
			language: 'en',
			scope: ['study_paper'],
			given_at: new Date().toISOString()
		};
		await setSetting('capture_mode', mode);
		newSession();
		capture.study = {
			participant_code: p.participant_code,
			set_no: Number(setNo) as 1 | 2 | 3,
			lighting,
			distance_m: distance!,
			clothing_fit_observed: fit,
			...(lux != null ? { lux } : {})
		};
		if (draft.preflight)
			draft.preflight = {
				...draft.preflight,
				device: { ...draft.preflight.device, device_model: phone }
			};
		await goto(resolve('/setup'));
	}
</script>

<svelte:head><title>{t('study.cap.title')} · {t('app.name')}</title></svelte:head>

<header class="top">
	<h1>{t('study.cap.title')}</h1>
	<LangToggle />
</header>

<Page>
	<p class="vt-muted">{t('study.cap.intro')}</p>
	{#if loadError}
		<ErrorState onretry={loadParticipants} />
	{:else if participants === null}
		<Skeleton lines={5} height={40} />
	{:else}
		<form id="study-start" novalidate onsubmit={start}>
			<Field
				label={t('study.cap.participant')}
				hint={t('study.ref.participantHint')}
				error={codeErr}
			>
				{#snippet children({ id, describedby, invalid })}
					<input
						{id}
						class="vt-input code vt-mono"
						bind:value={code}
						aria-describedby={describedby}
						aria-invalid={invalid || undefined}
						autocomplete="off"
						autocapitalize="characters"
					/>
				{/snippet}
			</Field>
			<RadioCards
				legend={t('study.cap.set')}
				bind:value={setNo}
				columns={3}
				options={['1', '2', '3'].map((v) => ({ value: v as '1' | '2' | '3', label: v }))}
			/>
			<RadioCards
				legend={t('study.cap.mode')}
				hint={t('study.cap.modeHint')}
				bind:value={mode}
				options={[
					{ value: 'self', label: t('study.cap.modeSelf') },
					{ value: 'assisted', label: t('study.cap.modeAssisted') }
				]}
			/>
			<RadioCards
				legend={t('study.cap.lighting')}
				bind:value={lighting}
				columns={3}
				options={[
					{ value: 'window', label: t('study.cap.light.window') },
					{ value: 'lamp', label: t('study.cap.light.lamp') },
					{ value: 'outdoor', label: t('study.cap.light.outdoor') }
				]}
			/>
			<Field label={t('study.cap.distance')} hint={t('study.cap.distanceHint')} error={distErr}>
				{#snippet children({ id, describedby, invalid })}
					<NumberInput {id} {describedby} {invalid} bind:value={distance} decimals={1} unit="m" />
				{/snippet}
			</Field>
			<RadioCards
				legend={t('study.cap.fit')}
				bind:value={fit}
				options={[
					{ value: 'fitted', label: t('start.fit.fitted') },
					{ value: 'loose', label: t('start.fit.loose') }
				]}
			/>
			<Field label={t('study.cap.stature')} hint={t('start.height.hint')} error={statureErr}>
				{#snippet children({ id, describedby, invalid })}
					<NumberInput {id} {describedby} {invalid} bind:value={stature} unit={t('unit.cm')} />
				{/snippet}
			</Field>
			<Field label={t('study.cap.phone')} hint={t('study.cap.phoneHint')}>
				{#snippet children({ id, describedby })}
					{#if isIphone}
						<Select
							{id}
							{describedby}
							bind:value={phone}
							options={IPHONES.map((m) => ({ value: m, label: m }))}
						/>
					{:else}
						<input {id} class="vt-input" bind:value={phone} aria-describedby={describedby} />
					{/if}
				{/snippet}
			</Field>
			<Field label={t('study.cap.lux')} hint={t('study.cap.luxHint')} optional>
				{#snippet children({ id, describedby })}
					<NumberInput {id} {describedby} bind:value={lux} unit="lx" />
				{/snippet}
			</Field>
			<Checkbox bind:checked={paper}
				>{t('study.cap.paper', {
					code: (participant?.participant_code ?? code.toUpperCase()) || 'P___'
				})}</Checkbox
			>
			{#if submitted && !paper}<p class="err" role="alert">{t('validate.required')}</p>{/if}
		</form>
	{/if}

	{#snippet actions()}
		<Button type="submit" form="study-start" size="lg" full>{t('study.cap.start')}</Button>
	{/snippet}
</Page>

<style>
	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--vt-s-8);
		padding: calc(var(--vt-s-12) + var(--vt-safe-top)) var(--vt-s-16) var(--vt-s-12);
		border-bottom: 1px solid var(--vt-line);
		max-width: 40rem;
		margin: 0 auto;
	}
	.top h1 {
		margin: 0;
		font-size: var(--vt-fs-22);
	}
	.code {
		max-width: 10rem;
		text-transform: uppercase;
	}
	.err {
		color: var(--vt-fail);
		font-weight: 600;
	}
</style>
