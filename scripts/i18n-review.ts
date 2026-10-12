/**
 * Regenerates docs/i18n-review.md from sw.ts, keeping any `reviewed: true`
 * marks already in the file (Section 16). Run: npm run i18n:review
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { en } from '../src/lib/i18n/en';
import { sw } from '../src/lib/i18n/sw';

const FILE = 'docs/i18n-review.md';
const prior = new Map<string, { reviewed: boolean; reviewer: string; sw: string }>();
if (existsSync(FILE)) {
	for (const line of readFileSync(FILE, 'utf8').split('\n')) {
		const m = line.match(/^\| `([^`]+)` \| .* \| (.*) \| (true|false) \| (.*) \|$/);
		if (m) prior.set(m[1]!, { sw: m[2]!, reviewed: m[3] === 'true', reviewer: m[4]!.trim() });
	}
}
const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
const rows = (Object.keys(en) as (keyof typeof en)[]).map((k) => {
	const p = prior.get(k);
	// A changed Kiswahili string needs review again.
	const still = p && p.sw === esc(sw[k]) ? p : undefined;
	return `| \`${k}\` | ${esc(en[k])} | ${esc(sw[k])} | ${still?.reviewed ?? false} | ${still?.reviewer ?? ''} |`;
});
const reviewed = rows.filter((r) => r.includes('| true |')).length;
writeFileSync(
	FILE,
	`# Kiswahili review (decision 10)

First-draft Kiswahili written by the agent. A native speaker sets \`reviewed\` to \`true\` and adds their initials. Editing a Kiswahili string resets it to \`false\` when this file is regenerated (\`npm run i18n:review\`).

Guidance: short, concrete sentences; read at about an 11-year-old level; avoid literal translation of idioms.

**Progress:** ${reviewed} of ${rows.length} reviewed.

The consent text and protocol card are long-form documents under \`src/lib/i18n/consent/\` and are reviewed as whole documents (Phase 2).

| Key | English | Kiswahili (draft) | reviewed | reviewer |
|---|---|---|---|---|
${rows.join('\n')}
`
);
console.log(`${FILE}: ${rows.length} keys, ${reviewed} reviewed`);
