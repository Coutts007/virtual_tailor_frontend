<script lang="ts">
	import { t } from '$lib/i18n/t.svelte';
	import { passwordStrength } from '$lib/domain/validate';
	import Icon from './Icon.svelte';

	let {
		value = $bindable(''),
		id,
		describedby,
		invalid = false,
		autocomplete = 'current-password',
		meter = false
	}: {
		value?: string;
		id?: string;
		describedby?: string;
		invalid?: boolean;
		autocomplete?: 'current-password' | 'new-password';
		meter?: boolean;
	} = $props();

	let visible = $state(false);
	const strength = $derived(passwordStrength(value));
</script>

<div class="pw">
	<input
		{id}
		class="vt-input"
		type={visible ? 'text' : 'password'}
		bind:value
		{autocomplete}
		aria-describedby={describedby}
		aria-invalid={invalid || undefined}
		spellcheck="false"
	/>
	<button
		type="button"
		class="toggle"
		aria-pressed={visible}
		aria-label={visible ? t('password.hide') : t('password.show')}
		onclick={() => (visible = !visible)}
	>
		<Icon name={visible ? 'eye-off' : 'eye'} />
	</button>
</div>
{#if meter}
	<div class="meter" aria-live="polite">
		<div class="bars" aria-hidden="true">
			{#each [1, 2, 3, 4] as n (n)}
				<span class:on={strength >= n} data-level={strength}></span>
			{/each}
		</div>
		<span class="vt-small"
			>{t('password.strength', { level: t(`password.strength.${strength}`) })}</span
		>
	</div>
{/if}

<style>
	.pw {
		position: relative;
	}
	.pw input {
		padding-right: 3.5rem !important;
	}
	.toggle {
		position: absolute;
		right: 0;
		top: 0;
		width: var(--vt-target);
		height: 100%;
		border: 0;
		background: transparent;
		color: var(--vt-ink-muted);
		cursor: pointer;
	}
	.meter {
		display: flex;
		align-items: center;
		gap: var(--vt-s-8);
	}
	.bars {
		display: flex;
		gap: 4px;
	}
	.bars span {
		width: 32px;
		height: 6px;
		border-radius: 3px;
		background: var(--vt-line);
	}
	.bars span.on[data-level='1'] {
		background: var(--vt-fail);
	}
	.bars span.on[data-level='2'] {
		background: var(--vt-check);
	}
	.bars span.on[data-level='3'],
	.bars span.on[data-level='4'] {
		background: var(--vt-pass);
	}
</style>
