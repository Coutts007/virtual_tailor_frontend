<script lang="ts">
	import { t } from '$lib/i18n/t.svelte';

	export type StepKey = 'details' | 'consent' | 'setup' | 'front' | 'side' | 'review';
	const STEPS: StepKey[] = ['details', 'consent', 'setup', 'front', 'side', 'review'];

	/** Client flow: Details › Consent › Setup › Front › Side › Review (Section 8.4). */
	let { current }: { current: StepKey } = $props();
	const idx = $derived(STEPS.indexOf(current));
</script>

<nav class="steps" aria-label={t('steps.label')}>
	<p class="vt-visually-hidden">
		{t('steps.current', { n: idx + 1, total: STEPS.length, name: t(`steps.${current}`) })}
	</p>
	<ol aria-hidden="true">
		{#each STEPS as s, i (s)}
			<li class:done={i < idx} class:now={i === idx}>
				<span class="bar"></span>
				<span class="name">{t(`steps.${s}`)}</span>
			</li>
		{/each}
	</ol>
</nav>

<style>
	ol {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 4px;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li {
		display: grid;
		gap: 4px;
		font-size: 0.75rem;
		color: var(--vt-ink-muted);
		min-width: 0;
	}
	.bar {
		height: 6px;
		border-radius: 3px;
		background: var(--vt-line);
	}
	.done .bar {
		background: var(--vt-thread);
	}
	.now .bar {
		background: var(--vt-kitenge);
	}
	.now {
		color: var(--vt-ink);
		font-weight: 700;
	}
	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	@media (max-width: 360px) {
		.name {
			display: none;
		}
		.now .name {
			display: block;
			overflow: visible;
		}
	}
</style>
