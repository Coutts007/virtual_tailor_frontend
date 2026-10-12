import { http, HttpResponse, delay } from 'msw';
import { createSeed, type Seed } from './seed';

export const API = '*/api/v1';

/** Realistic latency, 150–600 ms (Section 20). Disabled in unit tests. */
let latency = { min: 150, max: 600 };
export function setLatency(min: number, max: number) {
	latency = { min, max };
}
async function wait() {
	if (latency.max > 0) await delay(latency.min + Math.random() * (latency.max - latency.min));
}

/** `?__fail=409` style error simulation on any endpoint. */
function simulatedFailure(request: Request) {
	const fail = new URL(request.url).searchParams.get('__fail');
	if (!fail) return null;
	const status = Number(fail);
	return HttpResponse.json(
		{ type: 'about:blank', title: 'Simulated failure', status, code: 'unknown' },
		{ status, headers: { 'Content-Type': 'application/problem+json' } }
	);
}

let db: Seed = createSeed();
export function resetMockDb() {
	db = createSeed();
}

export const handlers = [
	http.get(`${API}/settings/public`, async ({ request }) => {
		await wait();
		const failure = simulatedFailure(request);
		if (failure) return failure;
		const { study_mode, consent_version, min_app_version } = db.settings;
		return HttpResponse.json({ study_mode, consent_version, min_app_version });
	})
];
