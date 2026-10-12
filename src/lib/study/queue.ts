import Dexie, { type EntityTable } from 'dexie';
import type { ApiClient } from '$lib/api/client';
import { ApiError } from '$lib/api/errors';
import type { ReferenceReadingInput, ReferenceReadingResult } from '$lib/api/types';
import { assertNoImageData } from '$lib/db/imageGuard';

/**
 * Offline queue for reference tape readings (Section 15.2). A separate small
 * database so the main client schema stays untouched.
 */
export interface QueuedReading {
	id?: number;
	created_at: string;
	input: ReferenceReadingInput;
	attempts: number;
	last_error?: string;
}

export class StudyQueueDb extends Dexie {
	readings!: EntityTable<QueuedReading, 'id'>;
	constructor(name = 'vt-study') {
		super(name);
		this.version(1).stores({ readings: '++id, created_at' });
		for (const table of this.tables) {
			table.hook('creating', (_k, obj) => assertNoImageData(obj));
			table.hook('updating', (mods) => {
				assertNoImageData(mods);
				return undefined;
			});
		}
	}
}

let db: StudyQueueDb | null = null;
export function studyQueueDb(): StudyQueueDb {
	db ??= new StudyQueueDb();
	return db;
}
export function setStudyQueueDb(d: StudyQueueDb | null): void {
	db = d;
}

export async function enqueueReading(input: ReferenceReadingInput): Promise<void> {
	await studyQueueDb().readings.add({ created_at: new Date().toISOString(), input, attempts: 0 });
}

export async function pendingCount(): Promise<number> {
	return studyQueueDb().readings.count();
}

export type FlushOutcome =
	| { kind: 'sent'; input: ReferenceReadingInput; result: ReferenceReadingResult }
	| { kind: 'locked'; input: ReferenceReadingInput }
	| { kind: 'rejected'; input: ReferenceReadingInput; code: string };

/**
 * Sends queued readings in order. Stops at the first network failure (still
 * offline). A locked or rejected reading is removed and reported, because a
 * retry can never succeed.
 */
export async function flushReadings(
	api: Pick<ApiClient, 'submitReferenceReading'>
): Promise<FlushOutcome[]> {
	const out: FlushOutcome[] = [];
	const items = await studyQueueDb().readings.orderBy('created_at').toArray();
	for (const item of items) {
		try {
			const result = await api.submitReferenceReading(item.input);
			await studyQueueDb().readings.delete(item.id!);
			out.push({ kind: 'sent', input: item.input, result });
		} catch (e) {
			if (e instanceof ApiError && e.code === 'network_error') {
				await studyQueueDb().readings.update(item.id!, {
					attempts: item.attempts + 1,
					last_error: 'network_error'
				});
				break;
			}
			if (e instanceof ApiError && e.status >= 500) {
				await studyQueueDb().readings.update(item.id!, {
					attempts: item.attempts + 1,
					last_error: String(e.status)
				});
				break;
			}
			await studyQueueDb().readings.delete(item.id!);
			if (e instanceof ApiError && e.code === 'reading_locked')
				out.push({ kind: 'locked', input: item.input });
			else
				out.push({
					kind: 'rejected',
					input: item.input,
					code: e instanceof ApiError ? e.code : 'unknown'
				});
		}
	}
	return out;
}
