<script lang="ts">
	import { api } from '$lib/api';
	import { ApiError } from '$lib/api/errors';
	import type { GarmentType, SiteCode, UnitPref } from '$lib/api/types';
	import { problemKey } from '$lib/dashboard/errors';
	import { siteLabel } from '$lib/dashboard/flags';
	import { loadMe, meStore, updateMe } from '$lib/dashboard/me.svelte';
	import { signOut } from '$lib/dashboard/signout';
	import { network } from '$lib/device/network.svelte';
	import { GARMENT_SITES, GARMENTS } from '$lib/domain/sites';
	import { mmToUnit, unitToMm } from '$lib/domain/units';
	import { normaliseKenyanPhone, validatePassword } from '$lib/domain/validate';
	import { locale, setLang, t, type Lang } from '$lib/i18n/t.svelte';
	import type { MessageKey } from '$lib/i18n/en';
	import { APP_VERSION, RULES_VERSION } from '$lib/version';
	import Banner from '$lib/ui/Banner.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import ErrorState from '$lib/ui/ErrorState.svelte';
	import Field from '$lib/ui/Field.svelte';
	import NumberInput from '$lib/ui/NumberInput.svelte';
	import PasswordInput from '$lib/ui/PasswordInput.svelte';
	import RadioCards from '$lib/ui/RadioCards.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import { toast } from '$lib/ui/toast.svelte';

	let loadError = $state<unknown>(null);
	let business = $state('');
	let phone = $state('');
	let area = $state('');
	let bizTried = $state(false);
	let bizBusy = $state(false);
	let lang = $state<Lang>(locale.lang);
	let unitPref = $state<UnitPref>('cm');
	let includeName = $state(false);
	let ready = $state(false);

	let currentPw = $state('');
	let newPw = $state('');
	let pwTried = $state(false);
	let pwBusy = $state(false);
	let pwError = $state<MessageKey | null>(null);

	let presetGarment = $state<GarmentType>('shirt');
	let presetValues = $state<Partial<Record<SiteCode, number | null>>>({});
	let presetBusy = $state(false);

	$effect(() => {
		void loadMe()
			.then((me) => {
				business = me.business_name ?? '';
				phone = me.phone ?? '';
				area = me.area ?? '';
				lang = me.locale;
				unitPref = me.unit_pref;
				includeName = me.include_name_default;
				ready = true;
			})
			.catch((e) => (loadError = e));
	});

	// Load the preset rows for the chosen garment in the tailor's unit.
	$effect(() => {
		const me = meStore.me;
		if (!me) return;
		const p = me.ease_presets?.[presetGarment] ?? {};
		presetValues = Object.fromEntries(
			GARMENT_SITES[presetGarment].map((s) => [
				s,
				p[s] != null ? mmToUnit(p[s]!, me.unit_pref) : null
			])
		);
	});

	async function save(
		patch: Parameters<typeof updateMe>[0],
		okKey: MessageKey = 'tailor.settings.saved'
	) {
		try {
			await updateMe(patch);
			toast(t(okKey), { tone: 'success' });
			return true;
		} catch (e) {
			toast(t(problemKey(e)), { tone: 'error' });
			return false;
		}
	}

	async function chooseLang(l: Lang) {
		setLang(l);
		if (ready && l !== meStore.me?.locale) await save({ locale: l });
	}
	$effect(() => {
		if (ready && lang !== locale.lang) void chooseLang(lang);
	});
	$effect(() => {
		if (ready && unitPref !== meStore.me?.unit_pref) void save({ unit_pref: unitPref });
	});
	$effect(() => {
		if (ready && includeName !== meStore.me?.include_name_default)
			void save({ include_name_default: includeName });
	});

	const phoneOk = $derived(!!normaliseKenyanPhone(phone));
	async function saveBusiness(e: SubmitEvent) {
		e.preventDefault();
		bizTried = true;
		if (!business.trim() || !phoneOk) return;
		bizBusy = true;
		await save({
			business_name: business.trim(),
			phone: normaliseKenyanPhone(phone)!,
			area: area.trim()
		});
		bizBusy = false;
	}

	const newPwKey = $derived(validatePassword(newPw));
	async function changePw(e: SubmitEvent) {
		e.preventDefault();
		pwTried = true;
		pwError = null;
		if (!currentPw || newPwKey) return;
		pwBusy = true;
		try {
			await api().changePassword(currentPw, newPw);
			toast(t('tailor.settings.passwordChanged'), { tone: 'success' });
			currentPw = newPw = '';
			pwTried = false;
		} catch (err) {
			pwError =
				err instanceof ApiError && err.code === 'invalid_credentials'
					? 'tailor.settings.wrongPassword'
					: problemKey(err);
		} finally {
			pwBusy = false;
		}
	}

	async function savePresets(e: SubmitEvent) {
		e.preventDefault();
		const me = meStore.me;
		if (!me) return;
		presetBusy = true;
		const garmentPresets: Partial<Record<SiteCode, number>> = {};
		for (const [s, v] of Object.entries(presetValues))
			if (v != null) garmentPresets[s as SiteCode] = unitToMm(v, me.unit_pref);
		await save(
			{ ease_presets: { ...me.ease_presets, [presetGarment]: garmentPresets } },
			'tailor.settings.presetsSaved'
		);
		presetBusy = false;
	}
</script>

<svelte:head><title>{t('tailor.settings.title')} · {t('app.name')}</title></svelte:head>

<h1>{t('tailor.settings.title')}</h1>

{#if loadError}
	<ErrorState body={t(problemKey(loadError))} />
{:else if !ready || !meStore.me}
	<Skeleton lines={8} />
{:else}
	{#if !network.online}<Banner tone="offline">{t('dash.offlineDisabled')}</Banner>{/if}
	<div class="grid">
		<section class="panel" aria-labelledby="pref-h">
			<h2 id="pref-h">{t('tailor.settings.preferences')}</h2>
			<RadioCards
				legend={t('lang.label')}
				bind:value={lang}
				columns={2}
				options={[
					{ value: 'en', label: t('lang.en') },
					{ value: 'sw', label: t('lang.sw') }
				]}
			/>
			<RadioCards
				legend={t('tailor.settings.units')}
				hint={t('tailor.settings.unitsHint')}
				bind:value={unitPref}
				columns={2}
				options={[
					{ value: 'cm', label: t('tailor.settings.cm') },
					{ value: 'in', label: t('tailor.settings.in') }
				]}
			/>
			<Checkbox bind:checked={includeName} describedby="inc-hint"
				>{t('tailor.settings.includeName')}</Checkbox
			>
			<p class="vt-small vt-muted" id="inc-hint">{t('tailor.settings.includeNameHint')}</p>
		</section>

		<section class="panel" aria-labelledby="biz-h">
			<h2 id="biz-h">{t('tailor.settings.business')}</h2>
			<form onsubmit={saveBusiness} novalidate>
				<Field
					label={t('auth.register.business')}
					error={bizTried && !business.trim() ? t('validate.required') : null}
				>
					{#snippet children({ id, describedby, invalid })}
						<input
							{id}
							class="vt-input"
							bind:value={business}
							aria-describedby={describedby}
							aria-invalid={invalid || undefined}
						/>
					{/snippet}
				</Field>
				<Field
					label={t('auth.register.phone')}
					hint={t('auth.register.phoneHint')}
					error={bizTried && !phoneOk ? t('validate.phone') : null}
				>
					{#snippet children({ id, describedby, invalid })}
						<input
							{id}
							class="vt-input"
							type="tel"
							inputmode="tel"
							bind:value={phone}
							aria-describedby={describedby}
							aria-invalid={invalid || undefined}
						/>
					{/snippet}
				</Field>
				<Field label={t('auth.register.area')} optional>
					{#snippet children({ id })}
						<input {id} class="vt-input" bind:value={area} />
					{/snippet}
				</Field>
				<Button type="submit" variant="secondary" loading={bizBusy} disabled={!network.online}
					>{t('common.save')}</Button
				>
			</form>
		</section>

		<section class="panel" aria-labelledby="ease-h">
			<h2 id="ease-h">{t('tailor.settings.presets')}</h2>
			<p class="vt-small vt-muted">{t('tailor.settings.presetsHint')}</p>
			<form onsubmit={savePresets} novalidate>
				<Field label={t('tailor.order.garment')}>
					{#snippet children({ id })}
						<Select
							{id}
							bind:value={presetGarment}
							options={GARMENTS.map((g) => ({ value: g, label: t(`garment.${g}`) }))}
						/>
					{/snippet}
				</Field>
				<div class="presets">
					{#each GARMENT_SITES[presetGarment] as s (presetGarment + s)}
						<Field label={siteLabel(s)}>
							{#snippet children({ id })}
								<NumberInput
									{id}
									bind:value={presetValues[s]}
									decimals={meStore.me!.unit_pref === 'cm' ? 1 : 3}
									unit={t(`unit.${meStore.me!.unit_pref}`)}
								/>
							{/snippet}
						</Field>
					{/each}
				</div>
				<Button type="submit" variant="secondary" loading={presetBusy} disabled={!network.online}
					>{t('tailor.settings.savePresets')}</Button
				>
			</form>
		</section>

		<section class="panel" aria-labelledby="pw-h">
			<h2 id="pw-h">{t('tailor.settings.password')}</h2>
			{#if pwError}<Banner tone="danger">{t(pwError)}</Banner>{/if}
			<form onsubmit={changePw} novalidate>
				<Field
					label={t('tailor.settings.currentPassword')}
					error={pwTried && !currentPw ? t('validate.required') : null}
				>
					{#snippet children({ id, describedby, invalid })}
						<PasswordInput {id} {describedby} {invalid} bind:value={currentPw} />
					{/snippet}
				</Field>
				<Field
					label={t('tailor.settings.newPassword')}
					hint={t('auth.register.passwordHint')}
					error={pwTried && newPwKey ? t(newPwKey) : null}
				>
					{#snippet children({ id, describedby, invalid })}
						<PasswordInput
							{id}
							{describedby}
							{invalid}
							bind:value={newPw}
							autocomplete="new-password"
							meter
						/>
					{/snippet}
				</Field>
				<Button type="submit" variant="secondary" loading={pwBusy} disabled={!network.online}
					>{t('tailor.settings.changePassword')}</Button
				>
			</form>
		</section>

		<section class="panel" aria-labelledby="acc-h">
			<h2 id="acc-h">{t('tailor.settings.account')}</h2>
			<p>{meStore.me.email}</p>
			<!-- The privacy notice lives in the client app (Section 9.13). -->
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- route owned by the client app -->
			<p><a href="/privacy">{t('tailor.settings.privacy')}</a></p>
			<Button variant="danger" onclick={signOut}>{t('dash.signOut')}</Button>
			<p class="vt-small vt-muted ver">
				{t('tailor.settings.version', { app: APP_VERSION, rules: RULES_VERSION })}
			</p>
		</section>
	</div>
{/if}

<style>
	.grid {
		display: grid;
		gap: var(--vt-s-16);
	}
	@media (min-width: 1024px) {
		.grid {
			grid-template-columns: 1fr 1fr;
			align-items: start;
		}
	}
	.panel {
		padding: var(--vt-s-16);
		background: var(--vt-paper);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius-lg);
	}
	.presets {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
		gap: 0 var(--vt-s-12);
	}
	.ver {
		margin-top: var(--vt-s-16);
	}
	a {
		display: inline-flex;
		align-items: center;
		min-height: var(--vt-target);
	}
</style>
