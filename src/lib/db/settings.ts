import { getDb } from './dexie';
import type { ClothingFit, ConsentRecord, Sex } from '$lib/api/types';
import type { Lang } from '$lib/i18n/t.svelte';

/** Typed keys for the settings table (Section 12.1). Never a name, phone or email. */
export interface SettingsShape {
	language: Lang;
	client_code: string;
	code_verified: boolean;
	height_mm: number;
	sex: Sex;
	clothing_fit: ClothingFit;
	consent: ConsentRecord;
	model_variant: 'lite' | 'full';
	preflight: unknown;
	print_check_ok: boolean;
	audio_muted: boolean;
	capture_mode: 'self' | 'assisted';
}

export type SettingKey = keyof SettingsShape;

export async function getSetting<K extends SettingKey>(
	key: K
): Promise<SettingsShape[K] | undefined> {
	const row = await getDb().settings.get(key);
	return row?.value as SettingsShape[K] | undefined;
}

export async function setSetting<K extends SettingKey>(
	key: K,
	value: SettingsShape[K]
): Promise<void> {
	await getDb().settings.put({ key, value });
}

export async function deleteSettings(keys: SettingKey[]): Promise<void> {
	await getDb().settings.bulkDelete(keys);
}
