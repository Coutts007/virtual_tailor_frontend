import { requireRole } from '$lib/dashboard/guard';

export async function load({ url }) {
	await requireRole(url, ['admin']);
}
