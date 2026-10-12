import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';

/** Developer tools exist only in dev builds (Section 8.4). */
export function load() {
	if (!dev) error(404, 'Not found');
}
