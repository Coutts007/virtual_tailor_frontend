<script lang="ts">
	import type { Snippet } from 'svelte';
	import { t } from '$lib/i18n/t.svelte';
	import LangToggle from '$lib/ui/LangToggle.svelte';

	let { children }: { children: Snippet } = $props();
</script>

<header class="top">
	<span class="brand"><span class="mark" aria-hidden="true">VT</span>{t('app.name')}</span>
	<LangToggle />
</header>
<main id="main" class="wrap">
	{@render children()}
</main>

<style>
	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: calc(var(--vt-s-12) + var(--vt-safe-top)) var(--vt-s-16) var(--vt-s-12);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: var(--vt-s-8);
		font-weight: 800;
	}
	.mark {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 10px;
		background: var(--vt-thread);
		color: var(--vt-thread-ink);
	}
	.wrap {
		max-width: 28rem;
		margin: 0 auto;
		padding: var(--vt-s-16) var(--vt-s-16) var(--vt-s-48);
	}
</style>
