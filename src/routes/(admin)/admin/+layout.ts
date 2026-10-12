import { loadMessages } from '$lib/i18n/t.svelte';
import { requireRole } from '$lib/dashboard/guard';

export async function load({ url }) {
	// Strings first, so a guard error page can render them (Section 18 lazy i18n).
	await loadMessages(['tailor', 'admin', 'study']);
	await requireRole(url, ['admin']);
}
