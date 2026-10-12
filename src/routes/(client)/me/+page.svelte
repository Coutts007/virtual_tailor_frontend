<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { formatDateTime, t } from '$lib/i18n/t.svelte';
	import { listProfiles } from '$lib/db/profiles';
	import type { LocalProfile } from '$lib/db/dexie';
	import { flagCounts } from '$lib/client/present';
	import { syncState } from '$lib/client/syncState.svelte';
	import ClientHeader from '$lib/client/ClientHeader.svelte';
	import Page from '$lib/client/Page.svelte';
	import Button from '$lib/ui/Button.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import Icon from '$lib/ui/Icon.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import SyncBadge from '$lib/ui/SyncBadge.svelte';

	/** My measurements (9.12): saved profiles on this phone. */
	let profiles = $state<LocalProfile[] | null>(null);
	onMount(() => void listProfiles().then((p) => (profiles = p)));
	$effect(() => {
		void syncState.lastRun;
		void listProfiles().then((p) => (profiles = p));
	});
</script>

<svelte:head><title>{t('me.title')} · {t('app.name')}</title></svelte:head>

<ClientHeader title={t('me.title')} back="/" />

<Page>
	{#if profiles === null}
		<Skeleton lines={4} height={56} />
	{:else if profiles.length === 0}
		<EmptyState title={t('me.empty')} icon="ruler">
			{#snippet action()}<Button href={resolve('/start')}>{t('me.measureNow')}</Button>{/snippet}
		</EmptyState>
	{:else}
		<ul class="list">
			{#each profiles as p (p.profile_id)}
				{@const c = flagCounts(p.measurements)}
				<li>
					<a href={resolve('/(client)/me/[profileId]', { profileId: p.profile_id })}>
						<span class="top">
							<span class="code vt-mono">{p.client_code}</span>
							<SyncBadge status={p.sync_status} />
						</span>
						<span class="date"
							>{formatDateTime(p.captured_at)} · {t('me.version', { v: p.version })}</span
						>
						<span class="sum vt-small"
							>{t('me.summary', { pass: c.pass, check: c.check, fail: c.fail })}</span
						>
						<Icon name="chevron-right" />
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</Page>

<style>
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--vt-s-8);
	}
	a {
		position: relative;
		display: grid;
		gap: 2px;
		padding: var(--vt-s-12) 3rem var(--vt-s-12) var(--vt-s-16);
		border: 1px solid var(--vt-line);
		border-radius: var(--vt-radius);
		background: var(--vt-paper);
		color: var(--vt-ink);
		text-decoration: none;
	}
	a :global(.icon:last-child) {
		position: absolute;
		right: var(--vt-s-12);
		top: 50%;
		transform: translateY(-50%);
		color: var(--vt-ink-muted);
	}
	.top {
		display: flex;
		gap: var(--vt-s-8);
		align-items: center;
		flex-wrap: wrap;
	}
	.code {
		font-size: var(--vt-fs-18);
		font-weight: 700;
	}
	.sum {
		color: var(--vt-ink-muted);
	}
</style>
