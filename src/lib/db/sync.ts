/**
 * Background synchronisation of the local queue (Section 12.2).
 * 201 → synced · 409 → conflict (tailor resolves) · 404 code_not_found → rejected
 * 422 → keep pending, note after 3 attempts · network/5xx → backoff for 24 h.
 */
import type { ApiClient } from '$lib/api/client';
import { isApiError } from '$lib/api/errors';
import type { MeasurementProfilePayload } from '$lib/api/types';
import { getDb, type LocalProfile, type PendingSync } from './dexie';

export const BACKOFF_MS = [30_000, 60_000, 120_000, 300_000, 900_000, 3_600_000];
export const GIVE_UP_AFTER_MS = 24 * 3_600_000;
export const INVALID_NOTE_AFTER = 3;

export function nextDelay(attempts: number): number {
	return BACKOFF_MS[Math.min(attempts, BACKOFF_MS.length) - 1] ?? BACKOFF_MS[0]!;
}

/** Strip local-only fields; never send anything that is not in the contract. */
export function toPayload(p: LocalProfile): MeasurementProfilePayload {
	const {
		sync_status: _s,
		local_status: _l,
		sync_note: _n,
		synced_at: _a,
		client_id: _c,
		created_at: _cr,
		...payload
	} = p;
	return payload;
}

export interface SyncReport {
	synced: number;
	conflicts: number;
	rejected: number;
	failed: number;
	deletions: number;
}

let running: Promise<SyncReport> | null = null;

/** Single-flight: concurrent triggers share one run. */
export function runSync(api: ApiClient, now = () => Date.now()): Promise<SyncReport> {
	running ??= doSync(api, now).finally(() => (running = null));
	return running;
}

async function doSync(api: ApiClient, now: () => number): Promise<SyncReport> {
	const db = getDb();
	const report: SyncReport = { synced: 0, conflicts: 0, rejected: 0, failed: 0, deletions: 0 };
	const due = (await db.pending_sync.orderBy('created_at').toArray()).filter(
		(o) => Date.parse(o.next_attempt_at) <= now()
	);

	for (const op of due) {
		try {
			if (op.operation === 'create') {
				const p = await db.profiles.get(op.profile_id);
				if (!p) {
					await db.pending_sync.delete(op.op_id!);
					continue;
				}
				await api.syncProfile(toPayload(p));
				await db.transaction('rw', db.profiles, db.pending_sync, async () => {
					await db.profiles.update(p.profile_id, {
						sync_status: 'synced',
						sync_note: null,
						synced_at: new Date(now()).toISOString(),
						covariates: { ...p.covariates, code_verified: true }
					});
					await db.pending_sync.delete(op.op_id!);
				});
				report.synced++;
			} else if (op.deletion) {
				await api.requestDeletion(op.deletion);
				await db.pending_sync.delete(op.op_id!);
				report.deletions++;
			} else {
				await db.pending_sync.delete(op.op_id!);
			}
		} catch (e) {
			await handleFailure(op, e, now(), report);
		}
	}
	return report;
}

async function handleFailure(op: PendingSync, e: unknown, nowMs: number, report: SyncReport) {
	const db = getDb();
	const settle = (status: LocalProfile['sync_status']) =>
		db.transaction('rw', db.profiles, db.pending_sync, async () => {
			await db.profiles.update(op.profile_id, { sync_status: status });
			await db.pending_sync.delete(op.op_id!);
		});

	if (op.operation === 'create' && isApiError(e, 'profile_version_conflict')) {
		await settle('conflict');
		report.conflicts++;
		return;
	}
	if (op.operation === 'create' && isApiError(e, 'code_not_found')) {
		await settle('rejected');
		report.rejected++;
		return;
	}
	report.failed++;
	const attempts = op.attempts + 1;
	const status = isApiError(e) ? e.status : 0;
	const invalid = status === 422 || status === 413;
	const age = nowMs - Date.parse(op.created_at);
	const stale = age >= GIVE_UP_AFTER_MS;
	await db.pending_sync.update(op.op_id!, {
		attempts,
		// After 24 h keep the op pending but retry only on the next app open.
		next_attempt_at: new Date(
			nowMs + (stale ? GIVE_UP_AFTER_MS : nextDelay(attempts))
		).toISOString(),
		last_error: isApiError(e) ? e.code : 'unknown'
	});
	if (op.operation === 'create' && ((invalid && attempts >= INVALID_NOTE_AFTER) || stale)) {
		await db.profiles.update(op.profile_id, { sync_note: invalid ? 'invalid' : 'stale' });
	}
}

/** Ops whose last failure was a network error become due immediately (on 'online'). */
export async function wakeNetworkFailures(nowMs = Date.now()): Promise<void> {
	const iso = new Date(nowMs).toISOString();
	await getDb()
		.pending_sync.filter((o) => o.last_error === 'network_error' || o.last_error === 'unknown')
		.modify({ next_attempt_at: iso });
}

/** On app open, stale ops become due again (the "gentle reminder" retry). */
export async function wakeStaleOps(nowMs = Date.now()): Promise<void> {
	const db = getDb();
	const iso = new Date(nowMs).toISOString();
	await db.pending_sync
		.where('created_at')
		.below(new Date(nowMs - GIVE_UP_AFTER_MS).toISOString())
		.modify({ next_attempt_at: iso });
}

/**
 * Triggers (12.2): app start, online, visibilitychange → visible, a timer, and
 * after save (call runSync directly). Background Sync is a Chromium bonus only.
 */
export function startSyncTriggers(
	api: ApiClient,
	onReport?: (r: SyncReport) => void,
	intervalMs = 60_000
): () => void {
	const go = () => {
		if (navigator.onLine) void runSync(api).then((r) => onReport?.(r));
	};
	// Back online: retry ops that failed for network reasons now, not at their backoff time.
	const onOnline = () => void wakeNetworkFailures().then(go);
	void wakeStaleOps().then(go);
	const onVisible = () => document.visibilityState === 'visible' && go();
	addEventListener('online', onOnline);
	document.addEventListener('visibilitychange', onVisible);
	const timer = setInterval(go, intervalMs);
	const onMessage = (e: MessageEvent) => e.data === 'VT_RUN_SYNC' && go();
	navigator.serviceWorker?.addEventListener('message', onMessage);
	void registerBackgroundSync();
	return () => {
		removeEventListener('online', onOnline);
		document.removeEventListener('visibilitychange', onVisible);
		clearInterval(timer);
		navigator.serviceWorker?.removeEventListener('message', onMessage);
	};
}

async function registerBackgroundSync() {
	try {
		const reg = (await navigator.serviceWorker?.getRegistration()) as
			(ServiceWorkerRegistration & { sync?: { register(tag: string): Promise<void> } }) | undefined;
		await reg?.sync?.register('vt-sync');
	} catch {
		/* not supported (iOS, Firefox): timers and events are enough */
	}
}
