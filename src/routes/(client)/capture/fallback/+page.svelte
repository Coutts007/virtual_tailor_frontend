<script lang="ts">
	import { t } from '$lib/i18n/t.svelte';
	import ClientHeader from '$lib/client/ClientHeader.svelte';
	import Page from '$lib/client/Page.svelte';

	/** File-input fallback (10.1.7), assisted mode only. Completed in Phase 3. */
</script>

<svelte:head><title>{t('fallback.title')} · {t('app.name')}</title></svelte:head>
<ClientHeader title={t('fallback.title')} back="/setup" />
<Page><p>{t('fallback.body')}</p></Page>
