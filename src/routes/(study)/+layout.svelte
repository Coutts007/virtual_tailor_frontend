<script lang="ts">
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { session } from '$lib/auth/session.svelte';

	let { children }: { children: Snippet } = $props();

	$effect(() => {
		if (!session.user && session.ended === 'expired') {
			const next = encodeURIComponent(page.url.pathname + page.url.search);
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved path plus a query
			void goto(`${resolve('/login')}?next=${next}`);
		}
	});
</script>

{@render children()}
