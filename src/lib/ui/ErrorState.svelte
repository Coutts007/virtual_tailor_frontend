<script lang="ts">
	import { t } from '$lib/i18n/t.svelte';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';

	let {
		title = t('error.load'),
		body,
		onretry
	}: { title?: string; body?: string; onretry?: () => void } = $props();
</script>

<div class="err" role="alert">
	<span class="art"><Icon name="alert" size={36} stroke={1.8} /></span>
	<h2>{title}</h2>
	{#if body}<p>{body}</p>{/if}
	{#if onretry}<Button variant="secondary" icon="chevron-right" onclick={onretry}
			>{t('common.retry')}</Button
		>{/if}
</div>

<style>
	.err {
		display: grid;
		justify-items: center;
		text-align: center;
		gap: var(--vt-s-8);
		padding: var(--vt-s-32) var(--vt-s-16);
	}
	.art {
		display: grid;
		place-items: center;
		width: 72px;
		height: 72px;
		border-radius: 50%;
		background: var(--vt-fail-fill);
		color: var(--vt-fail);
	}
	h2 {
		font-size: var(--vt-fs-18);
		margin: var(--vt-s-8) 0 0;
	}
	p {
		color: var(--vt-ink-muted);
	}
</style>
