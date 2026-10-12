import { error } from '@sveltejs/kit';

export function load({ params }) {
	if (params.view !== 'front' && params.view !== 'side') error(404, 'Not found');
	return { view: params.view as 'front' | 'side' };
}
