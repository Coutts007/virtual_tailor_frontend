import type { ApiClient } from './client';
import { HttpApiClient } from './http';

export type ApiMode = 'mock' | 'http';
export const API_MODE: ApiMode = import.meta.env.VITE_API_MODE === 'http' ? 'http' : 'mock';
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api/v1';

let client: ApiClient | null = null;

/**
 * In both modes the UI uses the same HttpApiClient. In mock mode, MSW intercepts
 * fetch at the network layer (see mocks/), so swapping to the real backend is a
 * single environment variable change (VITE_API_MODE=http).
 */
export function api(): ApiClient {
	client ??= new HttpApiClient({ baseUrl: API_BASE_URL });
	return client;
}

export function setApi(c: ApiClient | null): void {
	client = c;
}

export type { ApiClient };
