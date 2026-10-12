/**
 * Local measurement profiles (Section 12). Writes happen before the UI says
 * "Saved" (NFR-08). Deletion is immediate locally and queued for the server.
 */
import type { ConsentRecord, MeasurementProfilePayload } from '$lib/api/types';
import { getDb, type LocalProfile, type PendingSync } from './dexie';
import { deleteSettings } from './settings';

export type NewProfile = Omit<MeasurementProfilePayload, 'version'>;

/** Highest local version for this code + 1 (12.2). */
export async function nextVersion(client_code: string): Promise<number> {
	const rows = await getDb().profiles.where('client_code').equals(client_code).toArray();
	return Math.max(0, ...rows.map((r) => r.version)) + 1;
}

export async function saveProfile(p: NewProfile, now = new Date()): Promise<LocalProfile> {
	const db = getDb();
	return db.transaction('rw', db.profiles, db.pending_sync, async () => {
		const version = await nextVersion(p.client_code);
		const row: LocalProfile = {
			...p,
			version,
			sync_status: 'pending',
			local_status: 'final',
			sync_note: null
		};
		await db.profiles.put(row);
		await db.pending_sync.add({
			created_at: now.toISOString(),
			profile_id: row.profile_id,
			operation: 'create',
			attempts: 0,
			next_attempt_at: now.toISOString()
		});
		return row;
	});
}

export async function listProfiles(): Promise<LocalProfile[]> {
	const rows = await getDb().profiles.toArray();
	return rows
		.filter((r) => r.local_status !== 'deleted')
		.sort((a, b) => b.captured_at.localeCompare(a.captured_at));
}

export function getProfile(id: string): Promise<LocalProfile | undefined> {
	return getDb().profiles.get(id);
}

/**
 * "Delete my data" / "Withdraw consent" (9.12, decision 3): delete local records
 * at once and queue a server deletion request with the profile IDs as proof.
 */
export async function deleteMyData(
	profileIds: string[],
	reason: 'delete' | 'withdraw_consent',
	now = new Date()
): Promise<void> {
	const db = getDb();
	await db.transaction('rw', db.profiles, db.pending_sync, async () => {
		const rows = (await db.profiles.bulkGet(profileIds)).filter((r): r is LocalProfile => !!r);
		const byCode = new Map<string, string[]>();
		for (const r of rows)
			byCode.set(r.client_code, [...(byCode.get(r.client_code) ?? []), r.profile_id]);
		// Unsent creates are simply dropped; the server never saw them.
		const pendingCreates = await db.pending_sync.where('profile_id').anyOf(profileIds).toArray();
		await db.pending_sync.bulkDelete(
			pendingCreates.filter((o) => o.operation === 'create').map((o) => o.op_id!)
		);
		const sentIds = new Set(
			rows.filter((r) => r.sync_status !== 'pending').map((r) => r.profile_id)
		);
		for (const [client_code, ids] of byCode) {
			const sent = ids.filter((id) => sentIds.has(id));
			if (!sent.length) continue;
			const op: PendingSync = {
				created_at: now.toISOString(),
				profile_id: sent[0]!,
				operation: reason === 'delete' ? 'delete' : 'withdraw',
				attempts: 0,
				next_attempt_at: now.toISOString(),
				deletion: { client_code, profile_ids: sent, reason }
			};
			await db.pending_sync.add(op);
		}
		await db.profiles.bulkDelete(profileIds);
	});
	if (reason === 'withdraw_consent') {
		const s = await getDb().settings.get('consent');
		if (s?.value)
			await getDb().settings.put({
				key: 'consent',
				value: { ...(s.value as ConsentRecord), withdrawn_at: now.toISOString() }
			});
	}
}

/**
 * Shared phone (4.2, 9.11): remove this client's details. Profiles that have not
 * been sent yet are kept until they sync; returns how many were kept.
 */
export async function clearThisPhone(): Promise<{ kept: number }> {
	const db = getDb();
	const rows = await db.profiles.toArray();
	const unsent = rows.filter((r) => r.sync_status === 'pending');
	await db.profiles.bulkDelete(
		rows.filter((r) => r.sync_status !== 'pending').map((r) => r.profile_id)
	);
	await deleteSettings([
		'client_code',
		'code_verified',
		'height_mm',
		'sex',
		'clothing_fit',
		'consent',
		'capture_mode'
	]);
	return { kept: unsent.length };
}

/** Rejected code (decision 2): fix the code and send again. */
export async function changeCode(
	profileId: string,
	client_code: string,
	now = new Date()
): Promise<void> {
	const db = getDb();
	await db.transaction('rw', db.profiles, db.pending_sync, async () => {
		const p = await db.profiles.get(profileId);
		if (!p) return;
		const version = await nextVersion(client_code);
		await db.profiles.put({
			...p,
			client_code,
			version,
			covariates: { ...p.covariates, code_verified: false },
			sync_status: 'pending',
			sync_note: null
		});
		await db.pending_sync.where('profile_id').equals(profileId).delete();
		await db.pending_sync.add({
			created_at: now.toISOString(),
			profile_id: profileId,
			operation: 'create',
			attempts: 0,
			next_attempt_at: now.toISOString()
		});
	});
}

export async function pendingCount(): Promise<number> {
	return getDb().pending_sync.count();
}
