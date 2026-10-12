import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '../../src/lib/api/errors';
import type { ReferenceReadingInput } from '../../src/lib/api/types';
import {
	decryptVault,
	encryptVault,
	PBKDF2_ITERATIONS,
	saveVault,
	vaultFileName,
	VaultDisabledError
} from '../../src/lib/study/imageVault';
import {
	enqueueReading,
	flushReadings,
	pendingCount,
	setStudyQueueDb,
	StudyQueueDb
} from '../../src/lib/study/queue';
import { badPrecision, implausible, toMmValues } from '../../src/lib/study/reference';
import { nextParticipantCode } from '../../src/lib/study/participants';

describe('study image vault (Section 15.6)', () => {
	const frames = [
		{ width: 2, height: 2, format: 'gray8', bytes: new Uint8Array([1, 2, 3, 4]) },
		{ width: 1, height: 3, format: 'gray8', bytes: new Uint8Array([9, 8, 7]) }
	];
	const meta = {
		participant_code: 'P001',
		set_no: 2 as const,
		view: 'both' as const,
		created_at: '2026-10-12T08:00:00Z'
	};

	it('AES-GCM round trip with PBKDF2 ≥ 310,000 iterations', async () => {
		expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(310_000);
		const file = await encryptVault(frames, meta, 'correct horse battery');
		expect(new TextDecoder().decode(file.slice(0, 6))).toBe('VTIMG1');
		// The plaintext bytes do not appear in the file.
		expect(Buffer.from(file).includes(Buffer.from([9, 8, 7]))).toBe(false);
		const out = await decryptVault(file, 'correct horse battery');
		expect(out.meta).toMatchObject({ participant_code: 'P001', set_no: 2 });
		expect(out.frames.map((f) => [...f])).toEqual([
			[1, 2, 3, 4],
			[9, 8, 7]
		]);
	}, 20_000);

	it('wrong passphrase fails', async () => {
		const file = await encryptVault(frames, meta, 'correct horse battery');
		await expect(decryptVault(file, 'wrong passphrase!!')).rejects.toThrow();
	}, 20_000);

	it('refuses weaker key derivation', async () => {
		await expect(encryptVault(frames, meta, 'x'.repeat(12), 1000)).rejects.toThrow(/310,000/);
	});

	it('file name holds only participant code and set number', () => {
		expect(vaultFileName('P001', 2)).toBe('P001-set2.vtimg');
	});

	it('is disabled by default (feature flag off, decision 1)', async () => {
		await expect(saveVault(frames, meta, 'correct horse battery')).rejects.toBeInstanceOf(
			VaultDisabledError
		);
	});
});

describe('reference entry helpers (Section 15.2)', () => {
	it('cm to mm, blanks dropped', () => {
		expect(toMmValues({ waist: 81.2, hip: null, neck: undefined })).toEqual({ waist: 812 });
	});
	it('flags implausible values for confirmation', () => {
		expect(implausible({ waist: 120, hip: 1000, neck: 380 })).toEqual(['waist']);
	});
	it('one decimal at most', () => {
		expect(badPrecision(81.25)).toBe(true);
		expect(badPrecision(81.2)).toBe(false);
		expect(badPrecision(null)).toBe(false);
	});
	it('next participant code', () => {
		expect(nextParticipantCode(['P001', 'P005', 'P003'])).toBe('P006');
		expect(nextParticipantCode([])).toBe('P001');
	});
});

describe('offline reading queue', () => {
	const input = (code: string, n: 1 | 2): ReferenceReadingInput => ({
		participant_code: code,
		reading_no: n,
		values: { waist: 812 },
		taken_at: '2026-10-12T08:00:00Z'
	});
	beforeEach(async () => {
		const db = new StudyQueueDb(`vt-study-test-${crypto.randomUUID()}`);
		await db.open();
		setStudyQueueDb(db);
	});

	it('stops at a network failure and keeps the readings', async () => {
		await enqueueReading(input('P001', 1));
		await enqueueReading(input('P002', 1));
		const offline = {
			submitReferenceReading: () =>
				Promise.reject(new ApiError({ status: 0, code: 'network_error' }))
		};
		expect(await flushReadings(offline)).toEqual([]);
		expect(await pendingCount()).toBe(2);
	});

	it('sends in order; locked readings are dropped and reported', async () => {
		await enqueueReading(input('P001', 1));
		await enqueueReading(input('P002', 1));
		const api = {
			submitReferenceReading: (i: ReferenceReadingInput) =>
				i.participant_code === 'P002'
					? Promise.reject(new ApiError({ status: 409, code: 'reading_locked' }))
					: Promise.resolve({
							reading_id: 'r',
							participant_code: i.participant_code,
							reading_no: i.reading_no,
							measurer_code: 'A',
							locked: true as const,
							out_of_order: false
						})
		};
		const out = await flushReadings(api);
		expect(out.map((o) => o.kind)).toEqual(['sent', 'locked']);
		expect(await pendingCount()).toBe(0);
	});
});
