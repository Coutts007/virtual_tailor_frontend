import { en, type MessageKey } from './en';
import { sw } from './sw';
import { formatMessage, type Params } from './format';

export type Lang = 'en' | 'sw';
export const LANGS: Lang[] = ['en', 'sw'];
export const INTL_LOCALE: Record<Lang, string> = { en: 'en-KE', sw: 'sw-KE' };
export const TIME_ZONE = 'Africa/Nairobi';

const dictionaries: Record<Lang, Record<MessageKey, string>> = { en, sw };
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
	const template = dictionaries[lang][key] ?? en[key] ?? key;
	return formatMessage(template, params, INTL_LOCALE[lang]);
}

export function formatDate(
	iso: string | Date,
	opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
) {
	return new Intl.DateTimeFormat(INTL_LOCALE[locale.lang], { timeZone: TIME_ZONE, ...opts }).format(
		// Formatting only; this Date is never mutated or observed.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		typeof iso === 'string' ? new Date(iso) : iso
	);
}

export function formatDateTime(iso: string | Date) {
	return formatDate(iso, { dateStyle: 'medium', timeStyle: 'short' });
}

export { dictionaries };
