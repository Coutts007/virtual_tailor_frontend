<script lang="ts">
	/* Mock backend controls (Section 20): latency and forced failures per endpoint. Dev only. */
	import {
		readControl,
		writeControl,
		CONTROL_ENDPOINTS,
		type MockControl
	} from '../../../../mocks/control';
	import { t } from '$lib/i18n/t.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import { toast } from '$lib/ui/toast.svelte';

	let control = $state<MockControl>(readControl());
	const STATUSES = [0, 401, 403, 404, 409, 422, 429, 500, 503];

	$effect(() => writeControl($state.snapshot(control)));

	async function reset() {
		const { resetMockDb } = await import('../../../../mocks/handlers');
		resetMockDb();
		toast('Mock data reset to seed', { tone: 'success' });
	}
</script>

<svelte:head><title>{t('dev.mock.title')} · VT</title></svelte:head>

<main id="main" class="wrap">
	<h1>{t('dev.mock.title')}</h1>
	<p class="vt-muted">
		Settings are stored in this browser (localStorage key <code>vt.mock</code>). Seed accounts use
		the password <code>vt-demo-2026</code>.
	</p>
	<Checkbox bind:checked={control.latency}>Realistic latency (150–600 ms)</Checkbox>

	<h2>Force a failure</h2>
	<table>
		<thead><tr><th>Endpoint</th><th>Respond with</th></tr></thead>
		<tbody>
			{#each CONTROL_ENDPOINTS as ep (ep)}
				<tr>
					<td><code>{ep}</code></td>
					<td>
						<select
							aria-label="Failure for {ep}"
							value={control.failures[ep] ?? 0}
							onchange={(e) => {
								const v = Number((e.currentTarget as HTMLSelectElement).value);
								const f = { ...control.failures };
								if (v) f[ep] = v;
								else delete f[ep];
								control.failures = f;
							}}
						>
							{#each STATUSES as s (s)}<option value={s}>{s === 0 ? 'normal' : s}</option>{/each}
						</select>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<div class="row">
		<Button variant="secondary" onclick={() => (control.failures = {})}>Clear failures</Button>
		<Button variant="danger" onclick={reset}>Reset data to seed</Button>
	</div>
</main>

<style>
	.wrap {
		max-width: 48rem;
		margin: 0 auto;
		padding: var(--vt-s-24) var(--vt-s-16);
		display: grid;
		gap: var(--vt-s-12);
	}
	table {
		border-collapse: collapse;
		width: 100%;
	}
	th,
	td {
		text-align: left;
		padding: var(--vt-s-8);
		border-bottom: 1px solid var(--vt-line);
	}
	select {
		min-height: 40px;
	}
	.row {
		display: flex;
		gap: var(--vt-s-8);
		flex-wrap: wrap;
	}
</style>
