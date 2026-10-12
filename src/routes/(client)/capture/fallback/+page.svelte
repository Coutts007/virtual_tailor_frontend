<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n/t.svelte';
	import { analysePhoto, disposeFallback } from '$lib/vision/fallback';
	import { capture, draft, loadDraft, newSession } from '$lib/client/flow.svelte';
	import ClientHeader from '$lib/client/ClientHeader.svelte';
	import Page from '$lib/client/Page.svelte';
	import Banner from '$lib/ui/Banner.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Icon from '$lib/ui/Icon.svelte';

	/**
	 * Camera-app fallback (10.1.7), assisted mode only: the helper takes one front
	 * and one side photo with the phone's camera app; checks run afterwards.
	 */
	let shots = $state<Record<'front' | 'side', 'idle' | 'busy' | 'ok' | 'bad'>>({
		front: 'idle',
		side: 'idle'
	});
	let failed = $state<Record<'front' | 'side', string[]>>({ front: [], side: [] });

	onMount(async () => {
		await loadDraft();
		if (!draft.consent) return goto(resolve('/consent'));
		if (draft.capture_mode !== 'assisted') return goto(resolve('/setup'));
		newSession();
		capture.capture_fallback = true;
		draft.level_unchecked = true;
	});
	onDestroy(disposeFallback);

	async function pick(view: 'front' | 'side', e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		shots[view] = 'busy';
		try {
			const r = await analysePhoto(file, view);
			failed[view] = r.failed;
			capture[view] = r.capture;
			shots[view] = r.capture ? 'ok' : 'bad';
			if (r.capture) capture.burst_done_at = Date.now();
		} catch {
			shots[view] = 'bad';
		}
	}

	async function measure() {
		capture.still_source = 'file';
		await goto(resolve('/processing'));
	}
</script>

<svelte:head><title>{t('fallback.title')} · {t('app.name')}</title></svelte:head>

<ClientHeader title={t('fallback.title')} back="/setup" step="front" />

<Page>
	<Banner tone="info">{t('fallback.body')}</Banner>
	{#each ['front', 'side'] as const as v (v)}
		<section class="shot">
			<h2>{t(v === 'front' ? 'fallback.front' : 'fallback.side')}</h2>
			<label class="file">
				<Icon name="phone" />
				<span>{shots[v] === 'busy' ? t('common.loading') : t('fallback.take')}</span>
				<input
					type="file"
					accept="image/*"
					capture="environment"
					onchange={(e) => pick(v, e)}
					disabled={shots[v] === 'busy'}
				/>
			</label>
			{#if shots[v] === 'ok'}<p class="ok">
					<Icon name="check" size={20} stroke={3} />
					{t('fallback.taken')}
				</p>{/if}
			{#if shots[v] === 'bad'}
				<ul class="bad">
					{#each failed[v] as f (f)}<li>
							{t(`check.${f === 'sharpness' ? 'light' : f}` as 'check.light')}
						</li>{/each}
				</ul>
			{/if}
		</section>
	{/each}

	{#snippet actions()}
		<Button size="lg" full disabled={shots.front !== 'ok' || shots.side !== 'ok'} onclick={measure}
			>{t('fallback.measure')}</Button
		>
	{/snippet}
</Page>

<style>
	.shot {
		margin-top: var(--vt-s-16);
		padding: var(--vt-s-16);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius);
		background: var(--vt-paper);
		display: grid;
		gap: var(--vt-s-8);
	}
	.shot h2 {
		margin: 0;
		font-size: var(--vt-fs-18);
	}
	.file {
		display: inline-flex;
		gap: var(--vt-s-8);
		align-items: center;
		justify-content: center;
		min-height: var(--vt-target);
		padding: 0 var(--vt-s-24);
		border-radius: var(--vt-radius);
		background: var(--vt-thread);
		color: var(--vt-thread-ink);
		font-weight: 700;
		cursor: pointer;
		position: relative;
	}
	.file:has(input:focus-visible) {
		outline: 3px solid var(--vt-focus);
		outline-offset: 2px;
	}
	.file input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}
	.ok {
		display: flex;
		gap: var(--vt-s-4);
		align-items: center;
		color: var(--vt-pass);
		font-weight: 700;
		margin: 0;
	}
	.bad {
		color: var(--vt-fail);
		margin: 0;
	}
	:global(.page > .banner) {
		border-radius: var(--vt-radius);
	}
</style>
