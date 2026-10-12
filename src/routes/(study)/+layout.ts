import { loadMessages } from '$lib/i18n/t.svelte';
import { requireRole } from '$lib/dashboard/guard';

/** Study routes return 404 when study mode is off (Section 7.2). */
export async function load({ url }) {
	// Strings first, so a guard error page can render them (Section 18 lazy i18n).
	await loadMessages(['study', 'tailor']);
	await requireRole(url, ['measurer', 'admin'], { studyRoute: true });
}
