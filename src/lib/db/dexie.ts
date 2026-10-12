import Dexie, { type EntityTable } from 'dexie';
import type { MeasurementProfile } from '$lib/api/types';
import { assertNoImageData } from './imageGuard';

/** Local profile record (Section 12.1). No image fields, ever. */
export interface LocalProfile extends MeasurementProfile {
	status: 'final';
	local_status?: 'draft' | 'final' | 'deleted';
}

export type PendingOperation = 'create' | 'delete' | 'withdraw';
export interface PendingSync {
	op_id?: number;
	created_at: string;
	profile_id: string;
	operation: PendingOperation;
	attempts: number;
	next_attempt_at: string;
	last_error?: string;
}

export interface SettingRow {
	key: string;
	value: unknown;
}

export class VtDatabase extends Dexie {
	profiles!: EntityTable<LocalProfile, 'profile_id'>;
	pending_sync!: EntityTable<PendingSync, 'op_id'>;
	settings!: EntityTable<SettingRow, 'key'>;

	constructor(name = 'virtual-tailor') {
		super(name);
		// Version 1. Migrations must be additive (Section 12.1).
		this.version(1).stores({
			profiles: 'profile_id, client_code, sync_status, captured_at',
			pending_sync: '++op_id, created_at, profile_id',
			settings: 'key'
		});

		// Privacy guard on every write path to every table.
		for (const table of this.tables) {
			table.hook('creating', (_key, obj) => assertNoImageData(obj));
			table.hook('updating', (mods) => {
				assertNoImageData(mods);
				return undefined;
			});
		}
	}
}

let instance: VtDatabase | null = null;

export function getDb(): VtDatabase {
	instance ??= new VtDatabase();
	return instance;
}

/** For tests: replace the singleton. */
export function setDb(db: VtDatabase | null): void {
	instance = db;
}
