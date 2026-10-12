<script lang="ts">
	/*
	 * Capture tuning (Section 10.3): choose the vision engine (fake scenarios or
	 * the real camera), speed up scripted scenarios, and watch every check's live
	 * numbers against its threshold. Dev builds only; thresholds live in capture/config.ts.
	 */
	import { onDestroy } from 'svelte';
	import { CAPTURE_CONFIG, captureConfigHash } from '$lib/capture/config';
	import { evaluate, type LiveFrame, type View } from '$lib/capture/checks';
	import { orientation, watchOrientation } from '$lib/capture/orientation.svelte';
	import { createEngine, setVisionPrefs, visionPrefs } from '$lib/vision';
	import { SCENARIOS } from '$lib/vision/fakeScenarios';
	import type { VisionEngine, LiveAnalysis } from '$lib/vision/types';
	import { RULES_VERSION } from '$lib/measure';
	import Button from '$lib/ui/Button.svelte';

	let prefs = $state(visionPrefs());
	let view = $state<View>('front');
	let running = $state(false);
	let last = $state<LiveAnalysis | null>(null);
	let result = $state<ReturnType<typeof evaluate> | null>(null);
	let fps = $state(0);
	let video: HTMLVideoElement | undefined = $state();
	let canvas: HTMLCanvasElement | undefined = $state();
	let engine: VisionEngine | null = null;
	let timer: ReturnType<typeof setTimeout> | undefined;
	const history: LiveFrame[] = [];
	let frames = 0;
	let since = 0;

	$effect(() => setVisionPrefs($state.snapshot(prefs)));

	async function start() {
		stop();
		engine = await createEngine({ height_mm: 1700, sex: 'female' });
		await engine.start(video ?? null);
		engine.beginView(view, performance.now());
		running = true;
		since = performance.now();
		frames = 0;
		const stopOri = watchOrientation();
		const tick = async () => {
			if (!engine || !running) return stopOri();
			const now = performance.now();
			const a = await engine.analyze(view, now);
			last = a;
			const fake =
				'orientationAt' in engine
					? (
							engine as unknown as {
								orientationAt(v: View, n: number): { beta: number; gamma: number };
							}
						).orientationAt(view, now)
					: null;
			const f: LiveFrame = {
				t: now,
				orientation:
					fake ??
					(orientation.beta != null
						? { beta: orientation.beta, gamma: orientation.gamma ?? 0 }
						: null),
				levelUnchecked: false,
				landmarks: a?.landmarks ?? null,
				maskBox: a?.maskBox ?? null,
				armMerge: a?.armMerge ?? null,
				marker: a?.marker ?? null,
				luminance: a?.luminance ?? null,
				sharpness: a?.sharpness ?? null,
				streamH: a?.streamH ?? 1920,
				stillAvailable: a?.stillAvailable ?? false
			};
			result = evaluate(f, view, history);
			history.push(f);
			if (history.length > 10) history.shift();
			if (canvas && engine.draw) engine.draw(canvas, a, view);
			frames++;
			fps = Math.round((frames / (now - since)) * 10000) / 10;
			timer = setTimeout(tick, 1000 / 6);
		};
		void tick();
	}

	function stop() {
		running = false;
		clearTimeout(timer);
		engine?.stop();
		engine = null;
	}
	onDestroy(stop);
	const C = CAPTURE_CONFIG;
</script>

<svelte:head><title>Capture tuning · VT</title></svelte:head>

<main id="main" class="wrap">
	<h1>Capture tuning</h1>
	<p class="vt-muted">rules_version {RULES_VERSION} · capture config {captureConfigHash()}</p>

	<div class="controls">
		<label
			>Engine
			<select bind:value={prefs.mode}
				><option value="fake">Fake (scripted)</option><option value="real">Real camera</option
				></select
			>
		</label>
		<label
			>Scenario
			<select bind:value={prefs.scenario} disabled={prefs.mode !== 'fake'}>
				{#each SCENARIOS as s (s.id)}<option value={s.id}>{s.label}</option>{/each}
			</select>
		</label>
		<label
			>Time scale <input
				type="number"
				min="0.05"
				max="2"
				step="0.05"
				bind:value={prefs.timeScale}
			/></label
		>
		<label
			>View <select bind:value={view}
				><option value="front">front</option><option value="side">side</option></select
			></label
		>
		<Button onclick={start}>{running ? 'Restart' : 'Start'}</Button>
		<Button variant="secondary" onclick={stop}>Stop</Button>
	</div>

	<div class="grid">
		<div class="preview">
			<video bind:this={video} playsinline muted class:hidden={prefs.mode === 'fake'}></video>
			{#if prefs.mode === 'fake'}<canvas bind:this={canvas} width="270" height="480"></canvas>{/if}
		</div>
		<table>
			<caption>Live values (≈ {fps} fps; target ≥ {C.live.minFps})</caption>
			<thead><tr><th>Check</th><th>State</th><th>Value</th><th>Threshold</th></tr></thead>
			<tbody>
				{#if result}
					<tr
						><td>Level</td><td>{result.states.level}</td><td
							>{orientation.beta?.toFixed(1) ?? '—'}° / {orientation.gamma?.toFixed(1) ?? '—'}°</td
						><td>β {C.level.betaMin}–{C.level.betaMax}, |γ| ≤ {C.level.gammaMax}</td></tr
					>
					<tr
						><td>Person</td><td>{result.states.person}</td><td
							>{last?.landmarks ? 'pose' : 'none'}</td
						><td>vis ≥ {C.person.minVisibility}</td></tr
					>
					<tr
						><td>Frame</td><td>{result.states.frame}</td><td
							>{last?.maskBox
								? `${last.maskBox.top.toFixed(3)}–${last.maskBox.bottom.toFixed(3)}`
								: '—'}</td
						><td>top ≥ {C.frame.topMarginMin}, bottom ≤ {C.frame.bottomMax}</td></tr
					>
					<tr
						><td>Distance</td><td>{result.states.distance}</td><td
							>{result.heightFrac?.toFixed(3) ?? '—'}</td
						><td>{C.distance.minFrac.toFixed(3)}–{C.distance.maxFrac.toFixed(3)}</td></tr
					>
					<tr
						><td>Facing</td><td>{result.states.symmetry}</td><td></td><td
							>ratio ± {C.symmetry.frontRatioTol}</td
						></tr
					>
					<tr
						><td>Arms</td><td>{result.states.arms}</td><td
							>{last?.armMerge ? JSON.stringify(last.armMerge) : ''}</td
						><td>≥ {C.arms.wristHipMinShoulderFrac} × shoulder</td></tr
					>
					<tr
						><td>Sheet</td><td>{result.states.marker}</td><td
							>{last?.marker
								? `${last.marker.sidePx.toFixed(0)} px, ratio ${last.marker.ratio.toFixed(3)}`
								: '—'}</td
						><td>≥ {C.marker.minSidePx} px, ≤ {C.marker.maxSideRatio}</td></tr
					>
					<tr
						><td>Light</td><td>{result.states.light}</td><td
							>lum {last?.luminance?.toFixed(0) ?? '—'}, blur {last?.sharpness?.toFixed(0) ??
								'—'}</td
						><td>{C.light.lumMin}–{C.light.lumMax}, ≥ {C.light.blurMin}</td></tr
					>
					<tr
						><td>Stability</td><td>{result.states.stability}</td><td></td><td
							>&lt; {C.stability.maxJitterFrac * 100}% height</td
						></tr
					>
				{/if}
			</tbody>
		</table>
	</div>
</main>

<style>
	.wrap {
		max-width: 64rem;
		margin: 0 auto;
		padding: var(--vt-s-16);
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: var(--vt-s-12);
		align-items: end;
	}
	label {
		display: grid;
		font-weight: 600;
		font-size: var(--vt-fs-14);
	}
	select,
	input {
		min-height: 40px;
	}
	.grid {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: var(--vt-s-16);
		margin-top: var(--vt-s-16);
	}
	@media (max-width: 700px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
	.preview video,
	.preview canvas {
		width: 270px;
		background: #000;
	}
	.hidden {
		display: none;
	}
	table {
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}
	th,
	td {
		text-align: left;
		padding: 4px 8px;
		border-bottom: 1px solid var(--vt-line);
	}
</style>
