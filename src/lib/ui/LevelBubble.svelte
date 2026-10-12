<script lang="ts">
	import { t } from '$lib/i18n/t.svelte';
	import Icon from './Icon.svelte';

	/**
	 * Spirit level from DeviceOrientation (C1): level when beta ∈ [88°, 92°] and
	 * |gamma| ≤ 2°. `bar` is the slim vertical bar on the capture screen; `large`
	 * is the setup screen bubble.
	 */
	let {
		beta = null,
		gamma = null,
		variant = 'large',
		betaRange = [88, 92],
		gammaMax = 2
	}: {
		beta?: number | null;
		gamma?: number | null;
		variant?: 'large' | 'bar';
		betaRange?: [number, number];
		gammaMax?: number;
	} = $props();

	const known = $derived(beta != null && gamma != null);
	const level = $derived(
		known && beta! >= betaRange[0] && beta! <= betaRange[1] && Math.abs(gamma!) <= gammaMax
	);
	const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
	// Bubble offset in % of the radius; 10° of tilt reaches the edge.
	const dx = $derived(known ? (clamp(gamma!, 10) / 10) * 40 : 0);
	const dy = $derived(known ? (clamp(beta! - 90, 10) / 10) * 40 : 0);
	const state = $derived(!known ? 'unknown' : level ? 'ok' : 'tilted');
</script>

<div
	class="level {variant} {state}"
	role="img"
	aria-label="{t('level.label')}: {t(`level.${state}`)}"
>
	<div class="vial">
		<span class="target" aria-hidden="true"></span>
		<span
			class="bubble"
			aria-hidden="true"
			style:transform={variant === 'bar'
				? `translate(-50%, calc(-50% + ${dy}%))`
				: `translate(calc(-50% + ${dx}%), calc(-50% + ${dy}%))`}
		></span>
	</div>
	{#if variant === 'large'}
		<p class="state">
			<Icon
				name={state === 'ok' ? 'check' : state === 'tilted' ? 'triangle' : 'help'}
				size={28}
				stroke={3}
			/>
			<span>{t(`level.${state}`)}</span>
		</p>
	{/if}
</div>

<style>
	.level {
		display: grid;
		justify-items: center;
		gap: var(--vt-s-8);
	}
	.vial {
		position: relative;
		border: 4px solid var(--vt-line-strong);
		background: var(--vt-paper);
	}
	.large .vial {
		width: 200px;
		height: 200px;
		border-radius: 50%;
	}
	.bar .vial {
		width: 28px;
		height: 160px;
		border-radius: 14px;
		background: rgb(0 0 0 / 0.45);
		border-color: rgb(255 255 255 / 0.7);
	}
	.target {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		border: 3px solid var(--vt-ink-muted);
		border-radius: 50%;
	}
	.large .target {
		width: 64px;
		height: 64px;
	}
	.bar .target {
		width: 22px;
		height: 22px;
		border-color: #fff;
	}
	.bubble {
		position: absolute;
		left: 50%;
		top: 50%;
		border-radius: 50%;
		background: var(--vt-check);
		transition: transform 120ms linear;
	}
	.large .bubble {
		width: 52px;
		height: 52px;
	}
	.bar .bubble {
		width: 18px;
		height: 18px;
	}
	.ok .bubble {
		background: var(--vt-pass);
	}
	.ok .vial {
		border-color: var(--vt-pass);
	}
	.unknown .bubble {
		background: var(--vt-line-strong);
	}
	.state {
		display: flex;
		align-items: center;
		gap: var(--vt-s-8);
		margin: 0;
		font-size: var(--vt-fs-22);
		font-weight: 800;
	}
	.ok .state {
		color: var(--vt-pass);
	}
	.tilted .state {
		color: var(--vt-check-ink);
	}
	.bar.ok .vial {
		border-color: var(--vt-border-ok);
	}
	.bar.ok .bubble {
		background: var(--vt-border-ok);
	}
	.bar.tilted .bubble {
		background: var(--vt-border-wait);
	}
</style>
