import { api } from '$lib/api';
import type { Me, MePatch, UnitPref } from '$lib/api/types';
import { onSignOut } from '$lib/auth/session.svelte';
import { setLang } from '$lib/i18n/t.svelte';

/** The signed-in user's profile and preferences (units, presets). Cleared on sign-out. */
export const meStore = $state<{ me: Me | null; loading: boolean }>({ me: null, loading: false });

let inflight: Promise<Me> | null = null;

export async function loadMe(force = false): Promise<Me> {
	if (meStore.me && !force) return meStore.me;
	inflight ??= api()
		.getMe()
		.then((me) => {
			meStore.me = me;
			return me;
		})
		.finally(() => {
			inflight = null;
			meStore.loading = false;
		});
	meStore.loading = true;
	return inflight;
}

export async function updateMe(patch: MePatch): Promise<Me> {
	const me = await api().updateMe(patch);
	meStore.me = me;
	if (patch.locale) setLang(patch.locale);
	return me;
}

export function unit(): UnitPref {
	return meStore.me?.unit_pref ?? 'cm';
}

onSignOut(() => {
	meStore.me = null;
});
