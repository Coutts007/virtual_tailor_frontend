import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { api } from '$lib/api';
import { endSession } from '$lib/auth/session.svelte';

/** Sign out: tell the server (best effort), clear token and in-memory stores. */
export async function signOut(): Promise<void> {
	try {
		await api().logout();
	} catch {
		/* offline: the token still dies with this tab */
	}
	endSession('signed_out');
	await goto(resolve('/login'));
}
