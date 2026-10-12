<script lang="ts" module>
	export interface Column {
		key: string;
		label: string;
		align?: 'start' | 'end';
		/** Hide the column label inside stacked cards (e.g. the card title). */
		primary?: boolean;
	}
</script>

<script lang="ts" generics="Row">
	import type { Snippet } from 'svelte';
	import { t } from '$lib/i18n/t.svelte';

	/**
	 * Responsive table: a real <table> at ≥ 768 px, stacked cards below
	 * (Section 8.4). The same cell snippet renders both.
	 */
	let {
		columns,
		rows,
		key,
		cell,
		caption,
		onrowclick
	}: {
		columns: Column[];
		rows: Row[];
		key: (row: Row) => string;
		cell: Snippet<[Row, Column]>;
		caption?: string;
		onrowclick?: (row: Row) => void;
	} = $props();
</script>

<div class="dt" class:clickable={!!onrowclick}>
	<table>
		{#if caption}<caption class="vt-visually-hidden">{caption}</caption>{/if}
		<thead>
			<tr>
				{#each columns as c (c.key)}
					<th scope="col" class:end={c.align === 'end'}>{c.label}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as row (key(row))}
				<tr onclick={() => onrowclick?.(row)}>
					{#each columns as c (c.key)}
						<td class:end={c.align === 'end'} class:primary={c.primary} data-label={c.label}>
							{#if !c.primary}<span class="cardlabel" aria-hidden="true">{c.label}</span>{/if}
							<span class="val">{@render cell(row, c)}</span>
						</td>
					{/each}
				</tr>
			{:else}
				<tr><td colspan={columns.length} class="none">{t('table.noRows')}</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	/*
	 * Table or stacked cards by the space available in em, so 200% text zoom
	 * switches to cards instead of overflowing (WCAG 1.4.4 / 1.4.10).
	 */
	.dt {
		width: 100%;
		container-type: inline-size;
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}
	th {
		text-align: left;
		font-size: var(--vt-fs-14);
		color: var(--vt-ink-muted);
		font-weight: 700;
		padding: var(--vt-s-8) var(--vt-s-12);
		border-bottom: 2px solid var(--vt-line);
	}
	td {
		padding: var(--vt-s-12);
		border-bottom: 1px solid var(--vt-line);
		vertical-align: top;
	}
	.end {
		text-align: right;
	}
	.clickable tbody tr {
		cursor: pointer;
	}
	.clickable tbody tr:hover {
		background: var(--vt-thread-tint);
	}
	.cardlabel {
		display: none;
	}
	.none {
		text-align: center;
		color: var(--vt-ink-muted);
	}

	@container (max-width: 47.99em) {
		thead {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip: rect(0 0 0 0);
		}
		table,
		tbody,
		tr,
		td {
			display: block;
		}
		tr {
			margin-bottom: var(--vt-s-12);
			padding: var(--vt-s-12) var(--vt-s-16);
			border: 1px solid var(--vt-line);
			border-radius: var(--vt-radius);
			background: var(--vt-paper);
			box-shadow: var(--vt-shadow);
		}
		td {
			display: flex;
			justify-content: space-between;
			gap: var(--vt-s-12);
			padding: var(--vt-s-4) 0;
			border: 0;
			text-align: right;
		}
		td.primary {
			display: block;
			text-align: left;
			font-size: var(--vt-fs-18);
			font-weight: 700;
			padding-bottom: var(--vt-s-8);
		}
		.cardlabel {
			display: block;
			color: var(--vt-ink-muted);
			font-size: var(--vt-fs-14);
			text-align: left;
		}
	}
</style>
