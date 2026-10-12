#!/usr/bin/env node
/**
 * Writes build/_headers (Netlify / Cloudflare Pages format; other hosts: copy the
 * values) with the CSP from the built index.html (incl. the bootstrap script
 * hash), frame-ancestors, HSTS and cache rules (Section 19, docs/api-contract.md).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('build/index.html', 'utf8');
const meta = html.match(/http-equiv="content-security-policy" content="([^"]+)"/i);
if (!meta) {
	console.error('No CSP meta tag in build/index.html (kit.csp missing?)');
	process.exit(1);
}
const csp = `${meta[1].replace(/;?\s*$/, '')}; frame-ancestors 'none'`;
export const HEADERS = {
	'Content-Security-Policy': csp,
	'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'no-referrer',
	'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(), payment=()'
};
/**
 * OpenCV.js 4.10 (embind) evaluates generated code at start-up, which the page
 * policy forbids. Only the marker worker's own script gets 'unsafe-eval'
 * (a worker's CSP comes from its script response): no DOM, same-origin bytes
 * only. OPEN DECISION (docs/decisions.md): keep this, or ship a custom
 * OpenCV.js built with -s DYNAMIC_EXECUTION=0 and drop it.
 */
export const MARKER_WORKER_CSP =
	"default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval'; connect-src 'self'";
const lines = [
	'/*',
	...Object.entries(HEADERS).map(([k, v]) => `  ${k}: ${v}`),
	'',
	'/workers/marker.worker.js',
	`  Content-Security-Policy: ${MARKER_WORKER_CSP}`,
	'',
	'/service-worker.js',
	'  Cache-Control: no-cache',
	'',
	'/_app/immutable/*',
	'  Cache-Control: public, max-age=31536000, immutable',
	''
];
writeFileSync('build/_headers', lines.join('\n'));
writeFileSync('build/security-headers.json', JSON.stringify(HEADERS, null, '\t'));
console.log(`build/_headers written\nCSP: ${csp}`);
