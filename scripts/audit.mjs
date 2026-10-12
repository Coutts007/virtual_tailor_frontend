#!/usr/bin/env node
/**
 * Dependency audit of deployed packages (Section 19). Fails on high/critical
 * advisories unless listed in audit-allowlist.json with a reason and expiry.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const allow = JSON.parse(readFileSync('audit-allowlist.json', 'utf8')).allow ?? [];
let report;
try {
	report = JSON.parse(
		execSync('npm audit --omit=dev --json', {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore']
		})
	);
} catch (e) {
	report = JSON.parse(e.stdout || '{}');
}
const today = new Date().toISOString().slice(0, 10);
const bad = [];
for (const [name, v] of Object.entries(report.vulnerabilities ?? {})) {
	if (!['high', 'critical'].includes(v.severity)) continue;
	const a = allow.find((x) => x.package === name && x.expires >= today);
	if (!a) bad.push(`${name} (${v.severity})`);
}
console.log(
	`audit: ${Object.keys(report.vulnerabilities ?? {}).length} advisories in deployed deps; ${bad.length} not allowlisted`
);
if (bad.length) {
	console.error(bad.join('\n'));
	process.exit(1);
}
