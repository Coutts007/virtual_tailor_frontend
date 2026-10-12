<script lang="ts">
	import { formatDate, t } from '$lib/i18n/t.svelte';

	/** "Last updated 10:42" note shown with dashboard data (online-first, Section 13). */
	let { at }: { at: Date | null } = $props();
</script>

{#if at}
	<p class="lu vt-small vt-muted" aria-live="polite">
		{t('common.lastUpdated', { time: formatDate(at, { timeStyle: 'short' }) })}
	</p>
{/if}

<style>
	.lu {
		margin: 0;
	}
</style>
