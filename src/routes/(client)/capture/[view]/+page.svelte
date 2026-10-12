<script lang="ts">
	import { t } from '$lib/i18n/t.svelte';
	import CaptureScreen from '$lib/client/CaptureScreen.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title
		>{t(data.view === 'front' ? 'capture.front.title' : 'capture.side.title')} · {t(
			'app.name'
		)}</title
	>
</svelte:head>

<!-- Keyed so front → side mounts a fresh screen (engine, timers, checks). -->
{#key data.view}
	<CaptureScreen view={data.view} />
{/key}
