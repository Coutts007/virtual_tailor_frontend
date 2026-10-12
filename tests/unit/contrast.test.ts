import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrast } from './contrast';

/** Parse the light-theme tokens from tokens.css (first :root block). */
function tokens(): Record<string, string> {
	const css = readFileSync('src/lib/styles/tokens.css', 'utf8');
	const block = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
	const out: Record<string, string> = {};
	for (const m of block.matchAll(/(--vt-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1]!] = m[2]!;
	return out;
}

// [foreground, background, minimum ratio] — 4.5 text, 3 UI components / large text.
const PAIRS: [string, string, number][] = [
	['--vt-ink', '--vt-chalk', 4.5],
	['--vt-ink', '--vt-paper', 4.5],
	['--vt-ink-muted', '--vt-chalk', 4.5],
	['--vt-ink-muted', '--vt-paper', 4.5],
	['--vt-thread-ink', '--vt-thread', 4.5],
	['--vt-thread', '--vt-chalk', 4.5],
	['--vt-thread', '--vt-paper', 4.5],
	['--vt-pass', '--vt-paper', 4.5],
	['--vt-pass', '--vt-pass-fill', 4.5],
	['--vt-check-ink', '--vt-check-fill', 4.5],
	['--vt-check', '--vt-paper', 3],
	['--vt-fail', '--vt-paper', 4.5],
	['--vt-fail', '--vt-fail-fill', 4.5],
	['--vt-kitenge', '--vt-chalk', 3],
	['--vt-kitenge', '--vt-paper', 3],
	['--vt-line-strong', '--vt-paper', 3],
	['--vt-offline-ink', '--vt-offline-fill', 4.5],
	['--vt-border-ok', '--vt-capture-bg', 3],
	['--vt-border-wait', '--vt-capture-bg', 3],
	['--vt-border-stop', '--vt-capture-bg', 3]
];

describe('colour contrast (WCAG 2.2 AA, Section 8.2)', () => {
	const t = tokens();
	for (const [fg, bg, min] of PAIRS) {
		it(`${fg} on ${bg} ≥ ${min}:1`, () => {
			expect(t[fg], fg).toBeDefined();
			expect(t[bg], bg).toBeDefined();
			expect(contrast(t[fg]!, t[bg]!)).toBeGreaterThanOrEqual(min);
		});
	}
});
