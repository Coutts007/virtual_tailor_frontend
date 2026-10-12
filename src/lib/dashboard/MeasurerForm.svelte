<script lang="ts">
	import { api } from '$lib/api';
	import { ApiError } from '$lib/api/errors';
	import type { Account } from '$lib/api/types';
	import { network } from '$lib/device/network.svelte';
	import { nairobiToday, validateEmail, validatePassword } from '$lib/domain/validate';
	import { t } from '$lib/i18n/t.svelte';
	import type { MessageKey } from '$lib/i18n/en';
	import Banner from '$lib/ui/Banner.svelte';
	import Button from '$lib/ui/Button.svelte';
	import DatePicker from '$lib/ui/DatePicker.svelte';
	import Field from '$lib/ui/Field.svelte';
	import PasswordInput from '$lib/ui/PasswordInput.svelte';
	import { problemKey } from './errors';

	/** Create a study measurer account (Sections 14, 15.4). */
	let { oncreated }: { oncreated: (a: Account) => void } = $props();
	let email = $state('');
	let password = $state('');
	let code = $state('');
	let trained = $state(nairobiToday());
	let tried = $state(false);
	let busy = $state(false);
	let error = $state<MessageKey | null>(null);
	let taken = $state(false);

	const errs = $derived({
		email: validateEmail(email),
		password: validatePassword(password),
		code: /^[A-Z]$/.test(code)
			? taken
				? 'admin.measurer.codeTaken'
				: null
			: 'admin.measurer.codeInvalid',
		trained: /^\d{4}-\d{2}-\d{2}$/.test(trained) ? null : 'validate.date'
	} as Record<string, MessageKey | null>);
	const show = (k: string) => (tried && errs[k] ? t(errs[k]!) : null);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		tried = true;
		error = null;
		if (Object.values(errs).some(Boolean)) return;
		busy = true;
		try {
			const a = await api().createMeasurer({
				email: email.trim(),
				password,
				measurer_code: code,
				trained_on: trained
			});
			oncreated(a);
			email = password = code = '';
			tried = false;
		} catch (err) {
			if (err instanceof ApiError && err.problem.errors?.some((x) => x.field === 'measurer_code'))
				taken = true;
			else error = problemKey(err);
		} finally {
			busy = false;
		}
	}
</script>

<form class="mf" novalidate onsubmit={submit}>
	{#if error}<Banner tone="danger">{t(error)}</Banner>{/if}
	<Field label={t('auth.email')} error={show('email')}>
		{#snippet children({ id, describedby, invalid })}
			<input
				{id}
				class="vt-input"
				type="email"
				autocomplete="off"
				bind:value={email}
				aria-describedby={describedby}
				aria-invalid={invalid || undefined}
			/>
		{/snippet}
	</Field>
	<Field
		label={t('admin.measurer.password')}
		hint={t('auth.register.passwordHint')}
		error={show('password')}
	>
		{#snippet children({ id, describedby, invalid })}
			<PasswordInput
				{id}
				{describedby}
				{invalid}
				bind:value={password}
				autocomplete="new-password"
			/>
		{/snippet}
	</Field>
	<div class="two">
		<Field
			label={t('admin.measurer.code')}
			hint={t('admin.measurer.codeHint')}
			error={show('code')}
		>
			{#snippet children({ id, describedby, invalid })}
				<input
					{id}
					class="vt-input vt-mono"
					maxlength="1"
					autocapitalize="characters"
					bind:value={code}
					oninput={() => ((code = code.toUpperCase()), (taken = false))}
					aria-describedby={describedby}
					aria-invalid={invalid || undefined}
				/>
			{/snippet}
		</Field>
		<Field label={t('admin.measurer.trained')} error={show('trained')}>
			{#snippet children({ id, describedby, invalid })}
				<DatePicker {id} {describedby} {invalid} bind:value={trained} max={nairobiToday()} />
			{/snippet}
		</Field>
	</div>
	<Button type="submit" loading={busy} disabled={!network.online}
		>{t('admin.measurer.create')}</Button
	>
</form>

<style>
	.mf {
		display: grid;
	}
	.two {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0 var(--vt-s-12);
	}
</style>
