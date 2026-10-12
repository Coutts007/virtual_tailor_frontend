import { beforeEach, describe, expect, it } from 'vitest';
import { VtDatabase, setDb, getDb } from '../../src/lib/db/dexie';
import {
	changeCode,
	clearThisPhone,
	deleteMyData,
	listProfiles,
	nextVersion,
	saveProfile,
	type NewProfile
} from '../../src/lib/db/profiles';
import { BACKOFF_MS, nextDelay, runSync, toPayload, wakeStaleOps } from '../../src/lib/db/sync';
import { setSetting, getSetting } from '../../src/lib/db/settings';
import { HttpApiClient } from '../../src/lib/api/http';
import { ApiError } from '../../src/lib/api/errors';
import type { ApiClient } from '../../src/lib/api/client';
import { makeProfile } from '../../mocks/seed';
import { mockDb } from '../../mocks/handlers';

const api = new HttpApiClient({ baseUrl: 'http://localhost/api/v1' });

function draft(code: string, label = crypto.randomUUID()): NewProfile {
	const {
		sync_status: _s,
		client_id: _c,
		created_at: _a,
		version: _v,
		...p
	} = makeProfile({
		label,
		client_code: code,
		version: 1,
		captured_at: new Date().toISOString(),
		sex: 'female',
		height_mm: 1650,
		scenario: 'all_pass'
	});
	return { ...p, profile_id: crypto.randomUUID() };
}

beforeEach(async () => {
	const db = new VtDatabase(`sync-${crypto.randomUUID()}`);
	setDb(db);
	await db.open();
});

describe('local profiles (12.1)', () => {
	it('saves with version = highest local + 1 and queues a create', async () => {
		const a = await saveProfile(draft('QT1200'));
		const b = await saveProfile(draft('QT1200'));
		expect([a.version, b.version]).toEqual([1, 2]);
		expect(await nextVersion('QT1200')).toBe(3);
		expect(await getDb().pending_sync.count()).toBe(2);
		expect(a.sync_status).toBe('pending');
	});

	it('the payload sent never contains local-only fields', async () => {
		const p = await saveProfile(draft('QT1200'));
		const payload = toPayload(p);
		expect(payload).not.toHaveProperty('sync_status');
		expect(payload).not.toHaveProperty('sync_note');
		expect(payload.version).toBe(1);
	});

	it('refuses to store a profile carrying an image', async () => {
		const d = draft('QT1200') as NewProfile & { preview?: string };
		d.preview = 'data:image/jpeg;base64,/9j/';
		await expect(saveProfile(d)).rejects.toThrow();
		expect(await listProfiles()).toHaveLength(0);
	});
});

describe('sync against the mock (12.2)', () => {
	it('201 → synced and the queue empties', async () => {
		const p = await saveProfile(draft('QT1200'));
		const r = await runSync(api);
		expect(r.synced).toBe(1);
		expect((await getDb().profiles.get(p.profile_id))?.sync_status).toBe('synced');
		expect((await getDb().profiles.get(p.profile_id))?.covariates.code_verified).toBe(true);
		expect(await getDb().pending_sync.count()).toBe(0);
	});

	it('404 code_not_found → rejected; changeCode re-queues', async () => {
		const p = await saveProfile(draft('ZZ0000'));
		expect((await runSync(api)).rejected).toBe(1);
		expect((await getDb().profiles.get(p.profile_id))?.sync_status).toBe('rejected');
		await changeCode(p.profile_id, 'QT1200');
		expect((await runSync(api)).synced).toBe(1);
		expect((await getDb().profiles.get(p.profile_id))?.client_code).toBe('QT1200');
	});

	it('409 → conflict, local copy kept', async () => {
		// AB1234 already has v2 on the server; a fresh phone saves v1.
		const p = await saveProfile(draft('AB1234'));
		expect((await runSync(api)).conflicts).toBe(1);
		expect((await getDb().profiles.get(p.profile_id))?.sync_status).toBe('conflict');
	});

	it('network failure → exponential backoff, profile stays pending', async () => {
		const offline = {
			syncProfile: () => Promise.reject(new ApiError({ status: 0, code: 'network_error' }))
		} as unknown as ApiClient;
		const p = await saveProfile(draft('QT1200'));
		const t0 = Date.now();
		await runSync(offline, () => t0);
		const op = (await getDb().pending_sync.toArray())[0]!;
		expect(op.attempts).toBe(1);
		expect(Date.parse(op.next_attempt_at) - t0).toBe(BACKOFF_MS[0]);
		// Not due yet: a second run does nothing.
		await runSync(offline, () => t0 + 1000);
		expect((await getDb().pending_sync.toArray())[0]!.attempts).toBe(1);
		expect((await getDb().profiles.get(p.profile_id))?.sync_status).toBe('pending');
	});

	it('backoff schedule 30 s, 1 m, 2 m, 5 m, 15 m, 1 h, 1 h…', () => {
		expect([1, 2, 3, 4, 5, 6, 7, 20].map(nextDelay)).toEqual([
			30e3, 60e3, 120e3, 300e3, 900e3, 3600e3, 3600e3, 3600e3
		]);
	});

	it('422 three times → "please contact your tailor" note', async () => {
		const bad = {
			syncProfile: () => Promise.reject(new ApiError({ status: 422, code: 'validation_failed' }))
		} as unknown as ApiClient;
		const p = await saveProfile(draft('QT1200'));
		let t = Date.now();
		for (let i = 0; i < 3; i++) {
			await runSync(bad, () => t);
			t += 2 * 3_600_000;
		}
		expect((await getDb().profiles.get(p.profile_id))?.sync_note).toBe('invalid');
		expect((await getDb().profiles.get(p.profile_id))?.sync_status).toBe('pending');
	});

	it('after 24 h the profile is still pending with a stale note; reopening the app retries', async () => {
		const down = {
			syncProfile: () => Promise.reject(new ApiError({ status: 503, code: 'unknown' }))
		} as unknown as ApiClient;
		const p = await saveProfile(draft('QT1200'), new Date(Date.now() - 25 * 3_600_000));
		await runSync(down);
		expect((await getDb().profiles.get(p.profile_id))?.sync_note).toBe('stale');
		await wakeStaleOps();
		expect((await runSync(api)).synced).toBe(1);
	});
});

describe('delete my data and shared phones (9.11, 9.12, decision 3)', () => {
	it('deletes locally at once and sends a deletion request with the profile IDs', async () => {
		const p = await saveProfile(draft('QT1200'));
		await runSync(api);
		await deleteMyData([p.profile_id], 'delete');
		expect(await listProfiles()).toHaveLength(0);
		const before = mockDb().deletionRequests.length;
		expect((await runSync(api)).deletions).toBe(1);
		expect(mockDb().deletionRequests.length).toBe(before + 1);
		expect(mockDb().deletionRequests[0]).toMatchObject({
			client_code: 'QT1200',
			profile_ids: [p.profile_id],
			reason: 'delete'
		});
	});

	it('an unsent profile is dropped without a server request', async () => {
		const p = await saveProfile(draft('QT1200'));
		await deleteMyData([p.profile_id], 'delete');
		expect(await getDb().pending_sync.count()).toBe(0);
	});

	it('withdraw consent records withdrawn_at', async () => {
		await setSetting('consent', {
			consent_version: '1.0',
			language: 'en',
			scope: ['measure'],
			given_at: new Date().toISOString()
		});
		const p = await saveProfile(draft('QT1200'));
		await runSync(api);
		await deleteMyData([p.profile_id], 'withdraw_consent');
		expect((await getSetting('consent'))?.withdrawn_at).toBeTruthy();
		expect((await getDb().pending_sync.toArray())[0]?.operation).toBe('withdraw');
	});

	it('clear this phone keeps unsent profiles and removes the details', async () => {
		await setSetting('client_code', 'QT1200');
		await setSetting('height_mm', 1650);
		const sent = await saveProfile(draft('QT1200'));
		await runSync(api);
		await saveProfile(draft('QT1200'));
		expect(await clearThisPhone()).toEqual({ kept: 1 });
		expect(await getSetting('client_code')).toBeUndefined();
		expect(await getDb().profiles.get(sent.profile_id)).toBeUndefined();
	});
});

describe('coming back online', () => {
	it('network failures become due immediately instead of waiting for backoff', async () => {
		const { wakeNetworkFailures } = await import('../../src/lib/db/sync');
		const offline = {
			syncProfile: () => Promise.reject(new ApiError({ status: 0, code: 'network_error' }))
		} as unknown as ApiClient;
		await saveProfile(draft('QT1200'));
		await runSync(offline);
		expect((await runSync(api)).synced).toBe(0); // backoff: not due yet
		await wakeNetworkFailures();
		expect((await runSync(api)).synced).toBe(1);
	});
});
