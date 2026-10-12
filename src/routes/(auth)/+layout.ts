import { loadMessages } from '$lib/i18n/t.svelte';

/** Auth screens use the dashboard strings (loaded on demand, Section 18). */
export async function load() {
	await loadMessages(['tailor']);
}
