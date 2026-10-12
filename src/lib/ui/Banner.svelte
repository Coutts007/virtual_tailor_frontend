<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		tone = 'info',
		live = 'polite',
		children
	}: {
		tone?: 'info' | 'offline' | 'warning' | 'danger';
		live?: 'polite' | 'off';
		children: Snippet;
	} = $props();
</script>

<div class="banner {tone}" role={live === 'off' ? undefined : 'status'} aria-live={live}>
	{@render children()}
</div>

<style>
	.banner {
		padding: var(--vt-s-8) var(--vt-s-16);
		font-size: var(--vt-fs-14);
		line-height: 1.4;
	}
	.info {
		background: var(--vt-info-fill);
		color: var(--vt-ink);
	}
	.offline {
		background: var(--vt-offline-fill);
		color: var(--vt-offline-ink);
	}
	.warning {
		background: var(--vt-check-fill);
		color: var(--vt-check-ink);
	}
	.danger {
		background: var(--vt-fail-fill);
		color: var(--vt-fail);
	}
</style>
