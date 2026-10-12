<script lang="ts">
	import { t } from '$lib/i18n/t.svelte';
	import Icon from './Icon.svelte';

	export type CheckKey = 'level' | 'frame' | 'distance' | 'symmetry' | 'arms' | 'marker' | 'light';
	export type RowState = 'pass' | 'fail' | 'pending';

	/** The seven capture rows (Section 9.7 item 3). States are icon + word + colour. */
	let {
		states,
		tone = 'onDark'
	}: { states: Partial<Record<CheckKey, RowState>>; tone?: 'onDark' | 'onLight' } = $props();
	const ORDER: CheckKey[] = ['level', 'frame', 'distance', 'symmetry', 'arms', 'marker', 'light'];
</script>

<ul class="checks {tone}" aria-label={t('check.listLabel')}>
	{#each ORDER as key (key)}
		{@const s = states[key] ?? 'pending'}
		<li class={s}>
			<Icon name={s === 'pass' ? 'check' : s === 'fail' ? 'x' : 'circle'} size={20} stroke={3} />
			<span class="name">{t(`check.${key}`)}</span>
			<span class="vt-visually-hidden">: {t(`check.state.${s}`)}</span>
		</li>
	{/each}
</ul>

<style>
	.checks {
		list-style: none;
		margin: 0;
		padding: var(--vt-s-8);
		display: grid;
		gap: 2px;
		border-radius: var(--vt-radius);
		font-size: var(--vt-fs-14);
		font-weight: 600;
	}
	.onDark {
		background: rgb(0 0 0 / 0.55);
		color: #fff;
	}
	.onLight {
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
	}
	li {
		display: flex;
		align-items: center;
		gap: 6px;
		min-height: 28px;
	}
	.onDark .pass :global(.icon) {
		color: var(--vt-border-ok);
	}
	.onDark .fail :global(.icon) {
		color: var(--vt-border-stop);
	}
	.onDark .pending {
		color: #c9c4bc;
	}
	.onLight .pass :global(.icon) {
		color: var(--vt-pass);
	}
	.onLight .fail :global(.icon) {
		color: var(--vt-fail);
	}
	.onLight .pending {
		color: var(--vt-ink-muted);
	}
</style>
