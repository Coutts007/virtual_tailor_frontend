<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { formatDateTime, loadMessages, t } from '$lib/i18n/t.svelte';
	import { changeCode, clearThisPhone, getProfile } from '$lib/db/profiles';
	import type { LocalProfile } from '$lib/db/dexie';
	import { validateClientCode } from '$lib/domain/validate';
	import { capture, clearDetails } from '$lib/client/flow.svelte';
	import { install, isIos, promptInstall } from '$lib/client/install.svelte';
	import { syncNow, syncState } from '$lib/client/syncState.svelte';
	import ClientHeader from '$lib/client/ClientHeader.svelte';
	import Page from '$lib/client/Page.svelte';
	import Banner from '$lib/ui/Banner.svelte';
	import Button from '$lib/ui/Button.svelte';
	import CodeInput from '$lib/ui/CodeInput.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Icon from '$lib/ui/Icon.svelte';

	/** Saved (9.11): sync status, next steps, shared-phone clearing, install offer. */
	let profile = $state<LocalProfile | null>(null);
	let codeOpen = $state(false);
	let newCode = $state('');
	let clearOpen = $state(false);
	let cleared = $state(false);
	let ios = $state(false);
	/** Study (15.1): remembered across the save so the next-set shortcut can show. */
	const study = capture.study;

	async function reload() {
		const id = page.url.searchParams.get('id');
		profile = id ? ((await getProfile(id)) ?? null) : null;
	}

	onMount(() => {
		if (study) void loadMessages(['study']);
		ios = isIos();
		void reload();
		const timer = setInterval(reload, 2000);
		return () => clearInterval(timer);
	});
	$effect(() => {
		void syncState.lastRun;
		void reload();
	});

	const status = $derived(
		profile?.sync_note === 'invalid' ? 'invalid' : (profile?.sync_status ?? 'pending')
	);
	const waText = $derived(profile ? t('saved.waText', { code: profile.client_code }) : '');

	async function share() {
		if (navigator.share) {
			try {
				await navigator.share({ text: waText });
				return;
			} catch {
				/* cancelled */
			}
		}
		window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank', 'noopener');
	}

	async function submitCode() {
		if (!profile || validateClientCode(newCode)) return;
		await changeCode(profile.profile_id, newCode);
		codeOpen = false;
		await syncNow();
		await reload();
	}

	async function clearPhone() {
		const { kept } = await clearThisPhone();
		await clearDetails();
		clearOpen = false;
		cleared = true;
		syncState.pending = kept;
	}
</script>

<svelte:head><title>{t('saved.title')} · {t('app.name')}</title></svelte:head>

<ClientHeader title={t('saved.title')} />

<Page>
	{#if profile}
		<div class="status {status}" role="status" aria-live="polite">
			<Icon
				name={status === 'synced' || status === 'conflict'
					? 'check'
					: status === 'pending'
						? 'clock'
						: 'alert'}
				size={36}
				stroke={2.6}
			/>
			<h2>{t(`saved.${status}`)}</h2>
		</div>
		{#if status === 'rejected'}
			<Button variant="secondary" onclick={() => (codeOpen = true)}>{t('saved.changeCode')}</Button>
		{/if}
		<p class="line vt-num">
			{t('saved.codeLine', {
				code: profile.client_code,
				date: formatDateTime(profile.captured_at)
			})}
		</p>
		<p>{t('saved.next')}</p>
		<Button variant="secondary" icon="share" onclick={share}>{t('saved.whatsapp')}</Button>

		{#if !install.installed && (install.event || ios)}
			<section class="install">
				<h2>{t('saved.install')}</h2>
				{#if install.event}<Button variant="secondary" onclick={promptInstall}
						>{t('saved.installBtn')}</Button
					>
				{:else}<p>{t('saved.installIos')}</p>{/if}
			</section>
		{/if}
	{/if}

	{#if study}
		<section class="study">
			<p class="ok">
				{t('study.cap.savedStudy', { set: study.set_no, code: study.participant_code })}
			</p>
			{#if study.set_no < 3}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- query string on a resolved path -->
				<Button
					href={`${resolve('/study/capture')}?participant=${study.participant_code}&set=${study.set_no + 1}`}
				>
					{t('study.cap.nextSet', { set: study.set_no + 1, code: study.participant_code })}
				</Button>
			{:else}
				<p>{t('study.cap.allSets', { code: study.participant_code })}</p>
			{/if}
		</section>
	{/if}

	<section class="shared">
		<h2>{t('saved.shared')}</h2>
		{#if cleared}
			<p class="ok" role="status">{t('saved.cleared')}</p>
			{#if syncState.pending > 0}<Banner tone="warning"
					>{t('saved.clearWarn', { count: syncState.pending })}</Banner
				>{/if}
		{:else}
			<Button variant="secondary" onclick={() => (clearOpen = true)}>{t('saved.clear')}</Button>
		{/if}
	</section>

	{#snippet actions()}
		<Button size="lg" full href={resolve('/start')}>{t('saved.again')}</Button>
		<Button variant="text" onclick={() => goto(resolve('/'))}>{t('common.done')}</Button>
	{/snippet}
</Page>

<Dialog bind:open={codeOpen} title={t('saved.changeCode')}>
	<Field
		label={t('code.label')}
		hint={t('code.hint')}
		error={newCode.length === 6 && validateClientCode(newCode) ? t('validate.code') : null}
	>
		{#snippet children({ id, describedby, invalid })}
			<CodeInput {id} {describedby} {invalid} bind:value={newCode} />
		{/snippet}
	</Field>
	{#snippet actions()}
		<Button variant="text" onclick={() => (codeOpen = false)}>{t('common.cancel')}</Button>
		<Button disabled={!!validateClientCode(newCode)} onclick={submitCode}>{t('common.save')}</Button
		>
	{/snippet}
</Dialog>

<Dialog bind:open={clearOpen} title={t('saved.clear')}>
	{#if syncState.pending > 0}<p>{t('saved.clearWarn', { count: syncState.pending })}</p>{/if}
	{#snippet actions()}
		<Button variant="text" onclick={() => (clearOpen = false)}>{t('common.cancel')}</Button>
		<Button variant="danger" onclick={clearPhone}>{t('saved.clear')}</Button>
	{/snippet}
</Dialog>

<style>
	.status {
		display: flex;
		gap: var(--vt-s-12);
		align-items: center;
		padding: var(--vt-s-16);
		border-radius: var(--vt-radius-lg);
		margin-bottom: var(--vt-s-16);
	}
	.status h2 {
		margin: 0;
		font-size: var(--vt-fs-22);
		color: var(--vt-ink);
	}
	.synced,
	.conflict {
		background: var(--vt-pass-fill);
		color: var(--vt-pass);
	}
	.pending {
		background: var(--vt-thread-tint);
		color: var(--vt-thread);
	}
	.rejected,
	.invalid {
		background: var(--vt-fail-fill);
		color: var(--vt-fail);
	}
	.line {
		font-weight: 600;
		margin-top: var(--vt-s-16);
	}
	.install,
	.shared {
		margin-top: var(--vt-s-32);
		display: grid;
		gap: var(--vt-s-8);
		justify-items: start;
	}
	.install h2,
	.shared h2 {
		font-size: var(--vt-fs-18);
		margin: 0;
	}
	.ok {
		color: var(--vt-pass);
		font-weight: 700;
	}
</style>
