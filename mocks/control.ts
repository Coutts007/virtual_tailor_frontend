/**
 * Dev toggles for the mock backend (Section 20): latency on/off and forced
 * failures per endpoint, e.g. { "POST /profiles": 409 }. Stored in localStorage
 * under `vt.mock` (dev only) and edited on /dev/mock.
 */
export interface MockControl {
	latency: boolean;
	failures: Record<string, number>;
}

const KEY = 'vt.mock';
let memory: MockControl = { latency: true, failures: {} };

export function readControl(): MockControl {
	try {
		const raw = globalThis.localStorage?.getItem(KEY);
		if (raw) return { ...memory, ...(JSON.parse(raw) as MockControl) };
	} catch {
		/* node or blocked storage */
	}
	return memory;
}

export function writeControl(c: MockControl): void {
	memory = c;
	try {
		globalThis.localStorage?.setItem(KEY, JSON.stringify(c));
	} catch {
		/* ignore */
	}
}

/** Endpoint keys offered in the dev panel (method + path template). */
export const CONTROL_ENDPOINTS = [
	'GET /settings/public',
	'GET /client-codes/:code',
	'POST /profiles',
	'POST /deletion-requests',
	'POST /auth/login',
	'POST /auth/register',
	'GET /clients',
	'POST /clients',
	'GET /orders',
	'POST /orders',
	'PATCH /orders/:id',
	'POST /orders/:id/sheets',
	'GET /audit',
	'POST /study/reference-readings'
] as const;
