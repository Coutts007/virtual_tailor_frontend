<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon, { type IconName } from './Icon.svelte';

	let {
		title,
		body,
		icon = 'info',
		action
	}: { title: string; body?: string; icon?: IconName; action?: Snippet } = $props();
</script>

<div class="empty">
	<span class="art"><Icon name={icon} size={40} stroke={1.6} /></span>
	<h2>{title}</h2>
	{#if body}<p>{body}</p>{/if}
	{#if action}<div class="act">{@render action()}</div>{/if}
</div>

<style>
	.empty {
		display: grid;
		justify-items: center;
		text-align: center;
		gap: var(--vt-s-8);
		padding: var(--vt-s-48) var(--vt-s-16);
	}
	.art {
		display: grid;
		place-items: center;
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: var(--vt-thread-tint);
		color: var(--vt-thread);
	}
	h2 {
		font-size: var(--vt-fs-18);
		margin: var(--vt-s-8) 0 0;
	}
	p {
		color: var(--vt-ink-muted);
		max-width: 28rem;
	}
	.act {
		margin-top: var(--vt-s-8);
	}
</style>
