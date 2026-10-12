import { describe, expect, it } from 'vitest';
import { en } from '../../src/lib/i18n/en';
import { sw } from '../../src/lib/i18n/sw';
import { formatMessage } from '../../src/lib/i18n/format';

describe('i18n key parity (NFR-06)', () => {
	it('every English key exists in Kiswahili and vice versa', () => {
		const enKeys = Object.keys(en).sort();
		const swKeys = Object.keys(sw).sort();
		expect(swKeys).toEqual(enKeys);
	});

	it('no empty translations', () => {
		for (const [k, v] of Object.entries(sw)) expect(v.trim(), k).not.toBe('');
	});

	it('placeholders match between languages', () => {
		const names = (s: string) =>
			[...s.matchAll(/\{(\w+)[,}]/g)]
				.map((m) => m[1])
				.sort()
				.join(',');
		for (const k of Object.keys(en) as (keyof typeof en)[]) {
			expect(names(sw[k]), k).toBe(names(en[k]));
		}
	});
});

describe('formatMessage', () => {
	it('substitutes named params', () => {
		expect(formatMessage('Code from: {name}', { name: 'Mama Wanjiru Tailors' })).toBe(
			'Code from: Mama Wanjiru Tailors'
		);
	});
	it('leaves unknown params intact', () => {
		expect(formatMessage('Hi {who}')).toBe('Hi {who}');
	});
	it('handles ICU plurals with #', () => {
		const tpl = '{count, plural, =0 {none} one {# day} other {# days}}';
		expect(formatMessage(tpl, { count: 0 })).toBe('none');
		expect(formatMessage(tpl, { count: 1 })).toBe('1 day');
		expect(formatMessage(tpl, { count: 5 })).toBe('5 days');
	});
	it('mixes plurals and params', () => {
		expect(
			formatMessage('{good} good · {count, plural, one {# check} other {# checks}}', {
				good: 7,
				count: 1
			})
		).toBe('7 good · 1 check');
	});
});
