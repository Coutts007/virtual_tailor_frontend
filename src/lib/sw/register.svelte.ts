import { dev } from '$app/environment';
import { API_MODE } from '$lib/api';
import { mockReady } from '$lib/api/mockReady';

/** Shared update state for the "new version ready" toast (Section 9.14). */
export const swState = $state<{ updateReady: boolean; waiting: ServiceWorker | null }>({
	updateReady: false,
	waiting: null
});

/**
 * Dev + mock mode: MSW owns the service-worker scope, the app worker is not
 * registered. Production: register the app worker; MSW is never bundled.
 */
export async function startWorkers(): Promise<void> {
	if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

	if (dev && API_MODE === 'mock') {
		await mockReady();
		return;
	}
	if (dev) return;

	const reg = await navigator.serviceWorker.register('/service-worker.js', { type: 'module' });
	const watch = (w: ServiceWorker | null) => {
		if (!w) return;
		w.addEventListener('statechange', () => {
			if (w.state === 'installed' && navigator.serviceWorker.controller) {
				swState.waiting = w;
				swState.updateReady = true;
			}
		});
	};
	if (reg.waiting && navigator.serviceWorker.controller) {
		swState.waiting = reg.waiting;
		swState.updateReady = true;
	}
	reg.addEventListener('updatefound', () => watch(reg.installing));
	navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
}

/** Never call mid-capture (the capture screen suppresses the toast). */
export function applyUpdate(): void {
	swState.waiting?.postMessage('SKIP_WAITING');
}
