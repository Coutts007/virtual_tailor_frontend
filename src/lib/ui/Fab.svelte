<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	/** Floating action button above the bottom navigation (Section 13.2, 13.7). */
	let { href, children }: { href: string; children: Snippet } = $props();
</script>

<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved by caller -->
<a class="fab" {href}><Icon name="plus" /><span>{@render children()}</span></a>

<style>
	.fab {
		position: fixed;
		right: var(--vt-s-16);
		bottom: calc(80px + var(--vt-safe-bottom));
		z-index: 15;
		display: inline-flex;
		align-items: center;
		gap: var(--vt-s-8);
		min-height: 56px;
		padding: 0 var(--vt-s-24) 0 var(--vt-s-16);
		border-radius: 28px;
		background: var(--vt-thread);
		color: var(--vt-thread-ink);
		font-weight: 800;
		text-decoration: none;
		box-shadow: var(--vt-shadow-lg);
	}
	@media (min-width: 1024px) {
		.fab {
			bottom: var(--vt-s-32);
			right: var(--vt-s-32);
		}
	}
</style>
