<script lang="ts">
	import type { SyncStatus } from '$lib/api/types';
	import { t } from '$lib/i18n/t.svelte';
	import Icon, { type IconName } from './Icon.svelte';

	let { status }: { status: SyncStatus } = $props();
	const icons: Record<SyncStatus, IconName> = {
		pending: 'clock',
		synced: 'check',
		conflict: 'cloud',
		rejected: 'alert'
	};
</script>

<span class="sync {status}">
	<Icon name={icons[status]} size={16} stroke={2.4} />
	{t(`sync.${status}`)}
</span>

<style>
	.sync {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		border-radius: 999px;
		font-size: var(--vt-fs-14);
		font-weight: 600;
		border: 1.5px solid currentColor;
	}
	.pending {
		color: var(--vt-ink-muted);
		background: var(--vt-chalk);
	}
	.synced {
		color: var(--vt-pass);
		background: var(--vt-pass-fill);
	}
	.conflict {
		color: var(--vt-thread);
		background: var(--vt-thread-tint);
	}
	.rejected {
		color: var(--vt-fail);
		background: var(--vt-fail-fill);
	}
</style>
