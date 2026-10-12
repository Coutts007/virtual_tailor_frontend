<script lang="ts">
	import type { OrderStatus } from '$lib/api/types';
	import { t } from '$lib/i18n/t.svelte';

	let { status }: { status: OrderStatus } = $props();
</script>

<span class="chip {status}">{t(`status.${status}`)}</span>

<style>
	.chip {
		display: inline-flex;
		align-items: center;
		padding: 2px 10px;
		border-radius: 999px;
		font-size: var(--vt-fs-14);
		font-weight: 700;
		border: 1.5px solid currentColor;
		white-space: nowrap;
	}
	.new {
		color: var(--vt-thread);
		background: var(--vt-thread-tint);
	}
	.cutting,
	.fitting {
		color: var(--vt-check-ink);
		background: var(--vt-check-fill);
	}
	.ready {
		color: var(--vt-pass);
		background: var(--vt-pass-fill);
	}
	.collected {
		color: var(--vt-ink-muted);
		background: var(--vt-chalk);
	}
</style>
