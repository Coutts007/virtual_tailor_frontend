import type { SessionUser } from '$lib/api/types';
import type { AuthTransport } from './transport';

/**
 * Reactive auth session. Auto sign-out at expiry with an "ended" reason so the
 * login screen can say "Your session ended" (Section 19).
 */
export const session = $state<{
	user: SessionUser | null;
	expires_at: string | null;
	ended: 'expired' | 'signed_out' | null;
}>({ user: null, expires_at: null, ended: null });

let timer: ReturnType<typeof setTimeout> | undefined;
let transport: AuthTransport | null = null;
let listeners: (() => void)[] = [];

export function initSession(t: AuthTransport): void {
	transport = t;
	const s = t.load();
	if (s) apply(s.user, s.expires_at);
}

export function startSession(user: SessionUser, expires_at: string): void {
	session.ended = null;
	apply(user, expires_at);
}

/** Clears the token and every in-memory store registered with onSignOut. */
export function endSession(reason: 'expired' | 'signed_out'): void {
	clearTimeout(timer);
	transport?.clear();
	session.user = null;
	session.expires_at = null;
	session.ended = reason;
	for (const l of listeners) l();
}

/** Domain stores register here so sign-out wipes their in-memory data. */
export function onSignOut(fn: () => void): () => void {
	listeners.push(fn);
	return () => {
		listeners = listeners.filter((l) => l !== fn);
	};
}

function apply(user: SessionUser, expires_at: string) {
	session.user = user;
	session.expires_at = expires_at;
	clearTimeout(timer);
	const ms = Date.parse(expires_at) - Date.now();
	// setTimeout overflows above ~24.8 days; tokens are 24 h.
	timer = setTimeout(() => endSession('expired'), Math.max(0, Math.min(ms, 2 ** 31 - 1)));
}
