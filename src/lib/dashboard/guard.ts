import { error, redirect } from '@sveltejs/kit';
import { auth } from '$lib/api';
import type { Role } from '$lib/api/types';
import { guard } from '$lib/auth/guards';
import { session } from '$lib/auth/session.svelte';
import { publicSettings } from './publicSettings';

/**
 * Route guard for +layout.ts / +page.ts load functions (Section 7.2). Restores
 * the session from the auth transport first, then applies the pure guard.
 */
export async function requireRole(
	url: URL,
	roles: Role[],
	opts: { studyRoute?: boolean } = {}
): Promise<void> {
	auth();
	let studyMode = true;
	if (opts.studyRoute) {
		try {
			studyMode = (await publicSettings()).study_mode;
		} catch {
			studyMode = false;
		}
	}
	const r = guard(session.user, url.pathname + url.search, roles, {
		studyRoute: opts.studyRoute,
		studyMode
	});
	if (r.ok) return;
	if ('redirect' in r) redirect(307, r.redirect);
	error(r.status, { message: r.reason, code: r.reason });
}
