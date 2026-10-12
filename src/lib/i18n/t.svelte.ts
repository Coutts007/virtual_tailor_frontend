import type { MessageKey } from './en';
import { coreEn, coreSw, LOADERS, type LazyModule } from './core';
import { formatMessage, type Params } from './format';

export type Lang = 'en' | 'sw';
export const LANGS: Lang[] = ['en', 'sw'];
export const INTL_LOCALE: Record<Lang, string> = { en: 'en-KE', sw: 'sw-KE' };
export const TIME_ZONE = 'Africa/Nairobi';

const dictionaries: Record<Lang, Record<string, string>> = { en: { ...coreEn }, sw: { ...coreSw } };
const loaded = new Set<LazyModule>();

/** Bumped when a lazy module arrives so t() re-renders reactively. */
const i18n = $state({ version: 0 });

/**
 * Loads dashboard, admin or study strings (route-group layouts call this in
 * their load function, before rendering).
 */
export async function loadMessages(mods: LazyModule[]): Promise<void> {
	await Promise.all(
		mods
			.filter((m) => !loaded.has(m))
			.map(async (m) => {
				const [e, s] = await LOADERS[m]();
				Object.assign(dictionaries.en, e);
				Object.assign(dictionaries.sw, s);
				loaded.add(m);
			})
	);
	i18n.version++;
}
const STORAGE_KEY = 'vt.lang';

/** Reactive language state. Persisted to Dexie settings as well (see db/settings.ts). */
export const locale = $state<{ lang: Lang }>({ lang: initialLang() });

function initialLang(): Lang {
	try {
		const saved = globalThis.localStorage?.getItem(STORAGE_KEY);
		if (saved === 'en' || saved === 'sw') return saved;
	} catch {
		/* storage blocked */
	}
	return 'en';
}

export function setLang(lang: Lang): void {
	locale.lang = lang;
	try {
		// A UI preference, not personal data.
		globalThis.localStorage?.setItem(STORAGE_KEY, lang);
	} catch {
		/* storage blocked */
	}
	if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

/** Translate a key in the current language. Reactive inside components. */
export function t(key: MessageKey, params?: Params): string {
	return translate(locale.lang, key, params);
}

export function translate(lang: Lang, key: MessageKey, params?: Params): string {
	void i18n.version;
	const template = dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
	return formatMessage(template, params, INTL_LOCALE[lang]);
}

export function formatDate(
	iso: string | Date,
	opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
) {
	return new Intl.DateTimeFormat(INTL_LOCALE[locale.lang], { timeZone: TIME_ZONE, ...opts }).format(
		// Formatting only; this Date is never mutated or observed.

		typeof iso === 'string' ? new Date(iso) : iso
	);
}

export function formatDateTime(iso: string | Date) {
	return formatDate(iso, { dateStyle: 'medium', timeStyle: 'short' });
}

export { dictionaries };
