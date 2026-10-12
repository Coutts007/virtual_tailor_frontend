<script lang="ts">
	import { locale, setLang, t, type Lang } from '$lib/i18n/t.svelte';

	let { tone = 'default' }: { tone?: 'default' | 'onDark' } = $props();
	const options: {
		lang: Lang;
		label: 'lang.enShort' | 'lang.swShort';
		full: 'lang.en' | 'lang.sw';
	}[] = [
		{ lang: 'en', label: 'lang.enShort', full: 'lang.en' },
		{ lang: 'sw', label: 'lang.swShort', full: 'lang.sw' }
	];
</script>

<div class="toggle" class:onDark={tone === 'onDark'} role="group" aria-label={t('lang.label')}>
	{#each options as o (o.lang)}
		<button
			type="button"
			lang={o.lang}
			aria-pressed={locale.lang === o.lang}
			aria-label={t(o.full)}
			onclick={() => setLang(o.lang)}>{t(o.label)}</button
		>
	{/each}
</div>

<style>
	.toggle {
		display: inline-flex;
		border: 2px solid var(--vt-thread);
		border-radius: 999px;
		padding: 2px;
		gap: 2px;
		background: var(--vt-paper);
	}
	button {
		min-width: var(--vt-target);
		min-height: 40px;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: var(--vt-thread);
		font-weight: 700;
		font-size: var(--vt-fs-14);
		letter-spacing: 0.04em;
		cursor: pointer;
	}
	button[aria-pressed='true'] {
		background: var(--vt-thread);
		color: var(--vt-thread-ink);
	}
	.onDark {
		background: rgb(0 0 0 / 0.5);
		border-color: #fff;
	}
	.onDark button {
		color: #fff;
	}
	.onDark button[aria-pressed='true'] {
		background: #fff;
		color: #0e0e10;
	}
</style>
