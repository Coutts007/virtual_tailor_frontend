<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n/t.svelte';
	import { computeProfile } from '$lib/measure';
	import { capture, draft, loadDraft } from '$lib/client/flow.svelte';
	import { exitFullscreen } from '$lib/capture/wakelock';
	import ClientHeader from '$lib/client/ClientHeader.svelte';
	import Page from '$lib/client/Page.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Icon from '$lib/ui/Icon.svelte';

	/**
	 * Working out your measurements (9.9, NFR-01 ≤ 20 s). Runs the measurement
	 * module on the in-memory views; on failure, asks for a retake of that view.
	 */
	let step = $state(0);
	let elapsed = $state(0);
	let failedView = $state<'front' | 'side' | null>(null);

	onMount(() => {
		const t0 = performance.now();
		const timer = setInterval(() => (elapsed = Math.round((performance.now() - t0) / 1000)), 500);
		void run(t0).finally(() => clearInterval(timer));
		return () => clearInterval(timer);
	});

	const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

	async function run(t0: number) {
		await loadDraft();
		await exitFullscreen();
		if (!capture.front || !capture.side) return goto(resolve('/'));
		step = 1;
		await pause(400);
		step = 2;
		await pause(400);
		let attempt = 0;
		for (;;) {
			try {
				capture.result = computeProfile({
					front: capture.front.data,
					side: capture.side.data,
					height_mm: (draft.height_cm ?? 0) * 10,
					sex: draft.sex ?? 'unspecified',
					clothing_fit: draft.fit,
					level_unchecked: draft.level_unchecked
				});
				break;
			} catch {
				// Re-run once from the stored burst; then ask for a retake (9.9).
				if (++attempt >= 2) {
					failedView = 'front';
					return;
				}
			}
		}
		step = 3;
		await pause(300);
		const r = capture.result!;
		if (r.failed_views.length) {
			failedView = r.failed_views[0]!;
			return;
		}
		// From the second shutter (start of the last burst) to the review screen (NFR-01).
		capture.processing_ms = capture.burst_done_at
			? Date.now() - capture.burst_done_at
			: Math.round(performance.now() - t0);
		capture.retaking = null;
		await goto(resolve('/review'), { replaceState: true });
	}

	async function retake() {
		if (!failedView) return;
		capture.retaking = failedView;
		capture.retake_count++;
		await goto(failedView === 'front' ? resolve('/capture/front') : resolve('/capture/side'));
	}

	const STEPS = ['processing.step1', 'processing.step2', 'processing.step3'] as const;
</script>

<svelte:head><title>{t('processing.title')}</title></svelte:head>

<ClientHeader title={t('steps.review')} step="review" />

<Page>
	{#if failedView}
		<div role="alert" class="fail">
			<Icon name="alert" size={40} />
			<h2>{t('processing.failed', { view: t(`view.${failedView}`) })}</h2>
			<Button size="lg" onclick={retake}>{t('processing.retry')}</Button>
		</div>
	{:else}
		<h2 class="title" aria-live="polite">{t('processing.title')}</h2>
		<ol class="steps">
			{#each STEPS as k, i (k)}
				<li class:done={step > i + 1} class:now={step === i + 1}>
					<span class="dot"
						><Icon name={step > i + 1 ? 'check' : 'circle'} size={20} stroke={3} /></span
					>
					{t(k)}
				</li>
			{/each}
		</ol>
		<p class="elapsed vt-num vt-muted">{t('processing.elapsed', { s: elapsed })}</p>
		<p class="note">{t('processing.note')}</p>
	{/if}
</Page>

<style>
	.title {
		font-size: var(--vt-fs-22);
	}
	.steps {
		list-style: none;
		padding: 0;
		display: grid;
		gap: var(--vt-s-12);
		margin: var(--vt-s-24) 0;
	}
	.steps li {
		display: flex;
		gap: var(--vt-s-12);
		align-items: center;
		font-size: var(--vt-fs-18);
		color: var(--vt-ink-muted);
	}
	.steps li.now {
		color: var(--vt-ink);
		font-weight: 700;
	}
	.steps li.done {
		color: var(--vt-pass);
	}
	.now .dot {
		animation: pulse 1s ease-in-out infinite;
	}
	@keyframes pulse {
		50% {
			opacity: 0.3;
		}
	}
	.fail {
		display: grid;
		justify-items: center;
		gap: var(--vt-s-12);
		text-align: center;
		color: var(--vt-fail);
	}
	.fail h2 {
		color: var(--vt-ink);
	}
</style>
