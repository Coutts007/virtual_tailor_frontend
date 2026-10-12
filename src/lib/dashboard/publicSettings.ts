import { api } from '$lib/api';
import type { PublicSettings } from '$lib/api/types';

let cache: { at: number; value: PublicSettings } | null = null;
const TTL_MS = 30_000;

/** Feature switches (study mode) with a short cache; offline falls back to the last value. */
export async function publicSettings(force = false): Promise<PublicSettings> {
	if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.value;
	try {
		const value = await api().getPublicSettings();
		cache = { at: Date.now(), value };
		return value;
	} catch (e) {
		if (cache) return cache.value;
		throw e;
	}
}

export function invalidatePublicSettings(): void {
	cache = null;
}
