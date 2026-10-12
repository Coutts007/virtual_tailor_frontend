import { requireRole } from '$lib/dashboard/guard';

/** Study capture is run by the researcher (role admin), study mode only (15.1). */
export async function load({ url }) {
	await requireRole(url, ['admin'], { studyRoute: true });
}
