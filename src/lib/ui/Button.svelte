<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Icon, { type IconName } from './Icon.svelte';
	import { t } from '$lib/i18n/t.svelte';

	type Props = HTMLButtonAttributes & {
		variant?: 'primary' | 'secondary' | 'text' | 'danger';
		size?: 'md' | 'lg';
		loading?: boolean;
		full?: boolean;
		icon?: IconName;
		href?: string;
		children: Snippet;
	};
	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		full = false,
		icon,
		href,
		type = 'button',
		disabled,
		children,
		...rest
	}: Props = $props();
</script>

{#if href && !disabled}
	<!-- Callers pass a path already built with resolve(). -->
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<a class="btn {variant} {size}" class:full {href}>
		{#if icon}<Icon name={icon} size={20} />{/if}
		<span>{@render children()}</span>
	</a>
{:else}
	<button
		class="btn {variant} {size}"
		class:full
		{type}
		disabled={disabled || loading}
		aria-busy={loading || undefined}
		{...rest}
	>
		{#if loading}
			<span class="spinner" aria-hidden="true"></span>
			<span class="vt-visually-hidden">{t('common.loading')}</span>
		{:else if icon}
			<Icon name={icon} size={20} />
		{/if}
		<span>{@render children()}</span>
	</button>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--vt-s-8);
		min-height: var(--vt-target);
		min-width: var(--vt-target);
		padding: 0 var(--vt-s-24);
		border: 2px solid transparent;
		border-radius: var(--vt-radius);
		font-weight: 700;
		font-size: var(--vt-fs-16);
		line-height: 1.2;
		text-decoration: none;
		cursor: pointer;
		transition:
			background var(--vt-duration),
			border-color var(--vt-duration);
	}
	.lg {
		min-height: 56px;
		font-size: var(--vt-fs-18);
	}
	.full {
		width: 100%;
	}
	.primary {
		background: var(--vt-thread);
		color: var(--vt-thread-ink);
	}
	.primary:hover:not(:disabled) {
		background: var(--vt-thread-hover);
	}
	.secondary {
		background: var(--vt-paper);
		color: var(--vt-thread);
		border-color: var(--vt-thread);
	}
	.text {
		background: transparent;
		color: var(--vt-thread);
		padding: 0 var(--vt-s-12);
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
	.danger {
		background: var(--vt-fail);
		color: #fff;
	}
	.btn:disabled {
		cursor: not-allowed;
		background: var(--vt-line);
		color: var(--vt-ink-muted);
		border-color: transparent;
	}
	.text:disabled {
		background: transparent;
	}
	.spinner {
		width: 18px;
		height: 18px;
		border: 3px solid currentColor;
		border-right-color: transparent;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
