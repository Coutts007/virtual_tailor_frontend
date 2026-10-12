/**
 * Self-hosted model and WASM assets (Section 5, privacy invariant 3), listed by
 * scripts/vendor-assets.mjs. Sizes drive the "about N MB" messages and the
 * download progress (UX principle 10). The service worker never precaches
 * these; they enter Cache Storage only after the client taps "Download now".
 */
import manifest from './asset-manifest.json';

export const MODEL_ASSETS: { url: string; bytes: number }[] = manifest.assets;
export const MODEL_DOWNLOAD_MB = Math.max(
	1,
	Math.round(MODEL_ASSETS.reduce((s, a) => s + a.bytes, 0) / 1e6)
);

export const MODEL_CACHE_NAME = 'vt-models-v1';
const CACHE = MODEL_CACHE_NAME;

export async function modelsCached(): Promise<boolean> {
	if (!MODEL_ASSETS.length) return true;
	try {
		const c = await caches.open(CACHE);
		for (const a of MODEL_ASSETS) if (!(await c.match(a.url))) return false;
		return true;
	} catch {
		return false;
	}
}

/**
 * Downloads every model/WASM file into Cache Storage with progress, retrying
 * each file up to 3 times (10.5). Only after the user taps "Download now".
 */
export async function downloadModels(
	onProgress: (loaded: number, total: number) => void
): Promise<boolean> {
	const total = MODEL_ASSETS.reduce((s, a) => s + a.bytes, 0);
	let loaded = 0;
	onProgress(0, total);
	let cache: Cache;
	try {
		cache = await caches.open(CACHE);
	} catch {
		return false;
	}
	for (const a of MODEL_ASSETS) {
		if (await cache.match(a.url)) {
			loaded += a.bytes;
			onProgress(loaded, total);
			continue;
		}
		let ok = false;
		for (let attempt = 0; attempt < 3 && !ok; attempt++) {
			try {
				const res = await fetch(a.url, { cache: 'no-store' });
				if (!res.ok || !res.body) throw new Error(String(res.status));
				const reader = res.body.getReader();
				const chunks: Uint8Array[] = [];
				let got = 0;
				for (;;) {
					const { done, value } = await reader.read();
					if (done) break;
					chunks.push(value);
					got += value.length;
					onProgress(loaded + got, total);
				}
				await cache.put(
					a.url,
					new Response(new Blob(chunks as BlobPart[]), { headers: res.headers })
				);
				loaded += a.bytes;
				ok = true;
			} catch {
				/* retry */
			}
		}
		if (!ok) return false;
	}
	onProgress(total, total);
	return true;
}
