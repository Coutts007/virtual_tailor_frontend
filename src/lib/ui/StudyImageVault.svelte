<script lang="ts">
	import { t } from '$lib/i18n/t.svelte';
	import { downloadBlob } from '$lib/dashboard/format';
	import {
		saveVault,
		validatePassphrase,
		vaultEnabled,
		VaultDisabledError,
		type VaultFrame,
		type VaultMeta
	} from '$lib/study/imageVault';
	import Banner from './Banner.svelte';
	import Button from './Button.svelte';
	import Checkbox from './Checkbox.svelte';
	import Field from './Field.svelte';
	import PasswordInput from './PasswordInput.svelte';

	/**
	 * Study image vault panel (Section 15.6). The capture flow passes the frames
	 * (released right after). With the feature flag off it only explains why
	 * saving is disabled.
	 */
	let {
		frames = [],
		meta = null,
		onsaved
	}: { frames?: VaultFrame[]; meta?: VaultMeta | null; onsaved?: () => void } = $props();

	const enabled = vaultEnabled();
	let consent = $state(false);
	let passphrase = $state('');
	let tried = $state(false);
	let busy = $state(false);
	let message = $state<string | null>(null);

	async function save() {
		tried = true;
		message = null;
		if (!enabled) return void (message = t('study.vault.disabled'));
		if (!consent || !validatePassphrase(passphrase) || !meta || !frames.length) return;
		busy = true;
		try {
			const { blob, filename } = await saveVault(frames, meta, passphrase);
			downloadBlob(blob, filename);
			passphrase = '';
			onsaved?.();
		} catch (e) {
			message =
				e instanceof VaultDisabledError ? t('study.vault.disabled') : t('error.generic.body');
		} finally {
			busy = false;
		}
	}
</script>

<section class="vault" aria-labelledby="vault-h">
	<h2 id="vault-h">{t('study.vault.title')}</h2>
	{#if !enabled}
		<Banner tone="warning" live="off">{t('study.vault.disabled')}</Banner>
		<p class="vt-small vt-muted">{t('study.vault.disabledHint')}</p>
	{:else}
		<p class="vt-small">{t('study.vault.explain')}</p>
		<Checkbox bind:checked={consent}>{t('study.vault.consent')}</Checkbox>
		<Field
			label={t('study.vault.passphrase')}
			hint={t('study.vault.passphraseHint')}
			error={tried && !validatePassphrase(passphrase) ? t('study.vault.passphraseShort') : null}
		>
			{#snippet children({ id, describedby, invalid })}
				<PasswordInput
					{id}
					{describedby}
					{invalid}
					bind:value={passphrase}
					autocomplete="new-password"
				/>
			{/snippet}
		</Field>
	{/if}
	<Button
		variant="secondary"
		icon="download"
		loading={busy}
		disabled={!enabled || !frames.length}
		onclick={save}>{t('study.vault.save')}</Button
	>
	{#if message}<p class="vt-small" role="status">{message}</p>{/if}
</section>

<style>
	.vault {
		display: grid;
		gap: var(--vt-s-12);
		justify-items: start;
		padding: var(--vt-s-16);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius-lg);
	}
</style>
