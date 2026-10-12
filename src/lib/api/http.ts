import type { ApiClient } from './client';
import { ApiError, type Problem } from './errors';
import type { PublicSettings } from './types';

export interface HttpOptions {
	baseUrl: string;
	/** Returns extra headers (e.g. Authorization) per request. */
	authHeaders?: () => Record<string, string>;
	fetchImpl?: typeof fetch;
}

export class HttpApiClient implements ApiClient {
	constructor(private opts: HttpOptions) {}

	protected async request<T>(
		method: string,
		path: string,
		body?: unknown,
		headers: Record<string, string> = {}
	): Promise<T> {
		const f = this.opts.fetchImpl ?? fetch;
		let res: Response;
		try {
			res = await f(`${this.opts.baseUrl}${path}`, {
				method,
				headers: {
					Accept: 'application/json',
					...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
					...(this.opts.authHeaders?.() ?? {}),
					...headers
				},
				body: body !== undefined ? JSON.stringify(body) : undefined,
				credentials: 'same-origin',
				cache: 'no-store'
			});
		} catch {
			throw new ApiError({ status: 0, code: 'network_error', title: 'Network error' });
		}
		if (res.status === 204) return undefined as T;
		const type = res.headers.get('Content-Type') ?? '';
		if (!res.ok) {
			let problem: Problem = { status: res.status, code: 'unknown' };
			if (type.includes('json')) problem = { ...problem, ...(await res.json()) };
			const ra = res.headers.get('Retry-After');
			if (ra) problem.retry_after_s = Number(ra);
			throw new ApiError(problem);
		}
		if (type.includes('json')) return (await res.json()) as T;
		return (await res.text()) as T;
	}

	getPublicSettings(): Promise<PublicSettings> {
		return this.request('GET', '/settings/public');
	}
}
