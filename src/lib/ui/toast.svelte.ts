/** Toast queue (Section 8.4). Polite live region; at most 3 visible. */
export interface ToastItem {
	id: number;
	text: string;
	tone: 'info' | 'success' | 'error';
	action?: { label: string; run: () => void };
	timeout: number;
}

export const toasts = $state<{ items: ToastItem[] }>({ items: [] });
let seq = 0;

export function toast(text: string, opts: Partial<Omit<ToastItem, 'id' | 'text'>> = {}): number {
	const item: ToastItem = { id: ++seq, text, tone: 'info', timeout: 5000, ...opts };
	toasts.items = [...toasts.items.slice(-2), item];
	if (item.timeout > 0) setTimeout(() => dismiss(item.id), item.timeout);
	return item.id;
}

export function dismiss(id: number): void {
	toasts.items = toasts.items.filter((t) => t.id !== id);
}
