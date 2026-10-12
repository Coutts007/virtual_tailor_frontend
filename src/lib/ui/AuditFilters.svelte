<script lang="ts">
	import type { AuditAction, AuditQuery, Role } from '$lib/api/types';
	import { t } from '$lib/i18n/t.svelte';
	import Field from './Field.svelte';
	import Select from './Select.svelte';

	/** Audit filters (Section 13.11, 14). `full` adds user, role and entity for the admin view. */
	let { query = $bindable(), full = false }: { query: AuditQuery; full?: boolean } = $props();
	const ACTIONS: AuditAction[] = [
		'login',
		'profile_view',
		'export',
		'share',
		'override',
		'deletion',
		'status_change',
		'code_issue',
		'approve',
		'settings_change'
	];
	const ENTITIES = [
		'account',
		'client',
		'export',
		'order',
		'profile',
		'session',
		'settings',
		'sheet'
	];

	let action = $state<string>(query.action ?? '');
	let role = $state<string>(query.role ?? '');
	let entity = $state<string>(query.entity_type ?? '');
	let user = $state(query.user ?? '');
	let from = $state(query.from ?? '');
	let to = $state(query.to ?? '');

	let h: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		const next: AuditQuery = {
			action: (action || undefined) as AuditAction | undefined,
			role: (role || undefined) as Role | undefined,
			entity_type: entity || undefined,
			user: user.trim() || undefined,
			from: from || undefined,
			to: to || undefined
		};
		clearTimeout(h);
		h = setTimeout(() => (query = next), 300);
		return () => clearTimeout(h);
	});
</script>

<div class="filters" role="search" aria-label={t('audit.filters')}>
	<Field label={t('audit.action')}>
		{#snippet children({ id })}
			<Select
				{id}
				bind:value={action}
				options={[
					{ value: '', label: t('audit.any') },
					...ACTIONS.map((a) => ({ value: a, label: t(`audit.action.${a}`) }))
				]}
			/>
		{/snippet}
	</Field>
	{#if full}
		<Field label={t('audit.user')}>
			{#snippet children({ id })}
				<input {id} class="vt-input" type="search" bind:value={user} autocomplete="off" />
			{/snippet}
		</Field>
		<Field label={t('audit.role')}>
			{#snippet children({ id })}
				<Select
					{id}
					bind:value={role}
					options={[
						{ value: '', label: t('audit.any') },
						{ value: 'tailor', label: t('audit.roleTailor') },
						{ value: 'admin', label: t('audit.roleAdmin') },
						{ value: 'measurer', label: t('audit.roleMeasurer') }
					]}
				/>
			{/snippet}
		</Field>
		<Field label={t('audit.entity')}>
			{#snippet children({ id })}
				<Select
					{id}
					bind:value={entity}
					options={[
						{ value: '', label: t('audit.any') },
						...ENTITIES.map((e) => ({ value: e, label: e }))
					]}
				/>
			{/snippet}
		</Field>
	{/if}
	<Field label={t('audit.from')}>
		{#snippet children({ id })}
			<input {id} class="vt-input" type="date" bind:value={from} max={to || undefined} />
		{/snippet}
	</Field>
	<Field label={t('audit.to')}>
		{#snippet children({ id })}
			<input {id} class="vt-input" type="date" bind:value={to} min={from || undefined} />
		{/snippet}
	</Field>
</div>

<style>
	.filters {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
		gap: 0 var(--vt-s-16);
	}
</style>
