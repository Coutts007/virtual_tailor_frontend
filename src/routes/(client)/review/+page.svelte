<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, preloadCode } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { INTL_LOCALE, locale, t } from '$lib/i18n/t.svelte';
	import { formatLength } from '$lib/domain/units';
	import { saveProfile } from '$lib/db/profiles';
	import { configHash } from '$lib/measure';
	import {
		capture,
		draft,
		buildProfile,
		releaseCaptures,
		resetCaptureFlow
	} from '$lib/client/flow.svelte';
	import { siteLabelKey, worstSite } from '$lib/client/present';
	import { syncNow } from '$lib/client/syncState.svelte';
	import { captureConfigHash } from '$lib/capture/config';
	import ClientHeader from '$lib/client/ClientHeader.svelte';
	import Page from '$lib/client/Page.svelte';
	import ResultsView from '$lib/client/ResultsView.svelte';
	import Banner from '$lib/ui/Banner.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import FlagBadge from '$lib/ui/FlagBadge.svelte';

	/** Your measurements (9.10, FR-12). Read-only; retake one view; save or discard. */
	let discardOpen = $state(false);
	let saving = $state(false);
	const r = $derived(capture.result);

	onMount(() => {
		if (!capture.result) void goto(resolve('/me'), { replaceState: true });
		// Load the next screen's code now so saving works offline (NFR-03).
		void preloadCode(resolve('/saved'));
	});

	const fmt = (mm: number | null) => formatLength(mm, 'cm', INTL_LOCALE[locale.lang]);
	const stature = $derived(r?.measurements.find((m) => m.site_code === 'stature'));
	const worst = $derived(
		r
			? worstSite(r.measurements, {
					front: capture.front?.marker_confidence ?? 1,
					side: capture.side?.marker_confidence ?? 1
				})
			: null
	);
	const highlight = $derived(r?.retake_view ?? worst?.view ?? null);

	async function retake(view: 'front' | 'side') {
		capture.retaking = view;
		capture.retake_count++;
		releaseCaptures(view);
		await goto(view === 'front' ? resolve('/capture/front') : resolve('/capture/side'));
	}

	async function save() {
		if (!r || saving) return;
		saving = true;
		const profile = buildProfile({
			config_hash: `${configHash()}.${captureConfigHash()}`
		});
		// Write before showing "Saved" (NFR-08).
		const saved = await saveProfile(profile);
		resetCaptureFlow();
		void syncNow();
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- query string on a resolved path
		await goto(`${resolve('/saved')}?id=${saved.profile_id}`, { replaceState: true });
	}

	async function discard() {
		resetCaptureFlow();
		discardOpen = false;
		await goto(resolve('/'), { replaceState: true });
	}
</script>

<svelte:head><title>{t('review.title')} · {t('app.name')}</title></svelte:head>

<ClientHeader title={t('review.title')} step="review" />

{#if r}
	<Page>
		{#if r.retake_view && r.scale_disagreement_pct > 4}
			<Banner tone="warning">{t('review.scaleBanner', { view: t(`view.${r.retake_view}`) })}</Banner
			>
		{/if}

		<ResultsView
			measurements={r.measurements}
			sex={draft.sex}
			session={{ scale_disagreement_pct: r.scale_disagreement_pct }}
		/>

		{#if stature}
			<p class="height">
				<span class="vt-num"
					>{t('review.height', {
						entered: fmt((draft.height_cm ?? 0) * 10),
						estimated: fmt(r.stature_estimated_mm)
					})}</span
				>
				<FlagBadge flag={stature.confidence_flag} size="sm" />
			</p>
		{/if}

		<section class="retake" aria-label={t('review.retakeFront')}>
			{#each ['front', 'side'] as const as v (v)}
				<div class="rt" class:hl={highlight === v}>
					<Button
						variant={highlight === v ? 'primary' : 'secondary'}
						full
						icon="chevron-left"
						onclick={() => retake(v)}
					>
						{t(v === 'front' ? 'review.retakeFront' : 'review.retakeSide')}
					</Button>
					{#if highlight === v && worst && !r.retake_view}
						<p class="why vt-small">
							{t('review.retakeWhy', {
								site: t(siteLabelKey(worst.site, draft.sex)),
								view: t(`view.${v}`)
							})}
						</p>
					{/if}
				</div>
			{/each}
		</section>

		<p class="vt-small vt-muted">{t('review.readonly')}</p>

		{#snippet actions()}
			<Button size="lg" full loading={saving} onclick={save}>{t('review.save')}</Button>
			<Button variant="text" onclick={() => (discardOpen = true)}>{t('review.discard')}</Button>
			<p class="foot vt-small vt-muted">{t('review.footer')}</p>
		{/snippet}
	</Page>
{/if}

<Dialog bind:open={discardOpen} title={t('review.discardTitle')}>
	<p>{t('review.discardBody')}</p>
	{#snippet actions()}
		<Button variant="text" onclick={() => (discardOpen = false)}>{t('common.cancel')}</Button>
		<Button variant="danger" onclick={discard}>{t('common.delete')}</Button>
	{/snippet}
</Dialog>

<style>
	.height {
		display: flex;
		flex-wrap: wrap;
		gap: var(--vt-s-8);
		align-items: center;
		margin-top: var(--vt-s-24);
		padding: var(--vt-s-12);
		border-radius: var(--vt-radius);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
	}
	.retake {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--vt-s-8);
		margin: var(--vt-s-24) 0 var(--vt-s-8);
	}
	.why {
		margin: var(--vt-s-4) 0 0;
	}
	.foot {
		text-align: center;
		margin: 0;
	}
	:global(.page > .banner) {
		border-radius: var(--vt-radius);
		margin-bottom: var(--vt-s-16);
	}
</style>
