<script lang="ts" module>
	import type { OrderStatus as S } from '$lib/api/types';
	export const FLOW: S[] = ['new', 'cutting', 'fitting', 'ready', 'collected'];
</script>

<script lang="ts">
	import type { OrderStatus } from '$lib/api/types';
	import { t } from '$lib/i18n/t.svelte';
	import BottomSheet from '$lib/ui/BottomSheet.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import Icon from '$lib/ui/Icon.svelte';

	/** Five statuses in a bottom sheet; moving backwards asks for confirmation (Section 13.7). */
	let {
		open = $bindable(false),
		current,
		orderNo,
		onchoose
	}: {
		open?: boolean;
		current: OrderStatus;
		orderNo: string;
		onchoose: (s: OrderStatus) => Promise<void> | void;
	} = $props();

	let back = $state<OrderStatus | null>(null);
	let busy = $state(false);

	async function pick(s: OrderStatus) {
		if (s === current) return void (open = false);
		if (FLOW.indexOf(s) < FLOW.indexOf(current)) {
			back = s;
			return;
		}
		await run(s);
	}
	async function run(s: OrderStatus) {
		busy = true;
		try {
			await onchoose(s);
			open = false;
			back = null;
		} finally {
			busy = false;
		}
	}
</script>

<BottomSheet bind:open title={t('tailor.status.title', { no: orderNo })}>
	<ul class="opts">
		{#each FLOW as s (s)}
			<li>
				<button
					type="button"
					class="opt"
					aria-pressed={s === current}
					disabled={busy}
					onclick={() => pick(s)}
				>
					<span class="dot" class:on={FLOW.indexOf(s) <= FLOW.indexOf(current)} aria-hidden="true"
					></span>
					<span>{t(`status.${s}`)}</span>
					{#if s === current}<Icon name="check" size={20} label={t('tailor.status.current')} />{/if}
				</button>
			</li>
		{/each}
	</ul>
</BottomSheet>

<Dialog open={back !== null} onclose={() => (back = null)} title={t('tailor.status.backTitle')}>
	<p>
		{t('tailor.status.backBody', {
			from: t(`status.${current}`),
			to: back ? t(`status.${back}`) : ''
		})}
	</p>
	{#snippet actions()}
		<Button variant="text" onclick={() => (back = null)}>{t('common.cancel')}</Button>
		<Button loading={busy} onclick={() => back && run(back)}
			>{t('tailor.status.backConfirm')}</Button
		>
	{/snippet}
</Dialog>

<style>
	.opts {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--vt-s-4);
	}
	.opt {
		display: flex;
		align-items: center;
		gap: var(--vt-s-12);
		width: 100%;
		min-height: 52px;
		padding: 0 var(--vt-s-16);
		border: 2px solid var(--vt-line);
		border-radius: var(--vt-radius);
		background: var(--vt-paper);
		color: var(--vt-ink);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
		text-align: left;
	}
	.opt span:nth-child(2) {
		flex: 1;
	}
	.opt[aria-pressed='true'] {
		border-color: var(--vt-thread);
		background: var(--vt-thread-tint);
	}
	.dot {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 2px solid var(--vt-line-strong);
	}
	.dot.on {
		background: var(--vt-thread);
		border-color: var(--vt-thread);
	}
</style>
