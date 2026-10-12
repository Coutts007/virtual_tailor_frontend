import type { LoginResponse, SessionUser } from '$lib/api/types';

/**
 * How the auth token travels (decision 4). The default keeps the bearer token in
 * memory and mirrors it to sessionStorage (cleared when the tab closes). Never
 * localStorage or IndexedDB (Section 19). A cookie transport can replace this
 * without touching the UI.
 */
export interface AuthTransport {
	/** Headers to add to each API request. */
	headers(): Record<string, string>;
	save(login: LoginResponse): void;
	load(): { user: SessionUser; expires_at: string } | null;
	clear(): void;
}

const KEY = 'vt.session';

export class BearerSessionTransport implements AuthTransport {
	private token: string | null = null;
	private user: SessionUser | null = null;
	private expiresAt: string | null = null;

	constructor(private storage: Storage | null = safeSessionStorage()) {
		this.restore();
	}

	headers(): Record<string, string> {
		if (!this.token || this.expired()) return {};
		return { Authorization: `Bearer ${this.token}` };
	}

	save(login: LoginResponse): void {
		this.token = login.access_token;
		this.user = login.user;
		this.expiresAt = login.expires_at;
		try {
			this.storage?.setItem(KEY, JSON.stringify(login));
		} catch {
			/* storage blocked: memory only */
		}
	}

	load() {
		if (!this.user || !this.expiresAt || this.expired()) return null;
		return { user: this.user, expires_at: this.expiresAt };
	}

	clear(): void {
		this.token = this.user = this.expiresAt = null;
		try {
			this.storage?.removeItem(KEY);
		} catch {
			/* ignore */
		}
	}

	private expired(): boolean {
		return !!this.expiresAt && Date.parse(this.expiresAt) <= Date.now();
	}

	private restore() {
		try {
			const raw = this.storage?.getItem(KEY);
			if (!raw) return;
			const login = JSON.parse(raw) as LoginResponse;
			if (Date.parse(login.expires_at) <= Date.now()) {
				this.storage?.removeItem(KEY);
				return;
			}
			this.token = login.access_token;
			this.user = login.user;
			this.expiresAt = login.expires_at;
		} catch {
			/* corrupt entry: ignore */
		}
	}
}

/**
 * Cookie transport (if the backend prefers an httpOnly, Secure, SameSite=Strict
 * cookie). The browser sends the cookie; only the user summary is kept, in memory.
 */
export class CookieTransport implements AuthTransport {
	private session: { user: SessionUser; expires_at: string } | null = null;
	headers() {
		return {};
	}
	save(login: LoginResponse) {
		this.session = { user: login.user, expires_at: login.expires_at };
	}
	load() {
		return this.session && Date.parse(this.session.expires_at) > Date.now() ? this.session : null;
	}
	clear() {
		this.session = null;
	}
}

function safeSessionStorage(): Storage | null {
	try {
		return globalThis.sessionStorage ?? null;
	} catch {
		return null;
	}
}
