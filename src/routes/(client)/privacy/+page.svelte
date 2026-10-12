<script lang="ts">
	import { locale, t } from '$lib/i18n/t.svelte';
	import { CONSENT, CONSENT_VERSION } from '$lib/i18n/consent';
	import ClientHeader from '$lib/client/ClientHeader.svelte';
	import ConsentText from '$lib/client/ConsentText.svelte';
	import Page from '$lib/client/Page.svelte';

	/** Privacy and your rights (9.13): full consent text, what is stored where, DPA rights. */
	const doc = $derived(CONSENT[locale.lang]);
</script>

<svelte:head><title>{t('privacy.title')} · {t('app.name')}</title></svelte:head>

<ClientHeader title={t('privacy.title')} back="/" />

<Page>
	<p class="vt-small vt-muted">
		{t('consent.version', {
			version: CONSENT_VERSION,
			language: t(locale.lang === 'sw' ? 'lang.sw' : 'lang.en')
		})}
	</p>
	<ConsentText {doc} table />
</Page>
