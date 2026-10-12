/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `vt-shell-${version}`;

/**
 * Precache the app shell, static assets, model files, WASM, fonts and the marker
 * sheet PDF. Never API responses (privacy invariant 2.1.4).
 */
const EXCLUDE = [/^\/mockServiceWorker\.js$/, /^\/audio\/.*\.md$/, /\/\.gitkeep$/];
export const PRECACHE = [...build, ...files].filter((p) => !EXCLUDE.some((re) => re.test(p)));

export function isApiRequest(url: URL): boolean {
	return url.pathname.startsWith('/api/');
}

sw.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
			await sw.clients.claim();
		})()
	);
});

sw.addEventListener('message', (event) => {
	if (event.data === 'SKIP_WAITING') void sw.skipWaiting();
});

sw.addEventListener('fetch', (event) => {
	const req = event.request;
	if (req.method !== 'GET') return;
	const url = new URL(req.url);
	if (url.origin !== sw.location.origin) return; // API on another origin: network only.
	if (isApiRequest(url)) return; // Never cache API responses.

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			const cached = await cache.match(url.pathname);
			if (cached) return cached;
			try {
				return await fetch(req);
			} catch {
				// SPA navigation offline: serve the shell.
				if (req.mode === 'navigate') {
					const shell = await cache.match('/index.html');
					if (shell) return shell;
				}
				return new Response('Offline', { status: 503 });
			}
		})()
	);
});
