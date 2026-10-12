import type { ApiClient } from './client';
import { HttpApiClient } from './http';
import { BearerSessionTransport, type AuthTransport } from '$lib/auth/transport';
import { endSession, initSession } from '$lib/auth/session.svelte';

export type ApiMode = 'mock' | 'http';
export const API_MODE: ApiMode = import.meta.env.VITE_API_MODE === 'http' ? 'http' : 'mock';
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api/v1';

let client: ApiClient | null = null;
let transport: AuthTransport | null = null;

/** The auth transport (decision 4). Swap for CookieTransport if the backend prefers cookies. */
export function auth(): AuthTransport {
	if (!transport) {
		transport = new BearerSessionTransport();
		initSession(transport);
	}
	return transport;
}

/**
 * In both modes the UI uses the same HttpApiClient. In mock mode, MSW intercepts
 * fetch at the network layer (see mocks/), so swapping to the real backend is a
 * single environment variable change (VITE_API_MODE=http).
 */
export function api(): ApiClient {
	client ??= new HttpApiClient({
		baseUrl: API_BASE_URL,
		authHeaders: () => auth().headers(),
		onUnauthorized: () => endSession('expired')
	});
	return client;
}

export function setApi(c: ApiClient | null): void {
	client = c;
}

export type { ApiClient };
