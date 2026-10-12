<script lang="ts">
	import type { ConsentDoc } from '$lib/i18n/consent';
	import { t } from '$lib/i18n/t.svelte';

	let { doc, table = false }: { doc: ConsentDoc; table?: boolean } = $props();
</script>

<div class="consent">
	{#if !doc.reviewed}<p class="draft vt-small">{t('privacy.unreviewed')}</p>{/if}
	{#each doc.summary as p, i (i)}<p>{p}</p>{/each}
	{#each doc.sections as s (s.heading)}
		<h3>{s.heading}</h3>
		{#each s.paragraphs as p, i (i)}<p>{p}</p>{/each}
		{#if s.list}<ul>
				{#each s.list as li, i (i)}<li>{li}</li>{/each}
			</ul>{/if}
	{/each}
	{#if table}
		<table>
			<thead
				><tr><th scope="col">{t('privacy.onPhone')}</th><th scope="col">{t('privacy.sent')}</th></tr
				></thead
			>
			<tbody>
				<tr>
					<td
						><ul>
							{#each doc.storedTable.onPhone as x, i (i)}<li>{x}</li>{/each}
						</ul></td
					>
					<td
						><ul>
							{#each doc.storedTable.sentToTailor as x, i (i)}<li>{x}</li>{/each}
						</ul></td
					>
				</tr>
			</tbody>
		</table>
	{/if}
</div>

<style>
	h3 {
		margin-top: var(--vt-s-16);
	}
	.draft {
		padding: var(--vt-s-8);
		border-radius: var(--vt-radius);
		background: var(--vt-check-fill);
		color: var(--vt-check-ink);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: var(--vt-s-16);
	}
	th,
	td {
		text-align: left;
		vertical-align: top;
		border: 1px solid var(--vt-line);
		padding: var(--vt-s-8);
	}
	td ul {
		margin: 0;
		padding-left: 1.1rem;
	}
</style>
