<script lang="ts">
	/**
	 * Decimal or integer input with a unit suffix. Uses type=text with
	 * inputmode so partial input like "98." is not wiped by the browser.
	 */
	let {
		value = $bindable(null),
		id,
		describedby,
		invalid = false,
		unit,
		decimals = 0,
		min,
		max,
		placeholder,
		onblur,
		oninput
	}: {
		value?: number | null;
		id?: string;
		describedby?: string;
		invalid?: boolean;
		unit?: string;
		decimals?: number;
		min?: number;
		max?: number;
		placeholder?: string;
		onblur?: () => void;
		oninput?: (v: number | null) => void;
	} = $props();

	let text = $state(value == null ? '' : String(value));
	$effect(() => {
		// External changes (e.g. unit conversion) update the text.
		const parsed = parse(text);
		if (value !== parsed) text = value == null ? '' : String(value);
	});

	function parse(s: string): number | null {
		const clean = s.replace(',', '.').trim();
		if (clean === '' || clean === '.') return null;
		const n = Number(clean);
		return Number.isFinite(n) ? n : null;
	}

	function handle(e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		const allowed = decimals > 0 ? /[^0-9.,]/g : /[^0-9]/g;
		text = el.value.replace(allowed, '');
		el.value = text;
		value = parse(text);
		oninput?.(value);
	}
</script>

<div class="num" class:invalid>
	<input
		{id}
		class="vt-input vt-num"
		type="text"
		inputmode={decimals > 0 ? 'decimal' : 'numeric'}
		value={text}
		oninput={handle}
		{onblur}
		{placeholder}
		aria-describedby={describedby}
		aria-invalid={invalid || undefined}
		data-min={min}
		data-max={max}
		autocomplete="off"
	/>
	{#if unit}<span class="unit" aria-hidden="true">{unit}</span>{/if}
</div>

<style>
	.num {
		position: relative;
		max-width: 14rem;
	}
	.num input {
		padding-right: 3.5rem !important;
		font-size: var(--vt-fs-18) !important;
	}
	.unit {
		position: absolute;
		right: var(--vt-s-12);
		top: 50%;
		transform: translateY(-50%);
		color: var(--vt-ink-muted);
		font-weight: 600;
		pointer-events: none;
	}
</style>
