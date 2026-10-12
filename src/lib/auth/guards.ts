import type { Role, SessionUser } from '$lib/api/types';

/** Where each role lands after login (Section 7.2). */
export const HOME_BY_ROLE: Record<Role, string> = {
	tailor: '/t/orders',
	admin: '/admin/accounts',
	measurer: '/study/reference'
};

export type GuardResult =
	{ ok: true } | { ok: false; redirect: string } | { ok: false; status: 403 | 404; reason: string };

/**
 * Pure guard used by route load functions. `allowed` lists the roles that may
 * open the route; `studyRoute` routes 404 when study mode is off.
 */
export function guard(
	user: SessionUser | null,
	path: string,
	allowed: Role[],
	opts: { studyRoute?: boolean; studyMode?: boolean } = {}
): GuardResult {
	if (opts.studyRoute && !opts.studyMode)
		return { ok: false, status: 404, reason: 'study_mode_off' };
	if (!user) return { ok: false, redirect: `/login?next=${encodeURIComponent(path)}` };
	if (user.status === 'pending')
		return path === '/register/pending'
			? { ok: true }
			: { ok: false, redirect: '/register/pending' };
	if (user.status === 'disabled' || user.status === 'rejected')
		return { ok: false, redirect: '/login?state=disabled' };
	if (!allowed.includes(user.role)) return { ok: false, status: 403, reason: 'forbidden' };
	return { ok: true };
}

export function can(user: SessionUser | null, roles: Role[]): boolean {
	return !!user && user.status === 'active' && roles.includes(user.role);
}
