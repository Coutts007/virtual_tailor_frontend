<script lang="ts">
	import { locale, setLang, t, type Lang } from '$lib/i18n/t.svelte';
	import LangToggle from '$lib/ui/LangToggle.svelte';

	function choose(lang: Lang) {
		setLang(lang);
	}
</script>

<svelte:head><title>{t('app.name')}</title></svelte:head>

<header class="top">
	<span class="mark" aria-hidden="true">VT</span>
	<LangToggle />
</header>

<main id="main" class="wrap">
	<h1 class="wordmark">{t('app.name')}</h1>
	<p class="promise">{t('app.tagline')} {t('app.privacyLine')}</p>

	<h2 class="choose">{t('welcome.chooseLanguage')}</h2>
	<div class="cards">
		<button
			type="button"
			class="card"
			lang="en"
			aria-pressed={locale.lang === 'en'}
			onclick={() => choose('en')}
		>
			{t('lang.en')}
		</button>
		<button
			type="button"
			class="card"
			lang="sw"
			aria-pressed={locale.lang === 'sw'}
			onclick={() => choose('sw')}
		>
			{t('lang.sw')}
		</button>
	</div>

	<p class="vt-muted vt-small note">{t('welcome.phase0Note')}</p>
</main>

<style>
	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: calc(var(--vt-s-12) + var(--vt-safe-top)) var(--vt-s-16) var(--vt-s-12);
	}
	.mark {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 10px;
		background: var(--vt-thread);
		color: var(--vt-thread-ink);
		font-weight: 800;
	}
	.wrap {
		max-width: 32rem;
		margin: 0 auto;
		padding: var(--vt-s-24) var(--vt-s-16) var(--vt-s-48);
	}
	.wordmark {
		font-size: var(--vt-fs-36);
		letter-spacing: -0.01em;
	}
	.promise {
		font-size: var(--vt-fs-18);
	}
	.choose {
		margin-top: var(--vt-s-32);
	}
	.cards {
		display: grid;
		gap: var(--vt-s-12);
	}
	.card {
		min-height: 72px;
		border: 2px solid var(--vt-line);
		border-radius: var(--vt-radius-lg);
		background: var(--vt-paper);
		font-size: var(--vt-fs-22);
		font-weight: 700;
		text-align: left;
		padding: 0 var(--vt-s-24);
		cursor: pointer;
		box-shadow: var(--vt-shadow);
	}
	.card[aria-pressed='true'] {
		border-color: var(--vt-thread);
		background: var(--vt-thread-tint);
	}
	.note {
		margin-top: var(--vt-s-32);
	}
</style>
