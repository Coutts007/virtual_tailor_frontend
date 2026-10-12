<script lang="ts">
	import type { Flag } from '$lib/api/types';
	import { t } from '$lib/i18n/t.svelte';
	import Icon from './Icon.svelte';

	/** Flags are never colour-only: icon + word + colour, reason on the next line. */
	let { flag, reason, size = 'md' }: { flag: Flag; reason?: string; size?: 'sm' | 'md' } = $props();
	const icon = $derived(flag === 'pass' ? 'check' : flag === 'check' ? 'triangle' : 'x');
</script>

<span class="flag {flag} {size}">
	<span class="badge">
		<Icon name={icon} size={size === 'sm' ? 14 : 16} stroke={2.6} />
		<span class="word">{t(`flag.${flag}`)}</span>
	</span>
	{#if reason}<span class="reason">{reason}</span>{/if}
</span>

<style>
	.flag {
		display: inline-grid;
		gap: 2px;
		justify-items: start;
	}
	.badge {
		display: inline-flex;
		max-width: 100%;
		align-items: center;
		gap: 4px;
		padding: 2px 8px 2px 6px;
		border-radius: 999px;
		font-weight: 700;
		font-size: var(--vt-fs-14);
		line-height: 1.4;
		border: 1.5px solid currentColor;
	}
	.sm .badge {
		font-size: 0.8125rem;
		padding: 0 6px 0 4px;
		border-radius: 10px;
	}
	.pass .badge {
		color: var(--vt-pass);
		background: var(--vt-pass-fill);
	}
	.check .badge {
		color: var(--vt-check-ink);
		background: var(--vt-check-fill);
		border-color: var(--vt-check);
	}
	.check .badge :global(.icon) {
		color: var(--vt-check);
	}
	.fail .badge {
		color: var(--vt-fail);
		background: var(--vt-fail-fill);
	}
	.word {
		min-width: 0;
	}
	.reason {
		font-size: var(--vt-fs-14);
		color: var(--vt-ink-muted);
	}
</style>
