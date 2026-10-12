<script lang="ts">
	import { t } from '$lib/i18n/t.svelte';

	let { lines = 3, height = 16 }: { lines?: number; height?: number } = $props();
</script>

<div class="sk" aria-busy="true" role="status">
	<span class="vt-visually-hidden">{t('common.loading')}</span>
	{#each Array.from({ length: lines }, (_, i) => i) as i (i)}
		<span class="line" style:height="{height}px" style:width="{i === lines - 1 ? 60 : 100}%"></span>
	{/each}
</div>

<style>
	.sk {
		display: grid;
		gap: var(--vt-s-8);
	}
	.line {
		display: block;
		border-radius: 6px;
		background: linear-gradient(90deg, var(--vt-line) 0%, var(--vt-chalk) 50%, var(--vt-line) 100%);
		background-size: 200% 100%;
		animation: shimmer 1.4s linear infinite;
	}
	@keyframes shimmer {
		to {
			background-position: -200% 0;
		}
	}
</style>
