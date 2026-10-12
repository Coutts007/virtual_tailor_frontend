<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { api } from '$lib/api';
	import { isApiError } from '$lib/api/errors';
	import { t } from '$lib/i18n/t.svelte';
	import {
		normaliseCode,
		suggestFromFeet,
		validateClientCode,
		validateHeightCm
	} from '$lib/domain/validate';
	import { network } from '$lib/device/network.svelte';
	import { draft, loadDraft, saveDetails } from '$lib/client/flow.svelte';
	import ClientHeader from '$lib/client/ClientHeader.svelte';
	import Page from '$lib/client/Page.svelte';
	import Banner from '$lib/ui/Banner.svelte';
	import Button from '$lib/ui/Button.svelte';
	import CodeInput from '$lib/ui/CodeInput.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Icon from '$lib/ui/Icon.svelte';
	import NumberInput from '$lib/ui/NumberInput.svelte';
	import RadioCards from '$lib/ui/RadioCards.svelte';

	/** Your details (9.2, FR-02, Table 5.2). Never asks for a name, phone or email. */
	let touched = $state({ code: false, height: false, sex: false });
	let codeState = $state<'idle' | 'checking' | 'ok' | 'notFound' | 'offline'>('idle');
	let submitted = $state(false);

	const codeErr = $derived(
		(touched.code || submitted) &&
			(validateClientCode(draft.client_code) || codeState === 'notFound')
			? t('validate.code')
			: null
	);
	const feet = $derived(draft.height_cm != null ? suggestFromFeet(draft.height_cm) : null);
	// A feet suggestion replaces the range error, so its button does not move under the finger.
	const heightErr = $derived(
		!feet && (touched.height || submitted) && validateHeightCm(draft.height_cm)
			? t('validate.height')
			: null
	);
	const sexErr = $derived(submitted && !draft.sex ? t('validate.required') : null);

	onMount(async () => {
		await loadDraft();
		const q = normaliseCode(page.url.searchParams.get('code') ?? '');
		if (!validateClientCode(q)) {
			draft.client_code = q;
			void checkCode();
		} else if (draft.client_code) void checkCode();
	});

	async function checkCode() {
		touched.code = true;
		if (validateClientCode(draft.client_code)) return;
		if (!network.online) {
			// Decision 2: accept a valid format offline, verify at first sync.
			codeState = 'offline';
			draft.code_verified = false;
			return;
		}
		codeState = 'checking';
		try {
			const r = await api().checkClientCode(draft.client_code);
			codeState = 'ok';
			draft.code_verified = true;
			draft.tailor_name = r.tailor_business_name;
			if (r.height_mm && (draft.height_cm == null || draft.height_from_tailor)) {
				draft.height_cm = Math.round(r.height_mm / 10);
				draft.height_from_tailor = true;
			}
		} catch (e) {
			if (isApiError(e, 'code_not_found')) {
				codeState = 'notFound';
				draft.code_verified = false;
				draft.tailor_name = null;
			} else {
				codeState = 'offline';
				draft.code_verified = false;
			}
		}
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		submitted = true;
		if (
			validateClientCode(draft.client_code) ||
			codeState === 'notFound' ||
			validateHeightCm(draft.height_cm) ||
			!draft.sex
		) {
			const first = document.querySelector<HTMLElement>(
				'[aria-invalid="true"], fieldset input[type=radio]'
			);
			first?.focus();
			return;
		}
		await saveDetails();
		await goto(resolve('/consent'));
	}
</script>

<svelte:head><title>{t('start.title')} · {t('app.name')}</title></svelte:head>

<ClientHeader title={t('start.title')} back="/" step="details" />

<Page>
	<form id="details" novalidate onsubmit={submit}>
		<Field label={t('code.label')} hint={t('code.hint')} error={codeErr} id="code">
			{#snippet children({ id, describedby, invalid })}
				<CodeInput
					{id}
					{describedby}
					{invalid}
					bind:value={draft.client_code}
					onblur={checkCode}
					oncomplete={() => {
						codeState = 'idle';
						void checkCode();
					}}
				/>
			{/snippet}
		</Field>
		<div class="code-status" aria-live="polite">
			{#if codeState === 'checking'}
				<p class="vt-muted">{t('start.code.checking')}</p>
			{:else if codeState === 'ok' && draft.tailor_name}
				<p class="ok">
					<Icon name="check" size={20} stroke={3} />
					{t('start.code.from', { name: draft.tailor_name })}
				</p>
			{:else if codeState === 'offline' && !validateClientCode(draft.client_code)}
				<p class="vt-muted">{t('start.code.offline')}</p>
			{/if}
		</div>

		<Field
			label={t('start.height.label')}
			hint={t('start.height.hint')}
			error={heightErr}
			id="height"
		>
			{#snippet children({ id, describedby, invalid })}
				<NumberInput
					{id}
					{describedby}
					{invalid}
					bind:value={draft.height_cm}
					unit={t('unit.cm')}
					decimals={1}
					onblur={() => (touched.height = true)}
					oninput={() => (draft.height_from_tailor = false)}
				/>
			{/snippet}
		</Field>
		{#if draft.height_from_tailor}<p class="tag">
				<Icon name="ruler" size={18} />
				{t('start.height.byTailor')}
			</p>{/if}
		{#if feet}
			<Banner tone="info" live="polite">
				<p>{t('start.height.feet', { ft: feet.feet, inch: feet.inches, cm: feet.cm })}</p>
				<Button variant="secondary" onclick={() => (draft.height_cm = feet.cm)}
					>{t('start.height.useCm', { cm: feet.cm })}</Button
				>
			</Banner>
		{/if}

		<RadioCards
			legend={t('start.sex.legend')}
			hint={t('start.sex.hint')}
			bind:value={draft.sex}
			name="sex"
			options={[
				{ value: 'female', label: t('start.sex.female') },
				{ value: 'male', label: t('start.sex.male') },
				{ value: 'unspecified', label: t('start.sex.unspecified') }
			]}
		/>
		{#if sexErr}<p class="err" role="alert">{sexErr}</p>{/if}

		<RadioCards
			legend={t('start.fit.legend')}
			bind:value={draft.fit}
			name="fit"
			options={[
				{ value: 'fitted', label: t('start.fit.fitted'), description: t('start.fit.fittedDesc') },
				{ value: 'loose', label: t('start.fit.loose'), description: t('start.fit.looseDesc') }
			]}
		/>
		{#if draft.fit === 'loose'}
			<Banner tone="warning">{t('start.fit.looseWarn')}</Banner>
		{/if}
	</form>

	{#snippet actions()}
		<Button type="submit" form="details" size="lg" full>{t('common.continue')}</Button>
		<p class="next vt-small vt-muted">{t('start.next')}</p>
	{/snippet}
</Page>

<style>
	.code-status {
		min-height: 1.5rem;
		margin: calc(-1 * var(--vt-s-8)) 0 var(--vt-s-16);
	}
	.code-status p {
		margin: 0;
	}
	.ok {
		display: flex;
		gap: var(--vt-s-4);
		align-items: center;
		color: var(--vt-pass);
		font-weight: 700;
	}
	.tag {
		display: inline-flex;
		gap: var(--vt-s-4);
		align-items: center;
		margin: calc(-1 * var(--vt-s-8)) 0 var(--vt-s-16);
		padding: 2px var(--vt-s-8);
		border-radius: 999px;
		background: var(--vt-thread-tint);
		font-size: var(--vt-fs-14);
		font-weight: 600;
	}
	.err {
		color: var(--vt-fail);
		font-weight: 600;
		margin-top: calc(-1 * var(--vt-s-8));
	}
	.next {
		text-align: center;
		margin: 0;
	}
	form :global(.banner) {
		border-radius: var(--vt-radius);
		margin-bottom: var(--vt-s-16);
		display: grid;
		gap: var(--vt-s-8);
	}
</style>
