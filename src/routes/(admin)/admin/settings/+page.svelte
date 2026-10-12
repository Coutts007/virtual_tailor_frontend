<script lang="ts">
	import { api } from '$lib/api';
	import { problemKey } from '$lib/dashboard/errors';
	import { Resource } from '$lib/dashboard/resource.svelte';
	import { refreshStudyMode, studyMode } from '$lib/dashboard/studyMode.svelte';
	import { network } from '$lib/device/network.svelte';
	import { formatDateTime, t } from '$lib/i18n/t.svelte';
	import Button from '$lib/ui/Button.svelte';
	import DataTable from '$lib/ui/DataTable.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import ErrorState from '$lib/ui/ErrorState.svelte';
	import Field from '$lib/ui/Field.svelte';
	import NumberInput from '$lib/ui/NumberInput.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import { toast } from '$lib/ui/toast.svelte';

	const settings = new Resource(() => api().getAdminSettings());
	const requests = new Resource(() => api().listDeletionRequests());
	$effect(() => {
		void settings.load();
		void requests.load();
		void refreshStudyMode(true);
	});

	let retention = $state<number | null>(null);
	let retTried = $state(false);
	let busy = $state(false);
	let confirmStudy = $state(false);
	$effect(() => {
		if (settings.data && retention === null) retention = settings.data.retention_months;
	});
	const retErr = $derived(
		retTried && (retention == null || retention < 1 || retention > 120)
			? t('validate.range', { min: 1, max: 120 })
			: null
	);

	async function put(patch: { retention_months?: number; study_mode?: boolean }) {
		if (!settings.data) return;
		busy = true;
		try {
			settings.data = await api().putAdminSettings({ ...settings.data, ...patch });
			await refreshStudyMode(true);
			toast(t('admin.settings.saved'), { tone: 'success' });
		} catch (e) {
			toast(t(problemKey(e)), { tone: 'error' });
		} finally {
			busy = false;
		}
	}
	async function saveRetention(e: SubmitEvent) {
		e.preventDefault();
		retTried = true;
		if (retErr || retention == null) return;
		await put({ retention_months: retention });
	}

	const columns = $derived([
		{ key: 'received', label: t('admin.deletion.received'), primary: true },
		{ key: 'code', label: t('tailor.clients.code') },
		{ key: 'reason', label: t('admin.deletion.reason') },
		{ key: 'profiles', label: t('admin.deletion.profiles'), align: 'end' as const },
		{ key: 'status', label: t('admin.deletion.status') }
	]);
</script>

<svelte:head><title>{t('admin.settings.title')} · {t('app.name')}</title></svelte:head>

<h1>{t('admin.settings.title')}</h1>

{#if settings.loading && !settings.data}
	<Skeleton lines={6} />
{:else if settings.error && !settings.data}
	<ErrorState body={t(problemKey(settings.error))} onretry={() => settings.load()} />
{:else if settings.data}
	<div class="grid">
		<section class="panel" aria-labelledby="ret-h">
			<h2 id="ret-h">{t('admin.settings.retention')}</h2>
			<form onsubmit={saveRetention} novalidate>
				<Field
					label={t('admin.settings.retentionLabel')}
					hint={t('admin.settings.retentionHint')}
					error={retErr}
				>
					{#snippet children({ id, describedby, invalid })}
						<NumberInput
							{id}
							{describedby}
							{invalid}
							bind:value={retention}
							unit={t('admin.settings.months')}
						/>
					{/snippet}
				</Field>
				<Button type="submit" variant="secondary" loading={busy} disabled={!network.online}
					>{t('common.save')}</Button
				>
			</form>
		</section>

		<section class="panel" aria-labelledby="study-h">
			<h2 id="study-h">{t('admin.settings.studyMode')}</h2>
			<p>{t('admin.settings.studyExplain')}</p>
			<p class="state" class:on={settings.data.study_mode}>
				{settings.data.study_mode ? t('admin.settings.studyOn') : t('admin.settings.studyOff')}
			</p>
			<Button
				variant={settings.data.study_mode ? 'danger' : 'primary'}
				disabled={!network.online}
				onclick={() => (confirmStudy = true)}
			>
				{settings.data.study_mode ? t('admin.settings.turnOff') : t('admin.settings.turnOn')}
			</Button>
		</section>

		<section class="panel" aria-labelledby="consent-h">
			<h2 id="consent-h">{t('admin.settings.consent')}</h2>
			<p>{t('admin.settings.consentServed', { version: studyMode.consentVersion || '1.0' })}</p>
			<p class="vt-small vt-muted">{t('admin.settings.consentHint')}</p>
		</section>
	</div>

	<section class="panel wide" aria-labelledby="del-h">
		<h2 id="del-h">{t('admin.deletion.title')}</h2>
		<p class="vt-muted">{t('admin.deletion.intro')}</p>
		{#if requests.data && requests.data.length === 0}
			<EmptyState title={t('admin.deletion.empty')} icon="check" />
		{:else if requests.data}
			<DataTable
				{columns}
				rows={requests.data}
				key={(r) => r.request_id}
				caption={t('admin.deletion.title')}
			>
				{#snippet cell(r, col)}
					{#if col.key === 'received'}{formatDateTime(r.received_at)}
					{:else if col.key === 'code'}<span class="vt-mono">{r.client_code}</span>
					{:else if col.key === 'reason'}{t(`admin.deletion.reason.${r.reason}`)}
					{:else if col.key === 'profiles'}<span class="vt-num">{r.profile_ids.length}</span>
					{:else}{t(`admin.deletion.status.${r.status}`)}{#if r.completed_at}
							· {formatDateTime(r.completed_at)}{/if}{/if}
				{/snippet}
			</DataTable>
		{:else}
			<Skeleton lines={3} />
		{/if}
	</section>

	<Dialog
		bind:open={confirmStudy}
		title={settings.data.study_mode
			? t('admin.settings.turnOffTitle')
			: t('admin.settings.turnOnTitle')}
	>
		<p>
			{settings.data.study_mode ? t('admin.settings.turnOffBody') : t('admin.settings.turnOnBody')}
		</p>
		{#snippet actions()}
			<Button variant="text" onclick={() => (confirmStudy = false)}>{t('common.cancel')}</Button>
			<Button
				loading={busy}
				onclick={async () => {
					await put({ study_mode: !settings.data!.study_mode });
					confirmStudy = false;
				}}
				>{settings.data!.study_mode
					? t('admin.settings.turnOff')
					: t('admin.settings.turnOn')}</Button
			>
		{/snippet}
	</Dialog>
{/if}

<style>
	.grid {
		display: grid;
		gap: var(--vt-s-16);
	}
	@media (min-width: 1024px) {
		.grid {
			grid-template-columns: repeat(3, 1fr);
			align-items: start;
		}
	}
	.panel {
		padding: var(--vt-s-16);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius-lg);
	}
	.wide {
		margin-top: var(--vt-s-16);
	}
	.state {
		font-weight: 800;
		color: var(--vt-ink-muted);
	}
	.state.on {
		color: var(--vt-pass);
	}
</style>
