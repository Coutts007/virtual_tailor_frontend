<script lang="ts" generics="V extends string">
	/** Filter chips with counts (order queue, client filters). Toggle buttons. */
	let {
		label,
		chips,
		selected = $bindable([]),
		multiple = true
	}: {
		label: string;
		chips: { value: V; label: string; count?: number }[];
		selected?: V[];
		multiple?: boolean;
	} = $props();

	function toggle(v: V) {
		const on = selected.includes(v);
		if (multiple) selected = on ? selected.filter((x) => x !== v) : [...selected, v];
		else selected = on ? [] : [v];
	}
</script>

<div class="chips" role="group" aria-label={label}>
	{#each chips as c (c.value)}
		<button
			type="button"
			class="chip"
			aria-pressed={selected.includes(c.value)}
			onclick={() => toggle(c.value)}
		>
			{c.label}
			{#if c.count != null}<span class="count vt-num">{c.count}</span>{/if}
		</button>
	{/each}
</div>

<style>
	.chips {
		display: flex;
		gap: var(--vt-s-8);
		overflow-x: auto;
		padding: 4px 2px;
		scrollbar-width: none;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		flex: none;
		min-height: 40px;
		padding: 0 var(--vt-s-16);
		border: 2px solid var(--vt-line);
		border-radius: 999px;
		background: var(--vt-paper);
		color: var(--vt-ink);
		font-weight: 600;
		cursor: pointer;
	}
	.chip[aria-pressed='true'] {
		background: var(--vt-thread);
		border-color: var(--vt-thread);
		color: var(--vt-thread-ink);
	}
	.count {
		min-width: 1.5em;
		padding: 0 6px;
		border-radius: 999px;
		background: var(--vt-chalk);
		color: var(--vt-ink);
		font-size: var(--vt-fs-14);
		text-align: center;
	}
	@media (pointer: coarse) {
		.chip {
			min-height: var(--vt-target);
		}
	}
</style>
