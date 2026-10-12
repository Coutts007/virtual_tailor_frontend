<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { locale, t } from '$lib/i18n/t.svelte';
	import type { MessageKey } from '$lib/i18n/en';
	import { setSetting } from '$lib/db/settings';
	import { CAPTURE_CONFIG } from '$lib/capture/config';
	import {
		Debouncer,
		PRIORITY,
		allPass,
		evaluate,
		uiRows,
		type CheckId,
		type LiveFrame,
		type RawState
	} from '$lib/capture/checks';
	import { transition, type CaptureState } from '$lib/capture/stateMachine';
	import { orientation, watchOrientation } from '$lib/capture/orientation.svelte';
	import { sounds, speak, setMuted, unlockAudio } from '$lib/capture/audio';
	import { exitFullscreen, keepAwake } from '$lib/capture/wakelock';
	import { createEngine, visionPrefs } from '$lib/vision';
	import { BurstFailedError, type LiveAnalysis, type VisionEngine } from '$lib/vision/types';
	import { PROTOCOL } from '$lib/i18n/protocol';
	import { capture, draft, loadDraft, releaseCaptures } from '$lib/client/flow.svelte';
	import TargetOutline from '$lib/client/TargetOutline.svelte';
	import BottomSheet from '$lib/ui/BottomSheet.svelte';
	import Button from '$lib/ui/Button.svelte';
	import CheckList from '$lib/ui/CheckList.svelte';
	import Countdown from '$lib/ui/Countdown.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import Icon from '$lib/ui/Icon.svelte';
	import LangToggle from '$lib/ui/LangToggle.svelte';
	import LevelBubble from '$lib/ui/LevelBubble.svelte';

	/** Capture screen for one view (9.7, 9.8). Keyed by view so each view mounts fresh. */
	let { view }: { view: 'front' | 'side' } = $props();

	const T = CAPTURE_CONFIG.timing;
	const scale = visionPrefs().timeScale;
	const ms = (v: number) => v * scale;

	let engine: VisionEngine | null = null;
	let video: HTMLVideoElement | undefined = $state();
	let canvas: HTMLCanvasElement | undefined = $state();
	let machine = $state<CaptureState>({ name: 'idle' });
	let walkLeft = $state(0);
	let shown = $state<Record<CheckId, RawState>>(
		Object.fromEntries(PRIORITY.map((c) => [c, 'pending'])) as Record<CheckId, RawState>
	);
	let message = $state<MessageKey | null>(null);
	let banner = $state<MessageKey | null>(null);
	let stopOpen = $state(false);
	let helpOpen = $state(false);
	let muted = $state(draft.audio_muted);
	let kind = $state<'fake' | 'real'>('fake');
	let lastAnalysis: LiveAnalysis | null = null;
	let fakeOrientation: { beta: number; gamma: number } | null = $state(null);

	const debouncer = new Debouncer();
	const history: LiveFrame[] = [];
	let greenSince: number | null = null;
	let loopTimer: ReturnType<typeof setTimeout> | undefined;
	let countTimer: ReturnType<typeof setInterval> | undefined;
	let walkTimer: ReturnType<typeof setInterval> | undefined;
	let releaseWake: (() => void) | null = null;
	let stopOrientation: (() => void) | null = null;
	let destroyed = false;

	const send = (e: Parameters<typeof transition>[1]) =>
		(machine = transition(machine, e, { retaking: capture.retaking }));
	const rows = $derived(uiRows(shown));
	const green = $derived(allPass(shown));
	const fails = $derived(PRIORITY.filter((c) => shown[c] !== 'pass').length);
	/** Red: something to fix · amber: almost (one check left, or walking back) · green: all good. */
	const border = $derived(
		machine.name === 'countdown' || machine.name === 'burst' || machine.name === 'viewDone' || green
			? 'ok'
			: machine.name === 'walkAway' || fails <= 1
				? 'wait'
				: 'stop'
	);
	const level = $derived(fakeOrientation ?? { beta: orientation.beta, gamma: orientation.gamma });

	onMount(() => {
		void init();
		return () => {};
	});

	async function init() {
		await loadDraft();
		if (!draft.consent) return goto(resolve('/consent'));
		if (view === 'side' && !capture.front && capture.retaking !== 'side')
			return goto(resolve('/capture/front'));
		muted = draft.audio_muted;
		setMuted(muted);
		releaseWake = keepAwake();
		stopOrientation = watchOrientation();
		try {
			engine = await createEngine({
				height_mm: (draft.height_cm ?? 170) * 10,
				sex: draft.sex ?? 'unspecified'
			});
			kind = engine.kind;
			const info = await engine.start(video ?? null);
			capture.stream = { w: info.width, h: info.height };
			if (info.lens_note) capture.lens_note = info.lens_note;
		} catch {
			machine = { name: 'error', kind: 'camera_unavailable', from: 'permissions' };
			banner = 'capture.cameraLost';
			return;
		}
		if (destroyed) return;
		machine = { name: 'walkAway', view };
		startWalkAway();
	}

	function startWalkAway() {
		walkLeft = view === 'front' ? T.walkAwayS : T.sideTransitionS;
		if (view === 'side') speak(t('capture.turn'), locale.lang, { key: 'turn', force: true });
		walkTimer = setInterval(() => {
			walkLeft--;
			if (view === 'front' && walkLeft > 0 && walkLeft <= 3) sounds.tick();
			if (walkLeft <= 0) {
				clearInterval(walkTimer);
				send({ type: 'WALK_DONE' });
				engine?.beginView(view, performance.now());
				debouncer.reset();
				history.length = 0;
				greenSince = null;
				loop();
			}
		}, ms(1000));
	}

	async function loop() {
		if (destroyed || !engine) return;
		const now = performance.now();
		if (machine.name === 'checking' || machine.name === 'countdown') {
			const a = await engine.analyze(view, now);
			lastAnalysis = a;
			const fakeOri =
				'orientationAt' in engine
					? (
							engine as unknown as {
								orientationAt(v: string, n: number): { beta: number; gamma: number };
							}
						).orientationAt(view, now)
					: null;
			fakeOrientation = fakeOri;
			const ori =
				fakeOri ??
				(orientation.beta != null && orientation.gamma != null
					? { beta: orientation.beta, gamma: orientation.gamma }
					: null);
			const frame: LiveFrame = {
				t: now,
				orientation: ori,
				levelUnchecked: draft.level_unchecked,
				landmarks: a?.landmarks ?? null,
				maskBox: a?.maskBox ?? null,
				armMerge: a?.armMerge ?? null,
				marker: a?.marker ?? null,
				luminance: a?.luminance ?? null,
				sharpness: a?.sharpness ?? null,
				streamH: a?.streamH ?? capture.stream.h,
				stillAvailable: a?.stillAvailable ?? false
			};
			const r = evaluate(frame, view, history);
			history.push(frame);
			if (history.length > CAPTURE_CONFIG.stability.samples) history.shift();
			const prevMessage = message;
			const prevGreen = allPass(shown);
			const d = debouncer.update(r, now);
			shown = d.states;
			message = d.message?.key ?? null;
			if (message && message !== prevMessage) {
				const say = message === 'capture.msg.level' ? t('capture.say.level') : t(message);
				speak(say, locale.lang, { key: message.split('.').pop() });
			}
			const nowGreen = allPass(d.states);
			if (nowGreen && !prevGreen) sounds.tick();
			if (machine.name === 'checking') {
				greenSince = nowGreen ? (greenSince ?? now) : null;
				if (
					nowGreen &&
					greenSince != null &&
					now - greenSince >= ms(T.greenHoldMs) &&
					draft.capture_mode === 'self'
				)
					startCountdown();
			} else if (machine.name === 'countdown' && !nowGreen) {
				cancelCountdown();
			}
			if (canvas && engine.draw) engine.draw(canvas, a, view);
		}
		loopTimer = setTimeout(loop, 1000 / 6);
	}

	function startCountdown() {
		send({ type: 'ALL_GREEN' });
		sounds.allGreen();
		sounds.beep();
		speak('3', locale.lang, { force: true });
		countTimer = setInterval(() => {
			send({ type: 'TICK' });
			if (machine.name === 'countdown') {
				sounds.beep();
				speak(String(machine.n), locale.lang, { force: true });
			} else if (machine.name === 'burst') {
				clearInterval(countTimer);
				sounds.longBeep();
				void doBurst();
			}
		}, ms(1000));
	}

	function cancelCountdown() {
		clearInterval(countTimer);
		send({ type: 'CHECK_FAILED' });
		sounds.stop();
		greenSince = null;
	}

	/** Assisted mode: the helper presses the shutter once every check is green. */
	function shutter() {
		if (!green || machine.name !== 'checking') return;
		send({ type: 'ALL_GREEN' });
		send({ type: 'TICK' });
		send({ type: 'TICK' });
		send({ type: 'TICK' });
		sounds.longBeep();
		void doBurst();
	}

	async function doBurst() {
		if (!engine) return;
		// Shutter time: the capture timestamp and the start of NFR-01's timing.
		const shutterAt = Date.now();
		try {
			const result = await engine.burst(view, performance.now());
			capture[view] = result;
			capture.still_source = result.still_source;
			capture.burst_done_at = shutterAt;
			send({ type: 'BURST_OK' });
			sounds.done();
			speak(t('capture.done'), locale.lang, { force: true });
			setTimeout(next, ms(1200));
		} catch (e) {
			if (e instanceof BurstFailedError) {
				send({ type: 'BURST_BAD' });
				banner = 'capture.tryAgain';
				sounds.stop();
				speak(t('capture.tryAgain'), locale.lang, { force: true, key: 'tryAgain' });
				setTimeout(() => (banner = null), 4000);
				debouncer.reset();
				greenSince = null;
			} else {
				machine = { name: 'error', kind: 'worker_crash', from: 'burst' };
				banner = 'capture.cameraLost';
			}
		}
	}

	async function next() {
		send({ type: 'NEXT' });
		if (machine.name === 'walkAway' && machine.view === 'side')
			await goto(resolve('/capture/side'));
		else await goto(resolve('/processing'));
	}

	function teardown() {
		destroyed = true;
		clearTimeout(loopTimer);
		clearInterval(countTimer);
		clearInterval(walkTimer);
		engine?.stop();
		engine = null;
		lastAnalysis = null;
		if (canvas) canvas.width = canvas.height = 0;
		releaseWake?.();
		stopOrientation?.();
	}
	onDestroy(teardown);

	async function stopMeasuring() {
		teardown();
		releaseCaptures();
		await exitFullscreen();
		await goto(resolve('/'));
	}

	async function toggleMute() {
		muted = !muted;
		draft.audio_muted = muted;
		setMuted(muted);
		if (!muted) await unlockAudio();
		await setSetting('audio_muted', muted);
	}

	const mainText = $derived.by(() => {
		if (banner) return t(banner);
		if (machine.name === 'walkAway')
			return view === 'front' ? t('capture.walk', { n: walkLeft }) : t('capture.turnShort');
		if (machine.name === 'countdown') return t('capture.allGood');
		if (machine.name === 'burst') return t('capture.holdStill');
		if (machine.name === 'viewDone') return t('capture.done');
		if (message) return t(message);
		if (green) return t('capture.allGood');
		return t('capture.msg.stepInto');
	});
	const protocol = $derived(PROTOCOL[locale.lang].sections.find((s) => s.art === view)!);
	void lastAnalysis;
</script>

<div class="cap vt-theme-capture border-{border}">
	<header class="strip">
		<LangToggle tone="onDark" />
		<h1>{t(view === 'front' ? 'capture.front.title' : 'capture.side.title')}</h1>
		<button
			type="button"
			class="round"
			aria-label={t('capture.close')}
			onclick={() => (stopOpen = true)}><Icon name="x" size={28} /></button
		>
	</header>

	<div class="stage">
		<!-- Rear camera: not mirrored. The real pipeline attaches its stream here (Phase 3). -->
		<video bind:this={video} class="preview" class:hidden={kind === 'fake'} playsinline muted
		></video>
		{#if kind === 'fake'}
			<canvas bind:this={canvas} class="preview" width="540" height="960" aria-hidden="true"
			></canvas>
			<span class="sim">{t('capture.simulated')}</span>
		{/if}
		<TargetOutline {view} label={t('capture.sheetHere')} />

		{#if machine.name === 'checking' || machine.name === 'countdown'}
			<div class="checks"><CheckList states={rows} /></div>
		{/if}
		<div class="level"><LevelBubble beta={level.beta} gamma={level.gamma} variant="bar" /></div>

		{#if machine.name === 'countdown'}
			<div class="count"><Countdown n={machine.n} /></div>
		{:else if machine.name === 'walkAway' && view === 'front'}
			<div class="count"><Countdown n={walkLeft} /></div>
		{:else if machine.name === 'walkAway' && view === 'side'}
			<div class="turn-card" role="note">
				<p>{t('capture.turn')}</p>
				<p class="secs vt-num" aria-hidden="true">{walkLeft}</p>
			</div>
		{/if}

		<p class="instruction" class:ok={border === 'ok'} aria-live="assertive" aria-atomic="true">
			{mainText}
		</p>
	</div>

	<div class="controls">
		<button
			type="button"
			class="round"
			aria-label={t('common.help')}
			onclick={() => (helpOpen = true)}><Icon name="help" size={28} /></button
		>
		{#if draft.capture_mode === 'assisted'}
			<div class="shutter-wrap">
				<button
					type="button"
					class="shutter"
					aria-label={t('capture.shutter')}
					disabled={!green || machine.name !== 'checking'}
					onclick={shutter}
				></button>
				{#if view === 'side' && machine.name === 'checking'}
					<Button variant="text" onclick={() => goto(resolve('/capture/front'))}
						>{t('capture.flip')}</Button
					>
				{/if}
			</div>
		{:else}
			<p class="auto">{t('capture.auto')}</p>
		{/if}
		<button
			type="button"
			class="round"
			aria-pressed={muted}
			aria-label={muted ? t('common.unmute') : t('common.mute')}
			onclick={toggleMute}
		>
			<Icon name={muted ? 'mute' : 'sound'} size={28} />
		</button>
	</div>
	<p class="footer">{t('capture.footer')}</p>
</div>

<Dialog bind:open={stopOpen} title={t('capture.stopTitle')}>
	<p>{t('capture.stopBody')}</p>
	{#snippet actions()}
		<Button variant="text" onclick={() => (stopOpen = false)}>{t('capture.keepGoing')}</Button>
		<Button variant="danger" onclick={stopMeasuring}>{t('capture.stopYes')}</Button>
	{/snippet}
</Dialog>

<BottomSheet bind:open={helpOpen} title={protocol.heading}>
	<ol class="help">
		{#each protocol.steps as s, i (i)}<li>{s}</li>{/each}
	</ol>
</BottomSheet>

<style>
	.cap {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: grid;
		grid-template-rows: auto 1fr auto auto;
		background: var(--vt-capture-bg);
		color: var(--vt-capture-ink);
		border: 16px solid var(--vt-border-stop);
		padding: var(--vt-safe-top) var(--vt-safe-right) var(--vt-safe-bottom) var(--vt-safe-left);
		transition: border-color var(--vt-duration);
		overflow: hidden;
	}
	.border-ok {
		border-color: var(--vt-border-ok);
	}
	.border-wait {
		border-color: var(--vt-border-wait);
	}
	.strip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--vt-s-8);
		padding: var(--vt-s-4) var(--vt-s-8);
	}
	.strip h1 {
		margin: 0;
		font-size: var(--vt-fs-16);
		text-align: center;
	}
	.round {
		display: grid;
		place-items: center;
		width: 56px;
		height: 56px;
		border: 0;
		border-radius: 50%;
		background: rgb(255 255 255 / 0.12);
		color: #fff;
		cursor: pointer;
	}
	.round[aria-pressed='true'] {
		background: rgb(255 255 255 / 0.3);
	}
	.stage {
		position: relative;
		min-height: 0;
	}
	.preview {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	.hidden {
		display: none;
	}
	.sim {
		position: absolute;
		top: var(--vt-s-8);
		left: 50%;
		transform: translateX(-50%);
		padding: 2px var(--vt-s-8);
		border-radius: 999px;
		background: rgb(0 0 0 / 0.5);
		font-size: var(--vt-fs-14);
	}
	.checks {
		position: absolute;
		left: var(--vt-s-4);
		top: var(--vt-s-8);
		max-width: 46%;
	}
	.level {
		position: absolute;
		right: var(--vt-s-8);
		top: 50%;
		transform: translateY(-50%);
	}
	.count {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		pointer-events: none;
	}
	.instruction {
		position: absolute;
		left: var(--vt-s-8);
		right: var(--vt-s-8);
		bottom: 6%;
		margin: 0;
		padding: var(--vt-s-12) var(--vt-s-16);
		border-radius: var(--vt-radius-lg);
		background: rgb(0 0 0 / 0.78);
		color: #fff;
		font-size: var(--vt-fs-56);
		font-weight: 800;
		line-height: 1.08;
		text-align: center;
		text-wrap: balance;
	}
	.instruction.ok {
		color: #b6f5cc;
	}
	@media (max-width: 380px) {
		.instruction {
			font-size: 2.75rem;
		}
	}
	.controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--vt-s-8);
		padding: var(--vt-s-8);
	}
	.shutter-wrap {
		display: grid;
		justify-items: center;
	}
	.shutter {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		border: 6px solid #fff;
		background: var(--vt-border-ok);
		cursor: pointer;
	}
	.shutter:disabled {
		background: #555;
		cursor: not-allowed;
	}
	.auto {
		flex: 1;
		margin: 0;
		text-align: center;
		font-weight: 600;
		font-size: var(--vt-fs-14);
	}
	.footer {
		margin: 0;
		padding: 0 var(--vt-s-8) var(--vt-s-4);
		text-align: center;
		font-size: var(--vt-fs-14);
		color: #d6d0c8;
	}
	.turn-card {
		position: absolute;
		left: var(--vt-s-12);
		right: var(--vt-s-12);
		top: 12%;
		display: grid;
		gap: var(--vt-s-8);
		padding: var(--vt-s-16);
		border-radius: var(--vt-radius-lg);
		background: rgb(0 0 0 / 0.82);
		font-size: var(--vt-fs-22);
		font-weight: 700;
		line-height: 1.3;
	}
	.turn-card p {
		margin: 0;
	}
	.secs {
		font-size: var(--vt-fs-36);
		text-align: center;
	}
	.help {
		padding-left: 1.25rem;
		display: grid;
		gap: var(--vt-s-8);
	}
</style>
