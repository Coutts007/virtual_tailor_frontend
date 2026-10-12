import { describe, expect, it } from 'vitest';
import { HttpApiClient } from '../../src/lib/api/http';
import { ApiError } from '../../src/lib/api/errors';

const client = new HttpApiClient({ baseUrl: 'http://localhost/api/v1' });

describe('HttpApiClient against the MSW mock', () => {
	it('reads public settings', async () => {
		const s = await client.getPublicSettings();
		expect(s).toEqual({ study_mode: true, consent_version: '1.0', min_app_version: '0.0.1' });
	});

	it('maps problem+json to ApiError', async () => {
		const failing = new HttpApiClient({
			baseUrl: 'http://localhost/api/v1',
			fetchImpl: (u, i) => fetch(`${u}?__fail=409`, i)
		});
		await expect(failing.getPublicSettings()).rejects.toBeInstanceOf(ApiError);
	});

	it('maps network failure to network_error', async () => {
		const offline = new HttpApiClient({
			baseUrl: 'http://localhost/api/v1',
			fetchImpl: () => Promise.reject(new TypeError('Failed to fetch'))
		});
		await expect(offline.getPublicSettings()).rejects.toMatchObject({ code: 'network_error' });
	});
});
