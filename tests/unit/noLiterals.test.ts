/**
 * Section 16: every user-visible string goes through t(). Heuristic scan of
 * .svelte templates for text nodes and user-facing attributes that contain
 * letters outside {…} expressions. Dev-only pages and a small allowlist of
 * brand names, units and symbols are exempt.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOTS = ['src/routes', 'src/lib'];
const SKIP = [/src\/lib\/dev\//, /src\/routes\/dev\//];
/** Allowed literal text: brand, units, codes and symbols that are the same in every language. */
const ALLOW = new Set([
	'VT',
	'Virtual Tailor',
	'cm',
	'in',
	'm',
	'lx',
	'QR',
	'EN',
	'SW',
	'English',
	'Kiswahili',
	'P___',
	'mm',
	'kg',
	'OK'
]);

function files(dir: string): string[] {
	return readdirSync(dir).flatMap((f) => {
		const p = join(dir, f);
		return statSync(p).isDirectory() ? files(p) : p.endsWith('.svelte') ? [p] : [];
	});
}

function literals(src: string): string[] {
	const tpl = src
		.replace(/<script[\s\S]*?<\/script>/g, '')
		.replace(/<style[\s\S]*?<\/style>/g, '')
		.replace(/<!--[\s\S]*?-->/g, '');
	// Drop expressions and blocks, then look at what remains between tags.
	let depth = 0;
	let out = '';
	for (const ch of tpl) {
		if (ch === '{') depth++;
		else if (ch === '}') depth = Math.max(0, depth - 1);
		else if (depth === 0) out += ch;
	}
	const found: string[] = [];
	for (const m of out.matchAll(/>([^<>]+)</g)) {
		const text = m[1]!.replace(/\s+/g, ' ').trim();
		if (text && /[A-Za-z]{2,}/.test(text) && !ALLOW.has(text)) found.push(text);
	}
	for (const m of out.matchAll(
		/\b(?:aria-label|title|placeholder|alt|label)="([^"]*[A-Za-z]{2,}[^"]*)"/g
	)) {
		if (!ALLOW.has(m[1]!)) found.push(`[attr] ${m[1]}`);
	}
	return found;
}

describe('no hard-coded user-visible strings (Section 16)', () => {
	const all = ROOTS.flatMap(files).filter((f) => !SKIP.some((re) => re.test(f)));
	it('scans the app', () => expect(all.length).toBeGreaterThan(50));
	it('detects literals (self-check)', () => {
		expect(literals('<script>let x = 1;</script><p>Hello world</p>')).toEqual(['Hello world']);
		expect(literals('<button aria-label="Close menu">{t(\'common.close\')}</button>')).toEqual([
			'[attr] Close menu'
		]);
		expect(literals("<p>{t('common.back')}</p><span>cm</span>")).toEqual([]);
	});
	for (const f of all) {
		it(f, () => expect(literals(readFileSync(f, 'utf8'))).toEqual([]));
	}
});
