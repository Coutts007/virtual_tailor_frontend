<script lang="ts">
	import type { Snippet } from 'svelte';
	import { t } from '$lib/i18n/t.svelte';
	import Icon from './Icon.svelte';

	/**
	 * Modal dialog on the native <dialog> element: showModal() makes the rest of
	 * the page inert and traps focus; Escape closes. Focus returns to the opener.
	 */
	let {
		open = $bindable(false),
		title,
		variant = 'center',
		onclose,
		children,
		actions
	}: {
		open?: boolean;
		title: string;
		variant?: 'center' | 'sheet';
		onclose?: () => void;
		children: Snippet;
		actions?: Snippet;
	} = $props();

	let el: HTMLDialogElement | undefined = $state();
	let opener: Element | null = null;
	const titleId = `dlg-${Math.random().toString(36).slice(2, 8)}`;

	$effect(() => {
		if (!el) return;
		if (open && !el.open) {
			opener = document.activeElement;
			el.showModal();
		} else if (!open && el.open) {
			el.close();
		}
	});

	function handleClose() {
		open = false;
		onclose?.();
		if (opener instanceof HTMLElement) opener.focus();
	}

	function backdrop(e: MouseEvent) {
		if (e.target === el) open = false;
	}
</script>

<dialog
	bind:this={el}
	class={variant}
	aria-labelledby={titleId}
	onclose={handleClose}
	onclick={backdrop}
>
	<div class="inner">
		{#if variant === 'sheet'}<span class="grab" aria-hidden="true"></span>{/if}
		<header>
			<h2 id={titleId}>{title}</h2>
			<button
				type="button"
				class="close"
				aria-label={t('common.close')}
				onclick={() => (open = false)}
			>
				<Icon name="x" />
			</button>
		</header>
		<div class="body">{@render children()}</div>
		{#if actions}<footer>{@render actions()}</footer>{/if}
	</div>
</dialog>

<style>
	dialog {
		border: 0;
		padding: 0;
		background: var(--vt-paper);
		color: var(--vt-ink);
		box-shadow: var(--vt-shadow-lg);
		max-height: 90dvh;
	}
	dialog::backdrop {
		background: rgb(14 14 16 / 0.55);
	}
	.center {
		width: min(32rem, calc(100vw - 2rem));
		border-radius: var(--vt-radius-lg);
	}
	.sheet {
		width: 100%;
		max-width: 40rem;
		margin: auto auto 0;
		border-radius: var(--vt-radius-lg) var(--vt-radius-lg) 0 0;
		padding-bottom: var(--vt-safe-bottom);
	}
	.sheet[open] {
		animation: up var(--vt-duration) ease-out;
	}
	@keyframes up {
		from {
			transform: translateY(40px);
			opacity: 0.5;
		}
	}
	.inner {
		display: grid;
		gap: var(--vt-s-12);
		padding: var(--vt-s-16) var(--vt-s-24) var(--vt-s-24);
	}
	.grab {
		justify-self: center;
		width: 40px;
		height: 4px;
		border-radius: 2px;
		background: var(--vt-line-strong);
	}
	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--vt-s-12);
	}
	h2 {
		margin: var(--vt-s-8) 0 0;
	}
	.close {
		flex: none;
		width: var(--vt-target);
		height: var(--vt-target);
		margin: -4px -12px 0 0;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--vt-ink);
		cursor: pointer;
	}
	footer {
		display: flex;
		flex-wrap: wrap;
		gap: var(--vt-s-8);
		justify-content: flex-end;
	}
</style>
