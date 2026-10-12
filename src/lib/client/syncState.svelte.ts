/** Client-side sync status for banners and the Saved screen (polite live region). */
import { api } from '$lib/api';
import { getDb } from '$lib/db/dexie';
import { runSync, startSyncTriggers } from '$lib/db/sync';

export const syncState = $state({
	pending: 0,
	stale: false,
	lastRun: 0,
	persisted: true as boolean
});

export async function refreshSyncState(): Promise<void> {
	const db = getDb();
	syncState.pending = await db.pending_sync.count();
	syncState.stale = (await db.profiles.filter((p) => p.sync_note === 'stale').count()) > 0;
}

export async function syncNow(): Promise<void> {
	// Offline: nothing to try; the 'online' trigger will send (12.2).
	if (!navigator.onLine) return refreshSyncState();
	await runSync(api());
	syncState.lastRun = Date.now();
	await refreshSyncState();
}

export function startClientSync(): () => void {
	void refreshSyncState();
	void (async () => {
		try {
			syncState.persisted = (await navigator.storage?.persist?.()) ?? true;
		} catch {
			syncState.persisted = true;
		}
	})();
	return startSyncTriggers(api(), () => {
		syncState.lastRun = Date.now();
		void refreshSyncState();
	});
}
