<script lang="ts">
	import { dev } from '$app/environment';
</script>

<!-- Dev-only page: the import is dead code in production builds and is dropped (Section 18). -->
{#if dev}
	{#await import('$lib/dev/CaptureTuning.svelte') then m}
		<m.default />
	{/await}
{/if}
