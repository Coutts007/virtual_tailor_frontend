#!/usr/bin/env node
/**
 * Serves build/ the way a static host would (for production tests and local
 * checks): files as-is, SPA fallback to index.html for app routes, headers from
 * build/_headers (Netlify / Cloudflare format), gzip for text and WASM.
 * Usage: node scripts/serve-build.mjs [port]
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = 'build';
const port = Number(process.argv[2] ?? 4180);
const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json',
	'.webmanifest': 'application/manifest+json',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.pdf': 'application/pdf',
	'.wasm': 'application/wasm',
	'.task': 'application/octet-stream',
	'.mp3': 'audio/mpeg'
};

/** Parses build/_headers into [pattern, headers] rules. */
function rules() {
	const out = [];
	let cur = null;
	for (const line of readFileSync(join(ROOT, '_headers'), 'utf8').split('\n')) {
		if (!line.trim()) continue;
		if (!line.startsWith(' ')) {
			cur = { pattern: line.trim(), headers: {} };
			out.push(cur);
		} else if (cur) {
			const i = line.indexOf(':');
			cur.headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
		}
	}
	return out;
}
const RULES = rules();
const match = (p, url) => (p.endsWith('*') ? url.startsWith(p.slice(0, -1)) : url === p);

createServer((req, res) => {
	const url = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
	let file = normalize(join(ROOT, url));
	if (!file.startsWith(ROOT)) {
		res.writeHead(403).end();
		return;
	}
	if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
	let status = 200;
	if (!existsSync(file)) {
		if (extname(url) && !url.startsWith('/api/')) status = 404;
		file = join(ROOT, 'index.html');
		if (url.startsWith('/api/')) status = 404;
	}
	const headers = { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' };
	for (const r of RULES) if (match(r.pattern, url)) Object.assign(headers, r.headers);
	if (status === 404 && extname(url)) {
		res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
		return;
	}
	if (status === 404) {
		res
			.writeHead(404, { 'Content-Type': 'application/problem+json' })
			.end('{"status":404,"code":"not_found"}');
		return;
	}
	let body = readFileSync(file);
	if (
		/gzip/.test(req.headers['accept-encoding'] ?? '') &&
		/text|json|wasm|svg|javascript/.test(headers['Content-Type'])
	) {
		body = gzipSync(body);
		headers['Content-Encoding'] = 'gzip';
	}
	res.writeHead(200, { ...headers, 'Content-Length': body.length }).end(body);
}).listen(port, () => console.log(`build/ on http://localhost:${port}`));
