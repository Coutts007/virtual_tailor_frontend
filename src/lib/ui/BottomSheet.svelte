<script lang="ts">
	import type { Snippet } from 'svelte';
	import Dialog from './Dialog.svelte';

	let {
		open = $bindable(false),
		title,
		children,
		actions
	}: { open?: boolean; title: string; children: Snippet; actions?: Snippet } = $props();
</script>

<Dialog bind:open {title} variant="sheet" {actions}>{@render children()}</Dialog>
