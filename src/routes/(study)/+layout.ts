import { requireRole } from '$lib/dashboard/guard';

/** Study routes return 404 when study mode is off (Section 7.2). */
export async function load({ url }) {
	await requireRole(url, ['measurer', 'admin'], { studyRoute: true });
}
