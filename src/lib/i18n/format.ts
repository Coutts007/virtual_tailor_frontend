/**
 * Minimal ICU-style message formatter: {name} placeholders and
 * {count, plural, =0 {...} one {...} other {...}} with # replaced by the count.
 * Pure function so it can be unit-tested without the DOM.
 */
export type Params = Record<string, string | number>;

const PLURAL_RE = /\{(\w+),\s*plural,\s*((?:[^{}]*\{[^{}]*\})+)\s*\}/g;
const OPTION_RE = /(=\d+|zero|one|two|few|many|other)\s*\{([^{}]*)\}/g;

export function formatMessage(template: string, params: Params = {}, locale = 'en'): string {
	const rules = new Intl.PluralRules(locale);
	let out = template.replace(PLURAL_RE, (_m, name: string, body: string) => {
		const n = Number(params[name] ?? 0);
		const options = new Map<string, string>();
		for (const [, key, text] of body.matchAll(OPTION_RE)) options.set(key!, text!);
		const chosen =
			options.get(`=${n}`) ?? options.get(rules.select(n)) ?? options.get('other') ?? '';
		return chosen.replace(/#/g, new Intl.NumberFormat(locale).format(n));
	});
	out = out.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
	return out;
}
