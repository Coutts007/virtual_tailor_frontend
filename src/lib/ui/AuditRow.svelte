<script lang="ts">
	import type { AuditEntry } from '$lib/api/types';
	import { formatDateTime, t } from '$lib/i18n/t.svelte';

	let { entry, showUser = false }: { entry: AuditEntry; showUser?: boolean } = $props();
</script>

<li class="audit">
	<time class="when vt-num" datetime={entry.occurred_at}>{formatDateTime(entry.occurred_at)}</time>
	<span class="what">
		<span class="action">{t(`audit.action.${entry.action}`)}</span>
		<span class="entity">{entry.summary}</span>
	</span>
	{#if showUser}<span class="who vt-small vt-muted">{entry.user_email} · {entry.role}</span>{/if}
</li>

<style>
	.audit {
		display: grid;
		grid-template-columns: 11rem 1fr;
		gap: var(--vt-s-4) var(--vt-s-16);
		padding: var(--vt-s-12) 0;
		border-bottom: 1px solid var(--vt-line);
		list-style: none;
	}
	.when {
		color: var(--vt-ink-muted);
		font-size: var(--vt-fs-14);
	}
	.what {
		display: grid;
	}
	.action {
		font-weight: 700;
	}
	.who {
		grid-column: 2;
	}
	@media (max-width: 540px) {
		.audit {
			grid-template-columns: 1fr;
		}
		.who {
			grid-column: 1;
		}
	}
</style>
