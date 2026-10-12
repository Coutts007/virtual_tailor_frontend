<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { api } from '$lib/api';
	import { ApiError } from '$lib/api/errors';
	import { problemKey } from '$lib/dashboard/errors';
	import { normaliseKenyanPhone, validateEmail, validatePassword } from '$lib/domain/validate';
	import { locale, t, type Lang } from '$lib/i18n/t.svelte';
	import type { MessageKey } from '$lib/i18n/en';
	import Banner from '$lib/ui/Banner.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Field from '$lib/ui/Field.svelte';
	import PasswordInput from '$lib/ui/PasswordInput.svelte';
	import RadioCards from '$lib/ui/RadioCards.svelte';

	let email = $state('');
	let password = $state('');
	let business = $state('');
	let phone = $state('');
	let area = $state('');
	let lang = $state<Lang>(locale.lang);
	let submitted = $state(false);
	let busy = $state(false);
	let errorKey = $state<MessageKey | null>(null);
	let serverErrors = $state<Record<string, string>>({});

	const errs = $derived({
		email: validateEmail(email) ?? (serverErrors.email ? 'auth.register.emailTaken' : null),
		password:
			validatePassword(password) ?? (serverErrors.password ? 'validate.passwordCommon' : null),
		business: business.trim() ? null : 'validate.required',
		phone: normaliseKenyanPhone(phone) ? null : 'validate.phone'
	} as Record<string, MessageKey | null>);
	const show = (k: string) => (submitted && errs[k] ? t(errs[k]!) : null);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		submitted = true;
		serverErrors = {};
		errorKey = null;
		if (Object.values(errs).some(Boolean)) {
			document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
			return;
		}
		busy = true;
		try {
			await api().register({
				email: email.trim(),
				password,
				business_name: business.trim(),
				phone: normaliseKenyanPhone(phone)!,
				area: area.trim(),
				locale: lang
			});
			await goto(resolve('/register/pending'));
		} catch (err) {
			if (err instanceof ApiError && err.problem.errors?.length) {
				serverErrors = Object.fromEntries(err.problem.errors.map((x) => [x.field, x.code]));
			} else errorKey = problemKey(err);
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head><title>{t('auth.register.title')} · {t('app.name')}</title></svelte:head>

<h1>{t('auth.register.title')}</h1>
<p class="vt-muted">{t('auth.register.intro')}</p>

{#if errorKey}<Banner tone="danger">{t(errorKey)}</Banner>{/if}

<form class="card" novalidate onsubmit={submit}>
	<Field label={t('auth.email')} error={show('email')}>
		{#snippet children({ id, describedby, invalid })}
			<input
				{id}
				class="vt-input"
				type="email"
				autocomplete="email"
				inputmode="email"
				bind:value={email}
				aria-describedby={describedby}
				aria-invalid={invalid || undefined}
			/>
		{/snippet}
	</Field>
	<Field label={t('auth.password')} hint={t('auth.register.passwordHint')} error={show('password')}>
		{#snippet children({ id, describedby, invalid })}
			<PasswordInput
				{id}
				{describedby}
				{invalid}
				bind:value={password}
				autocomplete="new-password"
				meter
			/>
		{/snippet}
	</Field>
	<Field label={t('auth.register.business')} error={show('business')}>
		{#snippet children({ id, describedby, invalid })}
			<input
				{id}
				class="vt-input"
				autocomplete="organization"
				bind:value={business}
				aria-describedby={describedby}
				aria-invalid={invalid || undefined}
			/>
		{/snippet}
	</Field>
	<Field label={t('auth.register.phone')} hint={t('auth.register.phoneHint')} error={show('phone')}>
		{#snippet children({ id, describedby, invalid })}
			<input
				{id}
				class="vt-input"
				type="tel"
				autocomplete="tel"
				inputmode="tel"
				bind:value={phone}
				aria-describedby={describedby}
				aria-invalid={invalid || undefined}
			/>
		{/snippet}
	</Field>
	<Field label={t('auth.register.area')} hint={t('auth.register.areaHint')} optional>
		{#snippet children({ id, describedby })}
			<input {id} class="vt-input" bind:value={area} aria-describedby={describedby} />
		{/snippet}
	</Field>
	<RadioCards
		legend={t('auth.register.language')}
		bind:value={lang}
		columns={2}
		options={[
			{ value: 'en', label: t('lang.en') },
			{ value: 'sw', label: t('lang.sw') }
		]}
	/>
	<Button type="submit" full size="lg" loading={busy}>{t('auth.register.submit')}</Button>
</form>

<p class="alt"><a href={resolve('/login')}>{t('auth.register.haveAccount')}</a></p>

<style>
	.card {
		margin-top: var(--vt-s-16);
		padding: var(--vt-s-24) var(--vt-s-16);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius-lg);
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
