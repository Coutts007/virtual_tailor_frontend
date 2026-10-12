<script lang="ts">
	import { api } from '$lib/api';
	import type { Account } from '$lib/api/types';
	import { problemKey } from '$lib/dashboard/errors';
	import MeasurerForm from '$lib/dashboard/MeasurerForm.svelte';
	import { Resource } from '$lib/dashboard/resource.svelte';
	import { network } from '$lib/device/network.svelte';
	import { formatDate, t } from '$lib/i18n/t.svelte';
	import Button from '$lib/ui/Button.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import ErrorState from '$lib/ui/ErrorState.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import { toast } from '$lib/ui/toast.svelte';

	const res = new Resource(async () =>
		(await api().listAccounts()).filter((a) => a.role === 'measurer')
	);
	$effect(() => void res.load());
	let busy = $state<string | null>(null);

	async function toggle(a: Account) {
		busy = a.user_id;
		try {
			if (a.status === 'active') await api().disableAccount(a.user_id);
			else await api().enableAccount(a.user_id);
			toast(
				t(a.status === 'active' ? 'admin.accounts.done.disable' : 'admin.accounts.done.enable', {
					email: a.email
				}),
				{ tone: 'success' }
			);
			await res.load();
		} catch (e) {
			toast(t(problemKey(e)), { tone: 'error' });
		} finally {
			busy = null;
		}
	}
</script>

<svelte:head><title>{t('admin.study.measurers')} · {t('app.name')}</title></svelte:head>

<h1>{t('admin.study.measurers')}</h1>

<div class="grid">
	<section aria-labelledby="ml-h">
		<h2 id="ml-h" class="vt-visually-hidden">{t('admin.study.measurers')}</h2>
		{#if res.loading && !res.data}
			<Skeleton lines={4} />
		{:else if res.error && !res.data}
			<ErrorState body={t(problemKey(res.error))} onretry={() => res.load()} />
		{:else if res.data && res.data.length === 0}
			<EmptyState title={t('admin.measurer.empty')} icon="user" />
		{:else if res.data}
			<ul class="cards">
				{#each res.data as m (m.user_id)}
					<li class="card">
						<span class="code vt-mono" aria-hidden="true">{m.measurer_code}</span>
						<span class="info">
							<strong>{t('admin.measurer.label', { code: m.measurer_code ?? '?' })}</strong>
							<span class="vt-small">{m.email}</span>
							<span class="vt-small vt-muted"
								>{m.trained_on
									? t('admin.measurer.trainedOn', { date: formatDate(m.trained_on) })
									: ''} · {t(`admin.accounts.status.${m.status}`)}</span
							>
						</span>
						<Button
							variant="secondary"
							loading={busy === m.user_id}
							disabled={!network.online}
							onclick={() => toggle(m)}
						>
							{m.status === 'active'
								? t('admin.accounts.disable')
								: t('admin.accounts.enable')}<span class="vt-visually-hidden"> {m.email}</span>
						</Button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
	<section class="panel" aria-labelledby="mc-h">
		<h2 id="mc-h">{t('admin.measurer.create')}</h2>
		<MeasurerForm
			oncreated={(a) => {
				toast(t('admin.measurer.created', { code: a.measurer_code ?? '' }), { tone: 'success' });
				void res.load();
			}}
		/>
	</section>
</div>

<style>
	.grid {
		display: grid;
		gap: var(--vt-s-24);
	}
	@media (min-width: 1024px) {
		.grid {
			grid-template-columns: 1fr 22rem;
			align-items: start;
		}
	}
	.panel,
	.card {
		padding: var(--vt-s-16);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius-lg);
	}
	.cards {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--vt-s-12);
	}
	.card {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--vt-s-12);
	}
	.code {
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--vt-thread);
		color: var(--vt-thread-ink);
		font-size: var(--vt-fs-22);
		font-weight: 800;
	}
	.info {
		display: grid;
		flex: 1;
		min-width: 10rem;
		overflow-wrap: anywhere;
	}
</style>
