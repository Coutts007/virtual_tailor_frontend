<script lang="ts">
	import { t } from '$lib/i18n/t.svelte';
	import { maskClientCode } from '$lib/domain/validate';

	/**
	 * Six-character client code (AB1234). One real input (paste, autofill and
	 * screen readers work) drawn as six boxes. Letters then digits are enforced as
	 * you type, and the keyboard switches from text to numeric after two letters.
	 */
	let {
		value = $bindable(''),
		id,
		describedby,
		invalid = false,
		onblur,
		oncomplete
	}: {
		value?: string;
		id?: string;
		describedby?: string;
		invalid?: boolean;
		onblur?: () => void;
		oncomplete?: (code: string) => void;
	} = $props();

	let focused = $state(false);

	function oninput(e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		value = maskClientCode(el.value);
		el.value = value;
		if (value.length === 6) oncomplete?.(value);
	}

	const boxes = $derived(Array.from({ length: 6 }, (_, i) => value[i] ?? ''));
</script>

<div class="code" class:focused class:invalid>
	<input
		{id}
		class="real"
		type="text"
		{value}
		{oninput}
		onfocus={() => (focused = true)}
		onblur={() => {
			focused = false;
			onblur?.();
		}}
		inputmode={value.length < 2 ? 'text' : 'numeric'}
		autocomplete="off"
		autocapitalize="characters"
		spellcheck="false"
		maxlength="6"
		aria-describedby={describedby}
		aria-invalid={invalid || undefined}
	/>
	<div class="boxes" aria-hidden="true">
		{#each boxes as ch, i (i)}
			<span
				class="box"
				class:gap={i === 2}
				class:active={focused && i === Math.min(value.length, 5)}>{ch}</span
			>
		{/each}
	</div>
	<span class="vt-visually-hidden">{t('code.hint')}</span>
</div>

<style>
	.code {
		position: relative;
		width: fit-content;
	}
	.real {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		font-size: 16px; /* prevents iOS zoom */
		caret-color: transparent;
		z-index: 1;
	}
	.boxes {
		display: flex;
		gap: var(--vt-s-8);
	}
	.box {
		display: grid;
		place-items: center;
		width: 44px;
		height: 56px;
		border: 2px solid var(--vt-line-strong);
		border-radius: var(--vt-radius);
		background: var(--vt-paper);
		font-family: var(--vt-font-mono);
		font-size: var(--vt-fs-28);
		font-weight: 700;
	}
	.box.gap {
		margin-left: var(--vt-s-8);
	}
	.focused .box.active {
		border-color: var(--vt-thread);
		box-shadow: 0 0 0 3px var(--vt-focus);
	}
	.invalid .box {
		border-color: var(--vt-fail);
	}
	@media (max-width: 380px) {
		.box {
			width: 40px;
		}
	}
</style>
