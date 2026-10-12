<script lang="ts">
	import type { ArtKey } from '$lib/i18n/protocol';

	/** Small line drawings for the protocol card and setup steps (Appendix B). Decorative. */
	let { art, size = 96 }: { art: ArtKey; size?: number } = $props();
</script>

<svg
	class="art"
	width={size}
	height={size}
	viewBox="0 0 96 96"
	aria-hidden="true"
	fill="none"
	stroke="currentColor"
	stroke-width="2.4"
	stroke-linecap="round"
	stroke-linejoin="round"
>
	{#if art === 'clothes'}
		<path d="M34 18l-14 8 6 14 6-3v41h32V37l6 3 6-14-14-8c-2 6-8 9-14 9s-12-3-14-9z" />
		<path d="M48 27v6" />
	{:else if art === 'sheet'}
		<rect x="22" y="10" width="52" height="76" rx="2" />
		<rect x="32" y="20" width="32" height="32" fill="currentColor" />
		<path d="M30 64h36M30 61v6M66 61v6" />
		<rect x="34" y="72" width="28" height="9" rx="2" stroke-dasharray="3 3" />
	{:else if art === 'chair'}
		<path d="M24 50h40v6H24zM28 56v30M60 56v30M60 50V14" />
		<rect x="38" y="22" width="16" height="28" rx="3" />
		<path d="M46 45h0" />
		<path d="M72 30l14-6M72 38h16" stroke-dasharray="3 3" />
	{:else if art === 'distance'}
		<path d="M10 86h76M14 20v66M82 30v56" />
		<path d="M22 78h52M22 74l-6 4 6 4M74 74l6 4-6 4" />
	{:else if art === 'front'}
		<circle cx="48" cy="16" r="8" />
		<path d="M36 30h24l4 26M36 30l-4 26M40 30v26h16V30M42 56l-2 30M54 56l2 30" />
		<path d="M32 56l-8 14M64 56l8 14" />
		<rect x="42" y="34" width="12" height="12" fill="currentColor" />
	{:else if art === 'side'}
		<circle cx="46" cy="16" r="8" />
		<path d="M42 28h10l2 28h-14zM44 56l-2 30M52 56l2 30M52 32l8 22" />
		<rect x="50" y="48" width="10" height="10" fill="currentColor" />
		<path d="M72 40h14M80 34l6 6-6 6" />
	{:else}
		<circle cx="48" cy="48" r="34" />
		<path d="M48 30v22M48 64v2" />
	{/if}
</svg>

<style>
	.art {
		color: var(--vt-thread);
		flex: none;
	}
</style>
