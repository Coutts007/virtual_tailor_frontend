<script lang="ts">
	import { onDestroy } from 'svelte';
	import { locale, t } from '$lib/i18n/t.svelte';
	import { PROTOCOL } from '$lib/i18n/protocol';
	import { speak, unlockAudio } from '$lib/capture/audio';
	import ClientHeader from '$lib/client/ClientHeader.svelte';
	import Page from '$lib/client/Page.svelte';
	import ProtocolArt from '$lib/client/ProtocolArt.svelte';
	import Button from '$lib/ui/Button.svelte';

	/** Help = the Appendix B protocol card (9.13). Works offline. */
	const doc = $derived(PROTOCOL[locale.lang]);
	let playing = $state(false);

	async function play() {
		if (playing) {
			globalThis.speechSynthesis?.cancel();
			playing = false;
			return;
		}
		await unlockAudio();
		playing = true;
		const text = doc.sections.map((s) => `${s.heading}. ${s.steps.join(' ')}`).join(' ');
		speak(text, locale.lang, { force: true });
		const check = setInterval(() => {
			if (!globalThis.speechSynthesis?.speaking) {
				playing = false;
				clearInterval(check);
			}
		}, 500);
	}
	onDestroy(() => globalThis.speechSynthesis?.cancel());
</script>

<svelte:head><title>{doc.title} · {t('app.name')}</title></svelte:head>

<ClientHeader title={doc.title} back="/" />

<Page>
	<Button variant="secondary" icon={playing ? 'mute' : 'sound'} onclick={play}
		>{playing ? t('help.stop') : t('help.play')}</Button
	>
	<ol class="sections">
		{#each doc.sections as s (s.heading)}
			<li>
				<ProtocolArt art={s.art} size={72} />
				<div>
					<h2>{s.heading}</h2>
					<ul>
						{#each s.steps as step, i (i)}<li>{step}</li>{/each}
					</ul>
				</div>
			</li>
		{/each}
	</ol>
</Page>

<style>
	.sections {
		list-style: none;
		padding: 0;
		margin: var(--vt-s-16) 0 0;
		display: grid;
		gap: var(--vt-s-16);
	}
	.sections > li {
		display: grid;
		grid-template-columns: 72px 1fr;
		gap: var(--vt-s-12);
		padding: var(--vt-s-16);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius);
	}
	h2 {
		font-size: var(--vt-fs-18);
		margin: 0 0 var(--vt-s-8);
	}
	ul {
		margin: 0;
		padding-left: 1.1rem;
		display: grid;
		gap: var(--vt-s-4);
	}
</style>
