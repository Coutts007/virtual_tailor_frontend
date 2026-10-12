<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { locale, t } from '$lib/i18n/t.svelte';
	import { setSetting } from '$lib/db/settings';
	import { CAPTURE_CONFIG } from '$lib/capture/config';
	import {
		orientation,
		needsMotionPermission,
		requestMotionPermission,
		watchOrientation,
		setOrientation
	} from '$lib/capture/orientation.svelte';
	import { sounds, speak, unlockAudio, setMuted } from '$lib/capture/audio';
	import { enterFullscreen } from '$lib/capture/wakelock';
	import { downloadModels, modelsCached, MODEL_DOWNLOAD_MB } from '$lib/vision/assets';
	import { isSimulated } from '$lib/vision';
	import { probeCamera, type CameraProbe } from '$lib/vision/camera';
	import { draft, loadDraft, newSession, capture } from '$lib/client/flow.svelte';
	import ClientHeader from '$lib/client/ClientHeader.svelte';
	import Page from '$lib/client/Page.svelte';
	import ProtocolArt from '$lib/client/ProtocolArt.svelte';
	import Banner from '$lib/ui/Banner.svelte';
	import Button from '$lib/ui/Button.svelte';
	import LevelBubble from '$lib/ui/LevelBubble.svelte';
	import RadioCards from '$lib/ui/RadioCards.svelte';

	/**
	 * Set up your phone (9.6): download, who takes the photos, camera priming,
	 * iOS motion permission, place the phone with a live level. Each a card.
	 */
	const simulated = isSimulated();
	let dl = $state<{
		state: 'idle' | 'busy' | 'done' | 'failed' | 'later';
		loaded: number;
		total: number;
	}>({ state: 'idle', loaded: 0, total: 0 });
	let cam = $state<'idle' | 'busy' | 'ok' | 'denied' | 'unavailable'>('idle');
	let probe = $state<CameraProbe | null>(null);
	let motion = $state<'idle' | 'ok' | 'denied'>(needsMotionPermission() ? 'idle' : 'ok');
	let levelSince = $state<number | null>(null);
	let levelHeld = $state(false);
	let browserKind = $state<'chrome' | 'safari' | 'samsung'>('chrome');

	onMount(() => {
		void loadDraft().then(async () => {
			if (!draft.consent) return goto(resolve('/consent'));
			browserKind =
				draft.preflight?.device.browser_name === 'safari'
					? 'safari'
					: draft.preflight?.device.browser_name === 'samsung'
						? 'samsung'
						: 'chrome';
			if (simulated || (await modelsCached())) dl.state = 'done';
			if (simulated) {
				cam = 'ok';
				motion = 'ok';
				setOrientation(90.4, 0.6);
			}
		});
		const stop = watchOrientation();
		const timer = setInterval(checkLevel, 100);
		return () => (stop(), clearInterval(timer));
	});

	function checkLevel() {
		const { beta, gamma } = orientation;
		const L = CAPTURE_CONFIG.level;
		const ok =
			beta != null &&
			gamma != null &&
			beta >= L.betaMin &&
			beta <= L.betaMax &&
			Math.abs(gamma) <= L.gammaMax;
		if (!ok) {
			levelSince = null;
			return;
		}
		levelSince ??= Date.now();
		if (!levelHeld && Date.now() - levelSince >= CAPTURE_CONFIG.timing.levelHoldMs) {
			levelHeld = true;
			sounds.allGreen();
		}
	}

	const levelUnavailable = $derived(motion === 'denied' || orientation.available === false);

	async function download() {
		await unlockAudio();
		dl.state = 'busy';
		const ok = await downloadModels((loaded, total) => {
			dl.loaded = loaded;
			dl.total = total;
		});
		dl.state = ok ? 'done' : 'failed';
	}

	async function allowCamera() {
		await unlockAudio();
		cam = 'busy';
		try {
			probe = await probeCamera();
			cam = 'ok';
			// Complete the camera rows of the phone check (9.4).
			if (draft.preflight) {
				const { resolutionStatus, verdict } = await import('$lib/device/preflight');
				const rows = draft.preflight.rows.map((r) =>
					r.id === 'camera'
						? { ...r, status: probe!.hasEnvironment ? ('pass' as const) : ('fail' as const) }
						: r.id === 'resolution'
							? { ...r, status: resolutionStatus(probe!.longEdge) }
							: r
				);
				draft.preflight = {
					...draft.preflight,
					rows,
					verdict: verdict(rows),
					stream_max: probe.longEdge
				};
				await setSetting('preflight', $state.snapshot(draft.preflight));
				if (draft.preflight.verdict === 'cannot') await goto(resolve('/check'));
			}
		} catch (e) {
			cam = (e as Error).name === 'NotAllowedError' ? 'denied' : 'unavailable';
		}
	}

	async function allowMotion() {
		const ok = await requestMotionPermission();
		motion = ok ? 'ok' : 'denied';
	}

	async function start() {
		await unlockAudio();
		setMuted(draft.audio_muted);
		await setSetting('capture_mode', draft.capture_mode);
		draft.level_unchecked = levelUnavailable;
		await enterFullscreen();
		newSession();
		capture.capture_fallback = false;
		speak(t('setup.say.walk'), locale.lang, { key: 'walk', force: true });
		await goto(resolve('/capture/front'));
	}

	const ready = $derived(dl.state === 'done' && cam === 'ok' && (levelHeld || levelUnavailable));
	const pct = $derived(dl.total ? Math.round((dl.loaded / dl.total) * 100) : 0);
	const mb = (b: number) => (b / 1e6).toFixed(1);
</script>

<svelte:head><title>{t('setup.title')} · {t('app.name')}</title></svelte:head>

<ClientHeader title={t('setup.title')} back="/sheet" step="setup" />

<Page>
	<ol class="cards">
		<li class="card" class:done={dl.state === 'done'}>
			<h2>{t('setup.dl.title')}</h2>
			{#if simulated}
				<p>{t('setup.dl.simulated')}</p>
			{:else if dl.state === 'done'}
				<p class="ok">{t('setup.dl.done')}</p>
			{:else}
				<p>{t('setup.dl.body', { mb: MODEL_DOWNLOAD_MB })}</p>
				{#if dl.state === 'busy'}
					<progress max="100" value={pct} aria-label={t('setup.dl.title')}></progress>
					<p class="vt-small vt-num" aria-live="polite">
						{t('setup.dl.progress', { mb: mb(dl.loaded), total: mb(dl.total), pct })}
					</p>
				{:else}
					<div class="row">
						<Button onclick={download}>{t('setup.dl.now')}</Button>
						<Button variant="text" onclick={() => (dl.state = 'later')}
							>{t('setup.dl.later')}</Button
						>
					</div>
				{/if}
				{#if dl.state === 'failed'}<Banner tone="danger">{t('setup.dl.failed')}</Banner>{/if}
				{#if dl.state === 'later'}<p class="vt-small vt-muted">{t('setup.dl.laterNote')}</p>{/if}
			{/if}
		</li>

		<li class="card">
			<RadioCards
				legend={t('setup.who.legend')}
				bind:value={draft.capture_mode}
				name="mode"
				options={[
					{ value: 'self', label: t('setup.who.self'), description: t('setup.who.selfDesc') },
					{
						value: 'assisted',
						label: t('setup.who.assisted'),
						description: t('setup.who.assistedDesc')
					}
				]}
			/>
		</li>

		<li class="card" class:done={cam === 'ok'}>
			<h2>{t('setup.cam.title')}</h2>
			<p>{t('setup.cam.body')}</p>
			{#if cam === 'ok'}
				<p class="ok">{t('setup.cam.allowed')}</p>
			{:else}
				<Button loading={cam === 'busy'} onclick={allowCamera}>{t('setup.cam.allow')}</Button>
			{/if}
			{#if cam === 'denied'}
				<Banner tone="danger">
					<p>{t('setup.cam.denied')}</p>
					<p>{t(`setup.cam.recover.${browserKind}`)}</p>
				</Banner>
				<Button variant="secondary" onclick={allowCamera}>{t('common.retry')}</Button>
			{:else if cam === 'unavailable'}
				<Banner tone="danger">{t('setup.cam.unavailable')}</Banner>
				{#if draft.capture_mode === 'assisted'}
					<Button variant="secondary" href={resolve('/capture/fallback')}
						>{t('setup.cam.fallback')}</Button
					>
				{/if}
			{/if}
		</li>

		{#if needsMotionPermission() && !simulated}
			<li class="card" class:done={motion === 'ok'}>
				<h2>{t('setup.motion.title')}</h2>
				<p>{t('setup.motion.body')}</p>
				{#if motion === 'idle'}<Button onclick={allowMotion}>{t('setup.motion.allow')}</Button>{/if}
				{#if motion === 'denied'}<Banner tone="warning">{t('setup.motion.denied')}</Banner>{/if}
			</li>
		{/if}

		<li class="card place" class:done={levelHeld}>
			<h2>{t('setup.place.title')}</h2>
			<div class="place-row">
				<ProtocolArt art="chair" size={88} />
				<p>{t('setup.place.body')}</p>
			</div>
			{#if levelUnavailable}
				<Banner tone="warning">{t('setup.place.noLevel')}</Banner>
			{:else}
				<p>{t('setup.place.level')}</p>
				<LevelBubble beta={orientation.beta} gamma={orientation.gamma} />
			{/if}
		</li>
	</ol>

	{#snippet actions()}
		<Button size="lg" full disabled={!ready} onclick={start}>{t('setup.start')}</Button>
	{/snippet}
</Page>

<style>
	.cards {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--vt-s-16);
		counter-reset: step;
	}
	.card {
		display: grid;
		gap: var(--vt-s-8);
		justify-items: start;
		padding: var(--vt-s-16);
		border: 1px solid var(--vt-line);
		border-left: 4px solid var(--vt-line-strong);
		border-radius: var(--vt-radius);
		background: var(--vt-paper);
	}
	.card.done {
		border-left-color: var(--vt-pass);
	}
	.card h2 {
		font-size: var(--vt-fs-18);
		margin: 0;
	}
	.card p {
		margin: 0;
	}
	.card :global(.banner) {
		border-radius: var(--vt-radius);
		width: 100%;
	}
	.card :global(.rc) {
		margin: 0;
		width: 100%;
	}
	.ok {
		color: var(--vt-pass);
		font-weight: 700;
	}
	.row {
		display: flex;
		gap: var(--vt-s-8);
		flex-wrap: wrap;
	}
	progress {
		width: 100%;
		height: 12px;
		accent-color: var(--vt-thread);
	}
	.place {
		justify-items: stretch;
	}
	.place-row {
		display: flex;
		gap: var(--vt-s-12);
		align-items: center;
	}
	.place :global(.level) {
		justify-self: center;
	}
</style>
