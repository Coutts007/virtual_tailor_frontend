<script lang="ts">
	import { resolve } from '$app/paths';
	import { api } from '$lib/api';
	import type { IssueCodeResponse } from '$lib/api/types';
	import { problemKey } from '$lib/dashboard/errors';
	import { network } from '$lib/device/network.svelte';
	import { cmToMm } from '$lib/domain/units';
	import { validateHeightCm } from '$lib/domain/validate';
	import { t } from '$lib/i18n/t.svelte';
	import type { MessageKey } from '$lib/i18n/en';
	import Banner from '$lib/ui/Banner.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Field from '$lib/ui/Field.svelte';
	import NumberInput from '$lib/ui/NumberInput.svelte';
	import ShareCodeCard from '$lib/ui/ShareCodeCard.svelte';

	let name = $state('');
	let height = $state<number | null>(null);
	let submitted = $state(false);
	let busy = $state(false);
	let errorKey = $state<MessageKey | null>(null);
	let issued = $state<(IssueCodeResponse & { name: string | null }) | null>(null);

	const heightErr = $derived(
		submitted && height != null && validateHeightCm(height) ? t('validate.height') : null
	);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		submitted = true;
		if (heightErr) return;
		busy = true;
		errorKey = null;
		try {
			const r = await api().issueClientCode({
				display_name: name.trim() || undefined,
				height_mm: height == null ? undefined : cmToMm(height)
			});
			issued = { ...r, name: name.trim() || null };
		} catch (err) {
			errorKey = problemKey(err);
		} finally {
			busy = false;
		}
	}

	function another() {
		issued = null;
		name = '';
		height = null;
		submitted = false;
	}
</script>

<svelte:head><title>{t('tailor.issue.title')} · {t('app.name')}</title></svelte:head>

<a class="back" href={resolve('/t/clients')}>‹ {t('tailor.clients.title')}</a>
<h1>{t('tailor.issue.title')}</h1>

{#if issued}
	<ShareCodeCard code={issued.client_code} link={issued.deep_link} displayName={issued.name} />
	<div class="after">
		<Button
			variant="secondary"
			href={resolve('/(tailor)/t/clients/[clientId]', { clientId: issued.client_id })}
			>{t('tailor.issue.openClient')}</Button
		>
		<Button variant="text" onclick={another}>{t('tailor.issue.another')}</Button>
	</div>
{:else}
	<p class="vt-muted">{t('tailor.issue.intro')}</p>
	{#if errorKey}<Banner tone="danger">{t(errorKey)}</Banner>{/if}
	<form class="card" novalidate onsubmit={submit}>
		<Field label={t('tailor.issue.name')} hint={t('tailor.issue.nameHint')} optional>
			{#snippet children({ id, describedby })}
				<input
					{id}
					class="vt-input"
					bind:value={name}
					maxlength="60"
					autocomplete="off"
					aria-describedby={describedby}
				/>
			{/snippet}
		</Field>
		<Field
			label={t('tailor.issue.height')}
			hint={t('tailor.issue.heightHint')}
			error={heightErr}
			optional
		>
			{#snippet children({ id, describedby, invalid })}
				<NumberInput {id} {describedby} {invalid} bind:value={height} unit={t('unit.cm')} />
			{/snippet}
		</Field>
		<Button type="submit" size="lg" loading={busy} disabled={!network.online}
			>{t('tailor.issue.submit')}</Button
		>
	</form>
{/if}

<style>
	.back {
		display: inline-flex;
		align-items: center;
		min-height: var(--vt-target);
		font-weight: 600;
	}
	.card {
		padding: var(--vt-s-24) var(--vt-s-16);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius-lg);
		max-width: 36rem;
	}
	.after {
		display: flex;
		flex-wrap: wrap;
		gap: var(--vt-s-8);
		margin-top: var(--vt-s-16);
	}
</style>
