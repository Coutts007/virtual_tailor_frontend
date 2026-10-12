<script lang="ts" module>
	export interface RadioOption<T extends string> {
		value: T;
		label: string;
		description?: string;
	}
</script>

<script lang="ts" generics="V extends string">
	import type { Snippet } from 'svelte';

	let {
		legend,
		hint,
		options,
		value = $bindable(),
		name = `rc-${Math.random().toString(36).slice(2, 8)}`,
		columns = 1,
		art
	}: {
		legend: string;
		hint?: string;
		options: RadioOption<V>[];
		value?: V;
		name?: string;
		columns?: 1 | 2 | 3;
		art?: Snippet<[V]>;
	} = $props();
	const hintId = $derived(`${name}-hint`);
</script>

<fieldset class="rc" aria-describedby={hint ? hintId : undefined}>
	<legend>{legend}</legend>
	{#if hint}<p class="hint" id={hintId}>{hint}</p>{/if}
	<div class="grid" style:--cols={columns}>
		{#each options as o (o.value)}
			<label class="card" class:selected={value === o.value}>
				<input type="radio" {name} value={o.value} bind:group={value} />
				{#if art}<span class="art">{@render art(o.value)}</span>{/if}
				<span class="text">
					<span class="label">{o.label}</span>
					{#if o.description}<span class="desc">{o.description}</span>{/if}
				</span>
			</label>
		{/each}
	</div>
</fieldset>

<style>
	.rc {
		border: 0;
		padding: 0;
		margin: 0 0 var(--vt-s-16);
		min-width: 0;
	}
	legend {
		font-weight: 700;
		padding: 0;
		margin-bottom: var(--vt-s-4);
	}
	.hint {
		margin: 0 0 var(--vt-s-8);
		color: var(--vt-ink-muted);
		font-size: var(--vt-fs-14);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
		gap: var(--vt-s-8);
	}
	.card {
		display: flex;
		gap: var(--vt-s-12);
		align-items: center;
		min-height: 56px;
		padding: var(--vt-s-12) var(--vt-s-16);
		border: 2px solid var(--vt-line);
		border-radius: var(--vt-radius);
		background: var(--vt-paper);
		cursor: pointer;
	}
	.card.selected {
		border-color: var(--vt-thread);
		background: var(--vt-thread-tint);
	}
	.card:has(input:focus-visible) {
		outline: 3px solid var(--vt-focus);
		outline-offset: 2px;
	}
	input {
		width: 22px;
		height: 22px;
		margin: 0;
		accent-color: var(--vt-thread);
		flex: none;
	}
	.text {
		display: grid;
	}
	.label {
		font-weight: 700;
	}
	.desc {
		font-size: var(--vt-fs-14);
		color: var(--vt-ink-muted);
	}
	.art {
		flex: none;
		color: var(--vt-thread);
	}
</style>
