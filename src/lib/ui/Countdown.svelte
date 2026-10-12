<script lang="ts">
	import { t } from '$lib/i18n/t.svelte';

	/** Huge numerals readable from 2.5 m (≥ 160 px, Section 8.3). */
	let { n }: { n: number } = $props();
</script>

<div class="countdown" role="timer" aria-live="assertive" aria-label={t('countdown.label', { n })}>
	{#key n}
		<span class="numeral vt-num" aria-hidden="true">{n}</span>
	{/key}
</div>

<style>
	.countdown {
		display: grid;
		place-items: center;
	}
	.numeral {
		font-size: var(--vt-fs-countdown);
		font-weight: 900;
		line-height: 1;
		color: #fff;
		text-shadow: 0 4px 24px rgb(0 0 0 / 0.6);
		animation: pop 0.9s ease-out;
	}
	@keyframes pop {
		from {
			transform: scale(1.35);
			opacity: 0.3;
		}
	}
</style>
