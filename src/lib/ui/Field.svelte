<script lang="ts">
	import type { Snippet } from 'svelte';
	import { t } from '$lib/i18n/t.svelte';
	import Icon from './Icon.svelte';

	/**
	 * Label + hint + error wrapper. The control receives `id` and
	 * `describedby` so hints and errors are linked with aria-describedby.
	 */
	let {
		label,
		hint,
		error,
		optional = false,
		id = `f-${Math.random().toString(36).slice(2, 9)}`,
		children
	}: {
		label: string;
		hint?: string;
		error?: string | null;
		optional?: boolean;
		id?: string;
		children: Snippet<[{ id: string; describedby: string | undefined; invalid: boolean }]>;
	} = $props();

	const hintId = $derived(`${id}-hint`);
	const errId = $derived(`${id}-err`);
	const describedby = $derived(
		[hint ? hintId : null, error ? errId : null].filter(Boolean).join(' ') || undefined
	);
</script>

<div class="field" class:invalid={!!error}>
	<label for={id}>
		{label}
		{#if optional}<span class="opt">({t('common.optional')})</span>{/if}
	</label>
	{#if hint}<p class="hint" id={hintId}>{hint}</p>{/if}
	{@render children({ id, describedby, invalid: !!error })}
	{#if error}
		<p class="error" id={errId} role="alert">
			<Icon name="alert" size={18} />
			<span>{error}</span>
		</p>
	{/if}
</div>

<style>
	.field {
		display: grid;
		gap: var(--vt-s-4);
		margin-bottom: var(--vt-s-16);
	}
	label {
		font-weight: 700;
	}
	.opt {
		font-weight: 400;
		color: var(--vt-ink-muted);
		margin-left: var(--vt-s-4);
	}
	.hint {
		margin: 0;
		color: var(--vt-ink-muted);
		font-size: var(--vt-fs-14);
	}
	.error {
		display: flex;
		gap: var(--vt-s-4);
		align-items: flex-start;
		margin: 0;
		color: var(--vt-fail);
		font-weight: 600;
		font-size: var(--vt-fs-14);
	}
	/* Shared control look for native inputs placed inside a Field. */
	.field :global(.vt-input) {
		width: 100%;
		min-height: var(--vt-target);
		padding: var(--vt-s-8) var(--vt-s-12);
		border: 2px solid var(--vt-line-strong);
		border-radius: var(--vt-radius);
		background: var(--vt-paper);
		font-size: var(--vt-fs-16);
	}
	.field :global(.vt-input:focus-visible) {
		border-color: var(--vt-thread);
	}
	.invalid :global(.vt-input) {
		border-color: var(--vt-fail);
	}
</style>
