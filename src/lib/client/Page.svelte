<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Client page body: one column, safe-area padding, optional sticky action bar. */
	let { children, actions }: { children: Snippet; actions?: Snippet } = $props();
</script>

<main id="main" class="page" class:has-actions={!!actions}>
	{@render children()}
</main>
{#if actions}
	<div class="actions">
		<div class="inner">{@render actions()}</div>
	</div>
{/if}

<style>
	.page {
		max-width: 40rem;
		margin: 0 auto;
		padding: var(--vt-s-24) var(--vt-s-16) var(--vt-s-48);
	}
	.has-actions {
		padding-bottom: 9rem;
	}
	.actions {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 15;
		background: linear-gradient(to top, var(--vt-chalk) 75%, transparent);
		padding: var(--vt-s-24) var(--vt-s-16) calc(var(--vt-s-16) + var(--vt-safe-bottom));
	}
	.inner {
		max-width: 40rem;
		margin: 0 auto;
		display: grid;
		gap: var(--vt-s-8);
	}
</style>
