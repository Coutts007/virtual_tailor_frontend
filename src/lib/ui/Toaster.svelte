<script lang="ts">
	import { t } from '$lib/i18n/t.svelte';
	import Icon from './Icon.svelte';
	import { dismiss, toasts } from './toast.svelte';
</script>

<div class="toaster" role="status" aria-live="polite">
	{#each toasts.items as item (item.id)}
		<div class="toast {item.tone}">
			<Icon
				name={item.tone === 'error' ? 'alert' : item.tone === 'success' ? 'check' : 'info'}
				size={20}
			/>
			<span class="text">{item.text}</span>
			{#if item.action}
				<button
					type="button"
					class="act"
					onclick={() => {
						item.action!.run();
						dismiss(item.id);
					}}>{item.action.label}</button
				>
			{/if}
			<button
				type="button"
				class="x"
				aria-label={t('common.close')}
				onclick={() => dismiss(item.id)}
			>
				<Icon name="x" size={18} />
			</button>
		</div>
	{/each}
</div>

<style>
	.toaster {
		position: fixed;
		left: 50%;
		bottom: calc(var(--vt-s-16) + var(--vt-safe-bottom) + var(--vt-toast-offset, 0px));
		transform: translateX(-50%);
		display: grid;
		gap: var(--vt-s-8);
		width: min(28rem, calc(100vw - 2rem));
		z-index: 950;
		pointer-events: none;
	}
	.toast {
		display: flex;
		align-items: center;
		gap: var(--vt-s-8);
		padding: var(--vt-s-8) var(--vt-s-8) var(--vt-s-8) var(--vt-s-16);
		background: var(--vt-ink);
		color: var(--vt-chalk);
		border-radius: var(--vt-radius);
		box-shadow: var(--vt-shadow-lg);
		pointer-events: auto;
	}
	.success :global(.icon) {
		color: #7ee2a5;
	}
	.error :global(.icon) {
		color: #ff9b91;
	}
	.text {
		flex: 1;
	}
	.act {
		min-height: 40px;
		padding: 0 var(--vt-s-12);
		border: 0;
		border-radius: var(--vt-radius);
		background: var(--vt-chalk);
		color: var(--vt-ink);
		font-weight: 700;
		cursor: pointer;
	}
	.x {
		width: 40px;
		height: 40px;
		border: 0;
		background: transparent;
		color: inherit;
		cursor: pointer;
	}
</style>
