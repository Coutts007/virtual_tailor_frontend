<script lang="ts" module>
	import type { Flag as F, SiteCode as S } from '$lib/api/types';
	export interface SilhouetteItem {
		site: Exclude<S, 'stature'>;
		label: string;
		value: string;
		flag: F;
		iso?: string;
	}
</script>

<script lang="ts">
	import type { SiteCode } from '$lib/api/types';
	import FlagBadge from './FlagBadge.svelte';
	import { ANCHORS, HEAD, LABEL_EDGE, VIEW, bodyPath } from './silhouette';

	/**
	 * Neutral front outline (never the client's photo or mask) with eight leader
	 * lines (Section 9.10). `labels` shows tappable labels; `numbers` shows
	 * numbered dots matching a table (tailor sheet view, Section 13.5).
	 */
	let {
		items,
		mode = 'labels',
		selected = null,
		onselect,
		title
	}: {
		items: SilhouetteItem[];
		mode?: 'labels' | 'numbers';
		selected?: SiteCode | null;
		onselect?: (site: SiteCode) => void;
		title?: string;
	} = $props();

	const path = bodyPath();
	const pct = (v: number, of: number) => `${(v / of) * 100}%`;
</script>

<div class="sil {mode}" style:aspect-ratio="{VIEW.w} / {VIEW.h}">
	<svg
		viewBox="0 0 {VIEW.w} {VIEW.h}"
		role={title ? 'img' : undefined}
		aria-label={title}
		aria-hidden={title ? undefined : 'true'}
	>
		<circle class="body" cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} />
		<path class="body" d={path} />
		{#each items as it, i (it.site)}
			{@const a = ANCHORS[it.site]}
			{#if mode === 'labels'}
				<line
					class="leader {it.flag}"
					class:sel={selected === it.site}
					x1={a.at[0]}
					y1={a.at[1]}
					x2={a.side === 'left' ? LABEL_EDGE.left : LABEL_EDGE.right}
					y2={a.labelY}
				/>
				<circle class="dot {it.flag}" cx={a.at[0]} cy={a.at[1]} r="4" />
			{:else}
				<circle class="num {it.flag}" cx={a.at[0]} cy={a.at[1]} r="11" />
				<text class="numtext" x={a.at[0]} y={a.at[1] + 4.5} text-anchor="middle">{i + 1}</text>
			{/if}
		{/each}
	</svg>

	{#if mode === 'labels'}
		{#each items as it (it.site)}
			{@const a = ANCHORS[it.site]}
			<button
				type="button"
				class="label {a.side}"
				class:sel={selected === it.site}
				style:top={pct(a.labelY, VIEW.h)}
				onclick={() => onselect?.(it.site)}
			>
				<span class="name">{it.label}</span>
				<span class="value vt-num">{it.value}</span>
				<FlagBadge flag={it.flag} size="sm" />
				{#if it.iso}<span class="iso">{it.iso}</span>{/if}
			</button>
		{/each}
	{/if}
</div>

<style>
	.sil {
		position: relative;
		width: 100%;
		max-width: 30rem;
		margin: 0 auto;
	}
	.sil.numbers {
		max-width: 12rem;
	}
	svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.body {
		fill: var(--vt-thread-tint);
		stroke: var(--vt-line-strong);
		stroke-width: 1.5;
	}
	.leader {
		stroke: var(--vt-line-strong);
		stroke-width: 1.2;
		stroke-dasharray: 3 2;
	}
	.leader.sel {
		stroke: var(--vt-thread);
		stroke-width: 2;
		stroke-dasharray: none;
	}
	.dot {
		stroke: var(--vt-paper);
		stroke-width: 1.5;
	}
	.dot.pass,
	.num.pass {
		fill: var(--vt-pass);
	}
	.dot.check,
	.num.check {
		fill: var(--vt-check);
	}
	.dot.fail,
	.num.fail {
		fill: var(--vt-fail);
	}
	.numtext {
		fill: #fff;
		font-size: 12px;
		font-weight: 700;
		font-family: var(--vt-font);
	}
	.label {
		position: absolute;
		transform: translateY(-50%);
		width: 29%;
		min-width: 0;
		display: grid;
		gap: 1px;
		padding: 4px 6px;
		border: 1.5px solid transparent;
		border-radius: 8px;
		background: transparent;
		text-align: left;
		cursor: pointer;
		min-height: var(--vt-target);
		font-size: var(--vt-fs-14);
		line-height: 1.25;
	}
	.label.left {
		left: 0;
		justify-items: start;
	}
	.label.right {
		right: 0;
		justify-items: end;
		text-align: right;
	}
	.label:hover,
	.label.sel {
		border-color: var(--vt-thread);
		background: var(--vt-paper);
	}
	.label > :global(*) {
		max-width: 100%;
		min-width: 0;
	}
	.name {
		font-weight: 700;
	}
	.value {
		font-size: var(--vt-fs-16);
		font-weight: 700;
		white-space: nowrap;
	}
	.iso {
		font-size: 0.6875rem;
		color: var(--vt-ink-muted);
	}
	@media (max-width: 400px) {
		.label {
			padding: 2px 3px;
			font-size: 0.8125rem;
		}
		.value {
			font-size: var(--vt-fs-14);
		}
		.iso {
			display: none;
		}
	}
</style>
