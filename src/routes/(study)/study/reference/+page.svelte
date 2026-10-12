<script lang="ts">
	/*
	 * Reference tape entry (Section 15.2, FR-23). This screen never loads or shows
	 * the system's measurements: it only sends what the measurer types.
	 */
	import { onMount } from 'svelte';
	import { api } from '$lib/api';
	import { ApiError } from '$lib/api/errors';
	import type { SiteCode } from '$lib/api/types';
	import { session } from '$lib/auth/session.svelte';
	import { siteLabel } from '$lib/dashboard/flags';
	import { signOut } from '$lib/dashboard/signout';
	import { network } from '$lib/device/network.svelte';
	import { REFERENCE_ORDER } from '$lib/domain/sites';
	import { PARTICIPANT_CODE_RE } from '$lib/domain/validate';
	import { t } from '$lib/i18n/t.svelte';
	import { enqueueReading, flushReadings, pendingCount } from '$lib/study/queue';
	import { badPrecision, implausible, toMmValues } from '$lib/study/reference';
	import Banner from '$lib/ui/Banner.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Icon from '$lib/ui/Icon.svelte';
	import LangToggle from '$lib/ui/LangToggle.svelte';
	import NumberInput from '$lib/ui/NumberInput.svelte';
	import RadioCards from '$lib/ui/RadioCards.svelte';

	const measurer = $derived(session.user?.measurer_code ?? '?');
	let participant = $state('');
	let readingNo = $state<'1' | '2'>('1');
	const blank = () =>
		Object.fromEntries(REFERENCE_ORDER.map((s) => [s, null])) as Record<SiteCode, number | null>;
	let values = $state<Record<SiteCode, number | null>>(blank());
	let info = $state<SiteCode | null>(null);
	let tried = $state(false);
	let busy = $state(false);
	let confirm = $state<{ implausible: SiteCode[]; empty: SiteCode[] } | null>(null);
	let saved = $state<{
		participant: string;
		reading: number;
		outOfOrder: boolean;
		queued: boolean;
	} | null>(null);
	let error = $state<string | null>(null);
	let pending = $state(0);
	let syncNote = $state<string | null>(null);

	const partErr = $derived(
		tried && !PARTICIPANT_CODE_RE.test(participant) ? t('study.ref.participantInvalid') : null
	);
	const filled = $derived(REFERENCE_ORDER.filter((s) => values[s] != null));
	const precisionBad = $derived(REFERENCE_ORDER.filter((s) => badPrecision(values[s])));

	async function refreshPending() {
		pending = await pendingCount().catch(() => 0);
	}
	async function flush() {
		if (!navigator.onLine) return;
		const results = await flushReadings(api());
		await refreshPending();
		const locked = results.filter((r) => r.kind === 'locked').length;
		const sent = results.filter((r) => r.kind === 'sent').length;
		if (sent || locked) syncNote = t('study.ref.flushed', { sent, locked });
	}
	onMount(() => {
		void refreshPending().then(flush);
		const on = () => void flush();
		addEventListener('online', on);
		const timer = setInterval(flush, 30_000);
		return () => {
			removeEventListener('online', on);
			clearInterval(timer);
		};
	});

	function review(e: SubmitEvent) {
		e.preventDefault();
		tried = true;
		error = null;
		if (partErr || !filled.length || precisionBad.length) return;
		const odd = implausible(toMmValues(values));
		const empty = REFERENCE_ORDER.filter((s) => values[s] == null);
		if (odd.length || empty.length) confirm = { implausible: odd, empty };
		else void submit();
	}

	async function submit() {
		confirm = null;
		busy = true;
		const input = {
			participant_code: participant,
			reading_no: Number(readingNo) as 1 | 2,
			values: toMmValues(values),
			taken_at: new Date().toISOString()
		};
		try {
			const r = await api().submitReferenceReading(input);
			saved = { participant, reading: r.reading_no, outOfOrder: r.out_of_order, queued: false };
			reset();
		} catch (err) {
			if (err instanceof ApiError && (err.code === 'network_error' || err.status >= 500)) {
				await enqueueReading(input);
				await refreshPending();
				saved = { participant, reading: input.reading_no, outOfOrder: false, queued: true };
				reset();
			} else if (err instanceof ApiError && err.code === 'reading_locked') {
				error = t('study.ref.locked');
			} else if (
				err instanceof ApiError &&
				err.problem.errors?.some((x) => x.field === 'participant_code')
			) {
				error = t('study.ref.participantUnknown', { code: participant });
			} else {
				error = t('error.generic.body');
			}
		} finally {
			busy = false;
		}
	}

	function reset() {
		values = blank();
		tried = false;
	}
	function next() {
		const last = saved;
		saved = null;
		readingNo = last && last.reading === 1 ? '2' : '1';
		if (last?.reading === 2) participant = '';
	}
	const fmt = (s: SiteCode) => (values[s] != null ? `${values[s]!.toFixed(1)} cm` : '');
</script>

<svelte:head><title>{t('study.ref.title')} · {t('app.name')}</title></svelte:head>

<a class="vt-skip-link" href="#main">{t('common.skipToContent')}</a>
<header class="top">
	<span class="brand"
		><span class="mark" aria-hidden="true">VT</span><span
			>{t('study.ref.header', { code: measurer })}</span
		></span
	>
	<span class="tools">
		<LangToggle />
		<Button variant="text" onclick={signOut}>{t('dash.signOut')}</Button>
	</span>
</header>
{#if !network.online}<Banner tone="offline">{t('study.ref.offline')}</Banner>{/if}

<main id="main" class="wrap">
	<h1>{t('study.ref.title')}</h1>
	<p class="vt-muted">{t('study.ref.intro')}</p>

	{#if pending > 0}
		<Banner tone="info">
			<Icon name="clock" size={18} />
			{t('study.ref.pending', { count: pending })}
			<Button variant="text" disabled={!network.online} onclick={flush}
				>{t('study.ref.sendNow')}</Button
			>
		</Banner>
	{/if}
	{#if syncNote}<p class="vt-small" role="status">{syncNote}</p>{/if}

	{#if saved}
		<section class="done" aria-labelledby="done-h">
			<Icon name="check" size={40} stroke={3} />
			<h2 id="done-h">
				{t('study.ref.saved', { participant: saved.participant, reading: saved.reading, measurer })}
			</h2>
			{#if saved.queued}<p>{t('study.ref.queued')}</p>{/if}
			{#if saved.outOfOrder}<p class="warn">{t('study.ref.outOfOrder')}</p>{/if}
			<p class="vt-small vt-muted">{t('study.ref.lockedNote')}</p>
			<Button onclick={next}>{t('study.ref.next')}</Button>
		</section>
	{:else}
		<form class="card" novalidate onsubmit={review}>
			{#if error}<Banner tone="danger">{error}</Banner>{/if}
			<div class="two">
				<Field
					label={t('study.ref.participant')}
					hint={t('study.ref.participantHint')}
					error={partErr}
				>
					{#snippet children({ id, describedby, invalid })}
						<input
							{id}
							class="vt-input vt-mono"
							bind:value={participant}
							oninput={() => (participant = participant.toUpperCase())}
							maxlength="4"
							autocomplete="off"
							autocapitalize="characters"
							aria-describedby={describedby}
							aria-invalid={invalid || undefined}
						/>
					{/snippet}
				</Field>
				<RadioCards
					legend={t('study.ref.readingNo')}
					bind:value={readingNo}
					columns={2}
					options={[
						{ value: '1', label: t('study.ref.reading', { n: 1 }) },
						{ value: '2', label: t('study.ref.reading', { n: 2 }) }
					]}
				/>
			</div>

			<fieldset class="sites">
				<legend>{t('study.ref.sites')}</legend>
				{#each REFERENCE_ORDER as s, i (s)}
					<div class="site">
						<Field
							label={`${i + 1}. ${siteLabel(s)}`}
							error={badPrecision(values[s]) ? t('study.ref.precision') : null}
						>
							{#snippet children({ id, describedby, invalid })}
								<NumberInput
									{id}
									{describedby}
									{invalid}
									bind:value={values[s]}
									decimals={1}
									unit="cm"
								/>
							{/snippet}
						</Field>
						<button
							type="button"
							class="info"
							aria-expanded={info === s}
							aria-controls={`instr-${s}`}
							aria-label={t('study.ref.howTo', { site: siteLabel(s) })}
							onclick={() => (info = info === s ? null : s)}
						>
							<Icon name="info" />
						</button>
						{#if info === s}<p class="instr vt-small" id={`instr-${s}`}>
								{t(`study.instr.${s}`)}
							</p>{/if}
					</div>
				{/each}
			</fieldset>
			{#if tried && !filled.length}<p class="err" role="alert">{t('study.ref.noneEntered')}</p>{/if}
			<Button type="submit" size="lg" loading={busy}>{t('study.ref.submit')}</Button>
			<p class="vt-small vt-muted">{t('study.ref.lockedNote')}</p>
		</form>
	{/if}
</main>

<Dialog open={!!confirm} onclose={() => (confirm = null)} title={t('study.ref.confirmTitle')}>
	{#if confirm}
		<ul class="confirm">
			{#each confirm.implausible as s (s)}
				<li>{t('study.ref.implausible', { value: fmt(s), site: siteLabel(s).toLowerCase() })}</li>
			{/each}
			{#if confirm.empty.length}
				<li>{t('study.ref.empty', { count: confirm.empty.length })}</li>
			{/if}
		</ul>
	{/if}
	{#snippet actions()}
		<Button variant="text" onclick={() => (confirm = null)}>{t('study.ref.goBack')}</Button>
		<Button onclick={submit}>{t('study.ref.confirmSubmit')}</Button>
	{/snippet}
</Dialog>

<svelte:window
	onbeforeunload={(e) => {
		if (filled.length && !saved) e.preventDefault();
	}}
/>

<style>
	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--vt-s-8);
		padding: calc(var(--vt-s-8) + var(--vt-safe-top)) var(--vt-s-16) var(--vt-s-8);
		background: var(--vt-paper);
		border-bottom: 1px solid var(--vt-line);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: var(--vt-s-8);
		font-weight: 800;
	}
	.mark {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: 9px;
		background: var(--vt-thread);
		color: var(--vt-thread-ink);
		font-size: var(--vt-fs-14);
	}
	.tools {
		display: flex;
		align-items: center;
		gap: var(--vt-s-4);
	}
	.wrap {
		max-width: 44rem;
		margin: 0 auto;
		padding: var(--vt-s-16) var(--vt-s-16) var(--vt-s-48);
	}
	.card,
	.done {
		padding: var(--vt-s-16);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius-lg);
	}
	.done {
		display: grid;
		justify-items: center;
		text-align: center;
		gap: var(--vt-s-8);
		color: var(--vt-pass);
	}
	.done h2,
	.done p {
		color: var(--vt-ink);
	}
	.done .warn {
		color: var(--vt-check-ink);
		font-weight: 700;
	}
	.two {
		display: grid;
		gap: 0 var(--vt-s-16);
	}
	@media (min-width: 640px) {
		.two {
			grid-template-columns: 1fr 1fr;
		}
	}
	.sites {
		border: 0;
		padding: 0;
		margin: 0 0 var(--vt-s-16);
		display: grid;
		gap: 0 var(--vt-s-16);
	}
	@media (min-width: 640px) {
		.sites {
			grid-template-columns: 1fr 1fr;
		}
	}
	legend {
		font-weight: 800;
		margin-bottom: var(--vt-s-8);
	}
	.site {
		position: relative;
	}
	.info {
		position: absolute;
		right: 0;
		top: 0;
		width: var(--vt-target);
		height: var(--vt-target);
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--vt-thread);
		cursor: pointer;
	}
	.instr {
		margin: calc(-1 * var(--vt-s-8)) 0 var(--vt-s-12);
		padding: var(--vt-s-8) var(--vt-s-12);
		background: var(--vt-info-fill);
		border-radius: var(--vt-radius);
	}
	.err {
		color: var(--vt-fail);
		font-weight: 600;
	}
	.confirm {
		padding-left: var(--vt-s-16);
	}
</style>
