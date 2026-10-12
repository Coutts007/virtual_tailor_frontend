#!/usr/bin/env node
/**
 * Self-hosts the vision assets (Section 5, privacy invariant 3): MediaPipe SIMD
 * WASM and OpenCV.js from node_modules, and the pose model from MediaPipe's
 * model bucket, pinned by SHA-256. Writes src/lib/vision/asset-manifest.json
 * (paths + sizes) used for the "about N MB" messages and the download step.
 * Idempotent: files already present with the right hash are kept.
 * Usage: npm run vendor            (Lite model)
 *        npm run vendor -- --full  (also the Full model)
 */
import { createHash } from 'node:crypto';
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	statSync,
	writeFileSync
} from 'node:fs';

const MODELS = {
	lite: {
		url: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
		sha256: '59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a'
	},
	full: {
		url: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task',
		sha256: '4eaa5eb7a98365221087693fcc286334cf0858e2eb6e15b506aa4a7ecdcec4ad'
	}
};
const COPIES = [
	[
		'node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.js',
		'static/wasm/vision_wasm_internal.js'
	],
	[
		'node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.wasm',
		'static/wasm/vision_wasm_internal.wasm'
	],
	['node_modules/@techstark/opencv-js/dist/opencv.js', 'static/opencv/opencv.js']
];

const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
for (const d of ['static/wasm', 'static/opencv', 'static/models'])
	mkdirSync(d, { recursive: true });

for (const [from, to] of COPIES) {
	if (!existsSync(from)) {
		console.error(`missing ${from}: run npm install first`);
		process.exit(1);
	}
	if (!existsSync(to) || sha(from) !== sha(to)) copyFileSync(from, to);
}

const variants = [
	'lite',
	...(process.argv.includes('--full') || existsSync('static/models/pose_landmarker_full.task')
		? ['full']
		: [])
];
for (const v of variants) {
	const dest = `static/models/pose_landmarker_${v}.task`;
	if (existsSync(dest) && sha(dest) === MODELS[v].sha256) continue;
	process.stdout.write(`downloading pose_landmarker_${v}.task … `);
	const res = await fetch(MODELS[v].url);
	if (!res.ok) {
		console.error(`failed (${res.status}). Connect to the internet once and run npm run vendor.`);
		process.exit(existsSync(dest) ? 0 : 1);
	}
	const buf = Buffer.from(await res.arrayBuffer());
	const got = createHash('sha256').update(buf).digest('hex');
	if (got !== MODELS[v].sha256) {
		console.error(
			`hash mismatch for ${v}: ${got}. Update the pinned hash only after checking the model card/licence.`
		);
		process.exit(1);
	}
	writeFileSync(dest, buf);
	console.log(`${(buf.length / 1e6).toFixed(1)} MB`);
}

// Vision workers: bundled as classic IIFE workers so MediaPipe's loader can use importScripts.
const { build } = await import('esbuild');
mkdirSync('static/workers', { recursive: true });
for (const name of ['pose', 'marker']) {
	await build({
		entryPoints: [`src/lib/vision/${name}.worker.ts`],
		outfile: `static/workers/${name}.worker.js`,
		bundle: true,
		format: 'iife',
		target: ['chrome91', 'safari16'],
		minify: true,
		legalComments: 'eof',
		logLevel: 'warning'
	});
}

const assets = [...COPIES.map(([, to]) => to), 'static/models/pose_landmarker_lite.task'].map(
	(p) => ({ url: p.replace(/^static/, ''), bytes: statSync(p).size })
);
writeFileSync('src/lib/vision/asset-manifest.json', JSON.stringify({ assets }, null, '\t') + '\n');
console.log(
	`vision assets ready: ${(assets.reduce((s, a) => s + a.bytes, 0) / 1e6).toFixed(1)} MB`
);
