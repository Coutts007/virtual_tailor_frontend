<script lang="ts" generics="V extends string">
	let {
		value = $bindable(),
		options,
		id,
		describedby,
		invalid = false,
		onchange
	}: {
		value?: V;
		options: { value: V; label: string }[];
		id?: string;
		describedby?: string;
		invalid?: boolean;
		onchange?: (v: V) => void;
	} = $props();
</script>

<div class="sel">
	<select
		{id}
		class="vt-input"
		bind:value
		onchange={() => value !== undefined && onchange?.(value)}
		aria-describedby={describedby}
		aria-invalid={invalid || undefined}
	>
		{#each options as o (o.value)}
			<option value={o.value}>{o.label}</option>
		{/each}
	</select>
</div>

<style>
	.sel {
		position: relative;
		max-width: 22rem;
	}
	select {
		appearance: none;
		padding-right: 2.5rem !important;
		background-image:
			linear-gradient(45deg, transparent 50%, currentColor 50%),
			linear-gradient(135deg, currentColor 50%, transparent 50%);
		background-position:
			calc(100% - 20px) 50%,
			calc(100% - 14px) 50%;
		background-size: 6px 6px;
		background-repeat: no-repeat;
	}
</style>
