import { isApiError } from '$lib/api/errors';

/**
 * Small loader for dashboard data: keeps the last loaded value visible when a
 * reload fails (offline), and records when it was last updated (Section 13).
 */
export class Resource<T> {
	data = $state<T | null>(null);
	loading = $state(false);
	error = $state<unknown>(null);
	updatedAt = $state<Date | null>(null);
	#seq = 0;

	constructor(private fetcher: () => Promise<T>) {}

	async load(): Promise<void> {
		const seq = ++this.#seq;
		this.loading = true;
		this.error = null;
		try {
			const value = await this.fetcher();
			if (seq !== this.#seq) return;
			this.data = value;
			// Replaced, never mutated.

			this.updatedAt = new Date();
		} catch (e) {
			if (seq !== this.#seq) return;
			this.error = e;
		} finally {
			if (seq === this.#seq) this.loading = false;
		}
	}

	get offlineError(): boolean {
		return isApiError(this.error, 'network_error');
	}
}
