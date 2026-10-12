<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { locale, t } from '$lib/i18n/t.svelte';
	import { CONSENT, CONSENT_VERSION } from '$lib/i18n/consent';
	import { draft, loadDraft, recordConsent } from '$lib/client/flow.svelte';
	import { validateClientCode } from '$lib/domain/validate';
	import ClientHeader from '$lib/client/ClientHeader.svelte';
	import Page from '$lib/client/Page.svelte';
	import BottomSheet from '$lib/ui/BottomSheet.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import ConsentText from '$lib/client/ConsentText.svelte';

	/** Consent before the camera opens (9.3, FR-03, privacy invariant 6). */
	let boxes = $state([false, false, false]);
	let full = $state(false);
	const all = $derived(boxes.every(Boolean));
	const doc = $derived(CONSENT[locale.lang]);

	onMount(async () => {
		await loadDraft();
		if (validateClientCode(draft.client_code)) await goto(resolve('/start'));
	});

	async function accept() {
		if (!all) return;
		await recordConsent({
			consent_version: CONSENT_VERSION,
			language: locale.lang,
			scope: ['measure', 'measurements_only', 'retention'],
			given_at: new Date().toISOString()
		});
		// The phone check runs once per device and again after browser updates.
		const pre = draft.preflight;
		const fresh =
			pre &&
			pre.verdict !== 'cannot' &&
			pre.device.browser ===
				(await import('$lib/device/deviceInfo')).parseUserAgent(navigator.userAgent).browser;
		await goto(
			!fresh ? resolve('/check') : draft.print_check_ok ? resolve('/setup') : resolve('/sheet')
		);
	}
</script>

<svelte:head><title>{t('consent.title')} · {t('app.name')}</title></svelte:head>

<ClientHeader title={t('consent.title')} back="/start" step="consent" />

<Page>
	<!-- A scrollable region must be keyboard-focusable (WCAG 2.1.1). -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div class="box" tabindex="0" role="region" aria-label={doc.title}>
		{#each doc.summary as p, i (i)}<p>{p}</p>{/each}
	</div>
	<Button variant="text" onclick={() => (full = true)}>{t('consent.readFull')}</Button>

	<div class="checks">
		<Checkbox bind:checked={boxes[0]}>{t('consent.box1')}</Checkbox>
		<Checkbox bind:checked={boxes[1]}>{t('consent.box2')}</Checkbox>
		<Checkbox bind:checked={boxes[2]}>{t('consent.box3')}</Checkbox>
	</div>
	<p class="version vt-small vt-muted">
		{t('consent.version', {
			version: CONSENT_VERSION,
			language: t(locale.lang === 'sw' ? 'lang.sw' : 'lang.en')
		})}
	</p>

	<BottomSheet bind:open={full} title={doc.title}>
		<ConsentText {doc} />
	</BottomSheet>

	{#snippet actions()}
		<Button
			size="lg"
			full
			disabled={!all}
			onclick={accept}
			aria-describedby={all ? undefined : 'consent-helper'}>{t('consent.openCamera')}</Button
		>
		{#if !all}<p id="consent-helper" class="helper vt-small">{t('consent.helper')}</p>{/if}
		<Button variant="text" href={resolve('/declined')}>{t('consent.decline')}</Button>
	{/snippet}
</Page>

<style>
	.box {
		max-height: 300px;
		overflow-y: auto;
		padding: var(--vt-s-16);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius);
		background: var(--vt-paper);
	}
	.checks {
		display: grid;
		gap: var(--vt-s-8);
		margin-top: var(--vt-s-16);
	}
	.version {
		margin-top: var(--vt-s-12);
	}
	.helper {
		text-align: center;
		margin: 0;
		color: var(--vt-ink-muted);
	}
</style>
