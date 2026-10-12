<script lang="ts">
	import { api } from '$lib/api';
	import { ApiError } from '$lib/api/errors';
	import type { AgeBand } from '$lib/api/types';
	import { nextParticipantCode } from '$lib/study/participants';
	import { problemKey } from '$lib/dashboard/errors';
	import { siteLabel } from '$lib/dashboard/flags';
	import { Resource } from '$lib/dashboard/resource.svelte';
	import { network } from '$lib/device/network.svelte';
	import { REFERENCE_ORDER } from '$lib/domain/sites';
	import { PARTICIPANT_CODE_RE } from '$lib/domain/validate';
	import { formatDate, t } from '$lib/i18n/t.svelte';
	import Banner from '$lib/ui/Banner.svelte';
	import Button from '$lib/ui/Button.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import ErrorState from '$lib/ui/ErrorState.svelte';
	import Field from '$lib/ui/Field.svelte';
	import RadioCards from '$lib/ui/RadioCards.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import { toast } from '$lib/ui/toast.svelte';

	const AGE_BANDS: AgeBand[] = ['18-24', '25-34', '35-44', '45-54', '55+'];
	const res = new Resource(() => api().listParticipants());
	$effect(() => void res.load());

	let code = $state('');
	let sex = $state<'female' | 'male' | undefined>(undefined);
	let age = $state<AgeBand>('25-34');
	let venue = $state('');
	let tried = $state(false);
	let busy = $state(false);
	let serverErr = $state<string | null>(null);
	$effect(() => {
		if (res.data && !code) code = nextParticipantCode(res.data.map((p) => p.participant_code));
	});
	const codeErr = $derived(
		tried && !PARTICIPANT_CODE_RE.test(code)
			? t('admin.participants.codeInvalid')
			: serverErr === 'taken'
				? t('admin.participants.codeTaken')
				: null
	);
	const sexErr = $derived(tried && !sex ? t('validate.required') : null);

	async function enrol(e: SubmitEvent) {
		e.preventDefault();
		tried = true;
		serverErr = null;
		if (codeErr || !sex) return;
		busy = true;
		try {
			const r = await api().enrolParticipant({
				participant_code: code,
				sex,
				age_band: age,
				venue: venue.trim()
			});
			toast(t('admin.participants.enrolled', { code, client: r.client_code }), { tone: 'success' });
			await res.load();
			code = nextParticipantCode((res.data ?? []).map((p) => p.participant_code));
			sex = undefined;
			venue = '';
			tried = false;
		} catch (err) {
			if (
				err instanceof ApiError &&
				err.problem.errors?.some((x) => x.field === 'participant_code')
			)
				serverErr = 'taken';
			else toast(t(problemKey(err)), { tone: 'error' });
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head><title>{t('admin.participants.title')} · {t('app.name')}</title></svelte:head>

<h1>{t('admin.participants.title')}</h1>

<div class="grid">
	<section class="panel" aria-labelledby="enrol-h">
		<h2 id="enrol-h">{t('admin.participants.enrol')}</h2>
		<Banner tone="warning" live="off">{t('admin.participants.noPersonal')}</Banner>
		<form onsubmit={enrol} novalidate>
			<Field
				label={t('admin.participants.code')}
				hint={t('admin.participants.codeHint')}
				error={codeErr}
			>
				{#snippet children({ id, describedby, invalid })}
					<input
						{id}
						class="vt-input vt-mono"
						bind:value={code}
						oninput={() => ((code = code.toUpperCase()), (serverErr = null))}
						maxlength="4"
						autocomplete="off"
						aria-describedby={describedby}
						aria-invalid={invalid || undefined}
					/>
				{/snippet}
			</Field>
			<RadioCards
				legend={t('admin.participants.sex')}
				bind:value={sex}
				columns={2}
				options={[
					{ value: 'female', label: t('admin.participants.female') },
					{ value: 'male', label: t('admin.participants.male') }
				]}
			/>
			{#if sexErr}<p class="err vt-small" role="alert">{sexErr}</p>{/if}
			<Field label={t('admin.participants.age')}>
				{#snippet children({ id })}
					<Select {id} bind:value={age} options={AGE_BANDS.map((a) => ({ value: a, label: a }))} />
				{/snippet}
			</Field>
			<Field label={t('admin.participants.venue')} optional>
				{#snippet children({ id })}
					<input {id} class="vt-input" bind:value={venue} maxlength="60" />
				{/snippet}
			</Field>
			<Button type="submit" loading={busy} disabled={!network.online}
				>{t('admin.participants.enrolButton')}</Button
			>
		</form>
	</section>

	<section aria-labelledby="list-h">
		<h2 id="list-h">{t('admin.participants.list')}</h2>
		{#if res.loading && !res.data}
			<Skeleton lines={5} />
		{:else if res.error && !res.data}
			<ErrorState body={t(problemKey(res.error))} onretry={() => res.load()} />
		{:else if res.data && res.data.length === 0}
			<EmptyState title={t('admin.participants.empty')} icon="user" />
		{:else if res.data}
			<ul class="cards">
				{#each res.data as p (p.participant_id)}
					<li class="card">
						<p class="title">
							<span class="vt-mono">{p.participant_code}</span> · {t(`admin.participants.${p.sex}`)} ·
							{p.age_band}
						</p>
						<p class="vt-small vt-muted">
							{p.venue || '—'} · {t('admin.participants.enrolledOn', {
								date: formatDate(p.enrolled_at)
							})} · <span class="vt-mono">{p.client_code}</span>
						</p>
						<p class="sets">
							{t('admin.participants.sets', { n: p.sets_captured })}
							<span class="bar" aria-hidden="true"
								><span style:width="{(p.sets_captured / 3) * 100}%"></span></span
							>
						</p>
						<details>
							<summary
								>{t('admin.participants.readings', {
									done: REFERENCE_ORDER.filter((s) => (p.readings[s] ?? 0) >= 4).length
								})}</summary
							>
							<ul class="sites">
								{#each REFERENCE_ORDER as s (s)}
									<li class:full={(p.readings[s] ?? 0) >= 4}>
										<span>{siteLabel(s)}</span><span class="vt-num">{p.readings[s] ?? 0}/4</span>
									</li>
								{/each}
							</ul>
						</details>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- route owned by the capture app -->
						<a class="cap" href={`/study/capture?participant=${p.participant_code}`}
							>{t('admin.participants.startCapture', { set: Math.min(3, p.sets_captured + 1) })}</a
						>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<style>
	.grid {
		display: grid;
		gap: var(--vt-s-24);
	}
	@media (min-width: 1024px) {
		.grid {
			grid-template-columns: 22rem 1fr;
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
	.err {
		color: var(--vt-fail);
		font-weight: 600;
		margin-top: calc(-1 * var(--vt-s-8));
	}
	.cards {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--vt-s-12);
	}
	.card p {
		margin: 0 0 var(--vt-s-4);
	}
	.title {
		font-weight: 800;
	}
	.sets {
		display: flex;
		align-items: center;
		gap: var(--vt-s-8);
	}
	.bar {
		flex: 1;
		max-width: 10rem;
		height: 8px;
		border-radius: 4px;
		background: var(--vt-line);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--vt-thread);
	}
	summary {
		min-height: var(--vt-target);
		display: flex;
		align-items: center;
		cursor: pointer;
		font-weight: 600;
	}
	.sites {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
		gap: 4px var(--vt-s-12);
		font-size: var(--vt-fs-14);
	}
	.sites li {
		display: flex;
		justify-content: space-between;
		color: var(--vt-ink-muted);
	}
	.sites li.full {
		color: var(--vt-pass);
		font-weight: 700;
	}
	.cap {
		display: inline-flex;
		align-items: center;
		min-height: var(--vt-target);
		font-weight: 700;
	}
</style>
