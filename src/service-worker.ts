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
const EXCLUDE = [
	/^\/mockServiceWorker\.js$/,
	/^\/audio\/.*\.md$/,
	/\/\.gitkeep$/,
	/^\/(models|wasm|opencv)\//
];
/** Vision assets: cached only by the client's "Download now" (UX principle 10), served from there. */
const MODEL_CACHE = 'vt-models-v1';
const MODEL_PATH = /^\/(models|wasm|opencv)\//;
/** The SPA shell ('/' serves index.html) is not in build/files, so add it (FR-01 offline). */
export const SHELL = '/';
export const PRECACHE = [SHELL, ...build, ...files].filter(
	(p) => !EXCLUDE.some((re) => re.test(p))
);

export function isApiRequest(url: URL): boolean {
	return url.pathname.startsWith('/api/');
}

sw.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys())
				if (key !== CACHE && key !== MODEL_CACHE) await caches.delete(key);
			await sw.clients.claim();
		})()
	);
});

/** Chromium Background Sync (bonus, 12.2): ask an open client to run the sync queue. */
sw.addEventListener('sync', (event: Event) => {
	const e = event as Event & { tag: string; waitUntil(p: Promise<unknown>): void };
	if (e.tag !== 'vt-sync') return;
	e.waitUntil(
		sw.clients
			.matchAll({ type: 'window' })
			.then((cs) => cs.forEach((c) => c.postMessage('VT_RUN_SYNC')))
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

	if (MODEL_PATH.test(url.pathname)) {
		event.respondWith(
			(async () => (await (await caches.open(MODEL_CACHE)).match(url.pathname)) ?? fetch(req))()
		);
		return;
	}

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			// App routes are all the same SPA shell: cache-first (fast repeat loads on 3G);
			// a new service worker version brings a new shell.
			if (req.mode === 'navigate') {
				const shell = await cache.match(SHELL);
				if (shell) return shell;
				try {
					return await fetch(req);
				} catch {
					return new Response('Offline', { status: 503 });
				}
			}
			const cached = await cache.match(url.pathname);
			if (cached) return cached;
			try {
				return await fetch(req);
			} catch {
				return new Response('Offline', { status: 503 });
			}
		})()
	);
});
