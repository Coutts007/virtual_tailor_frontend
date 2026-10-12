/**
 * Dev + mock mode only: resolves once the MSW worker is intercepting requests.
 * API calls wait on this so a page that loads data before the root layout has
 * mounted does not hit the dev server directly. Production builds never import
 * the mock (the dynamic import sits behind import.meta.env.DEV).
 */
let ready: Promise<void> | null = null;

export function mockReady(): Promise<void> {
	if (!import.meta.env.DEV || import.meta.env.VITE_API_MODE === 'http') return Promise.resolve();
	if (
		typeof navigator === 'undefined' ||
		!('serviceWorker' in navigator) ||
		typeof window === 'undefined'
	) {
		return Promise.resolve();
	}
	ready ??= import('../../../mocks/browser').then((m) => m.startMockWorker());
	return ready;
}
