<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Forbidden from '$lib/ui/Forbidden.svelte';
</script>

<main id="main"><Forbidden status={page.status} home={resolve('/admin/accounts')} /></main>
