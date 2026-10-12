import { api } from '$lib/api';
import { onSignOut } from '$lib/auth/session.svelte';

/** Sync-conflict count for the header badge (Section 13). */
export const conflictsStore = $state({ count: 0 });

export async function refreshConflicts(): Promise<void> {
	try {
		conflictsStore.count = (await api().listConflicts()).length;
	} catch {
		/* keep the last count offline */
	}
}

onSignOut(() => {
	conflictsStore.count = 0;
});
