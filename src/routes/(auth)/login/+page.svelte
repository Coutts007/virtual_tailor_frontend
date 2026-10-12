<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { api, auth } from '$lib/api';
	import { ApiError } from '$lib/api/errors';
	import { HOME_BY_ROLE } from '$lib/auth/guards';
	import { session, startSession } from '$lib/auth/session.svelte';
	import { problemKey } from '$lib/dashboard/errors';
	import { validateEmail } from '$lib/domain/validate';
	import { setLang, t } from '$lib/i18n/t.svelte';
	import type { MessageKey } from '$lib/i18n/en';
	import Banner from '$lib/ui/Banner.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Field from '$lib/ui/Field.svelte';
	import PasswordInput from '$lib/ui/PasswordInput.svelte';

	auth();
	let email = $state('');
	let password = $state('');
	let submitted = $state(false);
	let busy = $state(false);
	let errorKey = $state<MessageKey | null>(null);
	let wait = $state(0);
	let timer: ReturnType<typeof setInterval> | undefined;

	const ended = session.ended === 'expired';
	const disabledState = page.url.searchParams.get('state') === 'disabled';
	const emailErr = $derived(submitted && validateEmail(email) ? t('validate.email') : null);
	const pwErr = $derived(submitted && !password ? t('validate.required') : null);

	// Already signed in when the page opens: go home.
	onMount(() => {
		const u = session.user;
		if (u?.status === 'active') void goto(resolve(HOME_BY_ROLE[u.role] as '/t/orders'));
	});

	function safeNext(): string | null {
		const n = page.url.searchParams.get('next');
		return n && n.startsWith('/') && !n.startsWith('//') ? n : null;
	}

	function startWait(seconds: number) {
		wait = Math.max(1, Math.ceil(seconds));
		clearInterval(timer);
		timer = setInterval(() => {
			wait -= 1;
			if (wait <= 0) clearInterval(timer);
		}, 1000);
	}
	onDestroy(() => clearInterval(timer));

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		submitted = true;
		errorKey = null;
		if (emailErr || pwErr || wait > 0) return;
		busy = true;
		try {
			const r = await api().login(email.trim(), password);
			auth().save(r);
			startSession(r.user, r.expires_at);
			setLang(r.user.locale);
			if (r.user.status === 'pending') return void goto(resolve('/register/pending'));
			const next = safeNext();
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- next is an in-app path from our own redirect
			await goto(next ?? resolve(HOME_BY_ROLE[r.user.role] as '/t/orders'));
		} catch (err) {
			if (err instanceof ApiError && err.code === 'rate_limited')
				startWait(err.problem.retry_after_s ?? 30);
			if (err instanceof ApiError && err.code === 'account_pending')
				return void goto(resolve('/register/pending'));
			errorKey = problemKey(err);
			password = '';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head><title>{t('auth.login.title')} · {t('app.name')}</title></svelte:head>

<h1>{t('auth.login.title')}</h1>

{#if ended}
	<Banner tone="warning">{t('auth.sessionEnded')}</Banner>
{/if}
{#if disabledState && !errorKey}
	<Banner tone="danger">{t('auth.error.disabled')}</Banner>
{/if}
{#if errorKey}
	<div class="err" role="alert">
		<Banner tone="danger" live="off">
			{t(errorKey)}
			{#if wait > 0}<strong class="vt-num">
					{t('auth.error.waitSeconds', { count: wait })}</strong
				>{/if}
		</Banner>
	</div>
{/if}

<form class="card" novalidate onsubmit={submit}>
	<Field label={t('auth.email')} error={emailErr}>
		{#snippet children({ id, describedby, invalid })}
			<input
				{id}
				class="vt-input"
				type="email"
				autocomplete="username"
				inputmode="email"
				bind:value={email}
				aria-describedby={describedby}
				aria-invalid={invalid || undefined}
			/>
		{/snippet}
	</Field>
	<Field label={t('auth.password')} error={pwErr}>
		{#snippet children({ id, describedby, invalid })}
			<PasswordInput {id} {describedby} {invalid} bind:value={password} />
		{/snippet}
	</Field>
	<Button type="submit" full size="lg" loading={busy} disabled={wait > 0}
		>{t('auth.login.submit')}</Button
	>
</form>

<p class="alt">
	<a href={resolve('/register')}>{t('auth.login.register')}</a>
</p>

<style>
	h1 {
		margin-top: var(--vt-s-16);
	}
	.card {
		margin-top: var(--vt-s-16);
		padding: var(--vt-s-24) var(--vt-s-16);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius-lg);
	}
	.err {
		margin-top: var(--vt-s-8);
	}
	.alt {
		margin-top: var(--vt-s-24);
		text-align: center;
	}
	.alt a {
		display: inline-flex;
		align-items: center;
		min-height: var(--vt-target);
		font-weight: 700;
	}
</style>
