<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { formatDateTime, t } from '$lib/i18n/t.svelte';
	import { deleteMyData, getProfile } from '$lib/db/profiles';
	import type { LocalProfile } from '$lib/db/dexie';
	import type { CheckState } from '$lib/api/types';
	import { syncNow } from '$lib/client/syncState.svelte';
	import ClientHeader from '$lib/client/ClientHeader.svelte';
	import Page from '$lib/client/Page.svelte';
	import ResultsView from '$lib/client/ResultsView.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import Icon from '$lib/ui/Icon.svelte';
	import SyncBadge from '$lib/ui/SyncBadge.svelte';
	import { toast } from '$lib/ui/toast.svelte';

	/** One saved profile, read-only, with delete / withdraw consent (9.12, decision 3). */
	let profile = $state<LocalProfile | null | undefined>(undefined);
	let action = $state<'delete' | 'withdraw_consent' | null>(null);
	let confirmStep = $state<0 | 1 | 2>(0);

	onMount(async () => {
		profile = (await getProfile(page.params.profileId!)) ?? null;
	});

	function ask(a: 'delete' | 'withdraw_consent') {
		action = a;
		confirmStep = 1;
	}

	async function finish() {
		if (!profile || !action) return;
		await deleteMyData([profile.profile_id], action);
		confirmStep = 0;
		toast(t('me.deleted'), { tone: 'success' });
		void syncNow();
		await goto(resolve('/me'), { replaceState: true });
	}

	const CHECKS = ['level', 'frame', 'distance', 'symmetry', 'arms', 'marker', 'light'] as const;
	const stateOf = (front: CheckState, side: CheckState): CheckState =>
		front === 'fail' || side === 'fail'
			? 'fail'
			: front === 'skipped' || side === 'skipped'
				? 'skipped'
				: 'pass';
</script>

<svelte:head><title>{t('me.title')} · {t('app.name')}</title></svelte:head>

<ClientHeader title={t('me.title')} back="/me" />

<Page>
	{#if profile === null}
		<EmptyState title={t('me.notFound')} icon="info" />
	{:else if profile}
		<p class="meta">
			<span class="vt-mono code">{profile.client_code}</span>
			<span>{formatDateTime(profile.captured_at)} · {t('me.version', { v: profile.version })}</span>
			<SyncBadge status={profile.sync_status} />
		</p>
		<ResultsView
			measurements={profile.measurements}
			sex={profile.covariates.sex}
			session={profile.session}
		/>

		<section aria-labelledby="chk-h">
			<h2 id="chk-h">{t('me.checks')}</h2>
			<ul class="checks">
				{#each CHECKS as c (c)}
					{@const s = stateOf(profile.session.front_checks[c], profile.session.side_checks[c])}
					<li class={s}>
						<Icon
							name={s === 'pass' ? 'check' : s === 'fail' ? 'x' : 'circle'}
							size={18}
							stroke={3}
						/>
						{t(`check.${c}`)}: {s === 'skipped' ? t('me.check.skipped') : t(`check.state.${s}`)}
					</li>
				{/each}
				<li>{t('me.scale', { pct: profile.session.scale_disagreement_pct.toFixed(1) })}</li>
			</ul>
		</section>

		<section class="danger">
			<p>{t('me.deleteBody')}</p>
			<Button variant="danger" onclick={() => ask('delete')}>{t('me.delete')}</Button>
			<p>{t('me.withdrawBody')}</p>
			<Button variant="secondary" onclick={() => ask('withdraw_consent')}>{t('me.withdraw')}</Button
			>
		</section>
	{/if}
</Page>

<Dialog
	open={confirmStep === 1}
	title={action === 'delete' ? t('me.delete') : t('me.withdraw')}
	onclose={() => confirmStep === 1 && (confirmStep = 0)}
>
	<p>{action === 'delete' ? t('me.deleteBody') : t('me.withdrawBody')}</p>
	{#snippet actions()}
		<Button variant="text" onclick={() => (confirmStep = 0)}>{t('common.cancel')}</Button>
		<Button variant="danger" onclick={() => (confirmStep = 2)}
			>{action === 'delete' ? t('me.deleteYes') : t('me.withdrawYes')}</Button
		>
	{/snippet}
</Dialog>
<Dialog
	open={confirmStep === 2}
	title={t('me.confirmTitle')}
	onclose={() => confirmStep === 2 && (confirmStep = 0)}
>
	<p>{t('me.confirmBody')}</p>
	{#snippet actions()}
		<Button variant="text" onclick={() => (confirmStep = 0)}>{t('common.cancel')}</Button>
		<Button variant="danger" onclick={finish}>{t('me.deleteFinal')}</Button>
	{/snippet}
</Dialog>

<style>
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--vt-s-8);
		align-items: center;
	}
	.code {
		font-weight: 700;
		font-size: var(--vt-fs-18);
	}
	h2 {
		font-size: var(--vt-fs-18);
		margin-top: var(--vt-s-24);
	}
	.checks {
		list-style: none;
		padding: 0;
		display: grid;
		gap: var(--vt-s-4);
	}
	.checks li {
		display: flex;
		gap: var(--vt-s-8);
		align-items: center;
	}
	.checks .pass :global(.icon) {
		color: var(--vt-pass);
	}
	.checks .fail :global(.icon) {
		color: var(--vt-fail);
	}
	.danger {
		margin-top: var(--vt-s-32);
		padding-top: var(--vt-s-16);
		border-top: 1px solid var(--vt-line);
		display: grid;
		gap: var(--vt-s-8);
		justify-items: start;
	}
	.danger p {
		margin: var(--vt-s-8) 0 0;
	}
</style>
