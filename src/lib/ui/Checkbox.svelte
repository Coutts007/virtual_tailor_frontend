<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		checked = $bindable(false),
		id = `cb-${Math.random().toString(36).slice(2, 8)}`,
		describedby,
		disabled = false,
		children
	}: {
		checked?: boolean;
		id?: string;
		describedby?: string;
		disabled?: boolean;
		children: Snippet;
	} = $props();
</script>

<label class="cb" class:checked for={id}>
	<input {id} type="checkbox" bind:checked {disabled} aria-describedby={describedby} />
	<span class="text">{@render children()}</span>
</label>

<style>
	.cb {
		display: flex;
		gap: var(--vt-s-12);
		align-items: flex-start;
		min-height: var(--vt-target);
		padding: var(--vt-s-12);
		border: 2px solid var(--vt-line);
		border-radius: var(--vt-radius);
		background: var(--vt-paper);
		cursor: pointer;
	}
	.cb.checked {
		border-color: var(--vt-thread);
	}
	.cb:has(input:focus-visible) {
		outline: 3px solid var(--vt-focus);
		outline-offset: 2px;
	}
	input {
		width: 24px;
		height: 24px;
		margin: 0;
		flex: none;
		accent-color: var(--vt-thread);
	}
	.text {
		padding-top: 1px;
	}
</style>
