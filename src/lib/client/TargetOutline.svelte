<script lang="ts">
	/**
	 * Capture target outline (9.7, C2): a dashed body drawn at the 2–2.5 m target
	 * size — about 49% of frame height (943 px of 1920 for a 1.70 m adult at 2.5 m),
	 * inside the 31–63% band — centred, arms ~30° out, with "Sheet here" on the chest
	 * (front) or the right hip (side). The SVG uses the 9:16 stream's coordinates.
	 */
	let { view, label }: { view: 'front' | 'side'; label: string } = $props();
	// Frame 1080 × 1920; figure from y 488 to 1432 (≈ 943 px).
	const top = 488;
	const H = 944;
	const s = (f: number) => top + f * H;
</script>

<svg class="outline" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
	<g
		fill="none"
		stroke="rgb(255 255 255 / 0.85)"
		stroke-width="7"
		stroke-dasharray="22 16"
		stroke-linejoin="round"
	>
		{#if view === 'front'}
			<circle cx="540" cy={s(0.065)} r="62" />
			<path
				d="M490 {s(0.13)} L486 {s(0.16)} L420 {s(0.185)} L400 {s(0.24)} L330 {s(0.45)} L355 {s(
					0.46
				)} L425 {s(0.3)} L430 {s(0.5)}
				L440 {s(0.58)} L455 {s(0.99)} L520 {s(0.99)} L530 {s(0.6)} L550 {s(0.6)} L560 {s(0.99)} L625 {s(
					0.99
				)} L640 {s(0.58)}
				L650 {s(0.5)} L655 {s(0.3)} L725 {s(0.46)} L750 {s(0.45)} L680 {s(0.24)} L660 {s(0.185)} L594 {s(
					0.16
				)} L590 {s(0.13)} Z"
			/>
			<rect x="490" y={s(0.22)} width="100" height="100" stroke-dasharray="12 10" />
		{:else}
			<circle cx="545" cy={s(0.065)} r="60" />
			<path
				d="M520 {s(0.13)} L515 {s(0.17)} L490 {s(0.2)} L480 {s(0.33)} L492 {s(0.52)} L498 {s(
					0.99
				)} L560 {s(0.99)} L575 {s(0.55)}
				L600 {s(0.42)} L590 {s(0.2)} L572 {s(0.17)} L568 {s(0.13)} Z"
			/>
			<path d="M560 {s(0.22)} L605 {s(0.44)}" />
			<rect x="560" y={s(0.48)} width="90" height="90" stroke-dasharray="12 10" />
		{/if}
	</g>
	<text
		x={view === 'front' ? 540 : 605}
		y={view === 'front' ? s(0.22) - 18 : s(0.48) - 18}
		text-anchor="middle"
		fill="#fff"
		font-size="34"
		font-weight="700"
		font-family="system-ui, sans-serif"
		paint-order="stroke"
		stroke="rgb(0 0 0 / 0.6)"
		stroke-width="6">{label}</text
	>
</svg>

<style>
	.outline {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
</style>
