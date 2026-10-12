<script lang="ts">
	/** Native date input (Section 8.4); min/max as YYYY-MM-DD. */
	let {
		value = $bindable(''),
		id,
		describedby,
		invalid = false,
		min,
		max,
		onchange
	}: {
		value?: string;
		id?: string;
		describedby?: string;
		invalid?: boolean;
		min?: string;
		max?: string;
		onchange?: (v: string) => void;
	} = $props();
</script>

<input
	{id}
	class="vt-input date"
	type="date"
	bind:value
	{min}
	{max}
	onchange={() => onchange?.(value)}
	aria-describedby={describedby}
	aria-invalid={invalid || undefined}
/>

<style>
	.date {
		max-width: 14rem;
	}
</style>
