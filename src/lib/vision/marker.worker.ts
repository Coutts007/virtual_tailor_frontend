/// <reference lib="webworker" />
/**
 * ArUco marker worker (Section 10.5): loads the self-hosted OpenCV.js 4.10
 * (cv.aruco_ArucoDetector in objdetect; see docs/opencv-build.md), detects
 * DICT_4X4_50 id 0 with sub-pixel corner refinement, replies with corners.
 * Bundled as a classic worker into /workers/marker.worker.js.
 */
import type { MarkerFound, Req, Res } from './protocol';

/* eslint-disable @typescript-eslint/no-explicit-any -- OpenCV.js is untyped */
declare function importScripts(...urls: string[]): void;
const ctx = self as unknown as DedicatedWorkerGlobalScope & { cv?: any };
let cv: any = null;
let detector: any = null;
let canvas: OffscreenCanvas | null = null;

async function init() {
	if (detector) return { ready: true };
	importScripts('/opencv/opencv.js');
	let c = ctx.cv;
	if (c instanceof Promise) c = await c;
	for (let i = 0; i < 300 && !(c?.Mat && c?.getPredefinedDictionary); i++) {
		await new Promise((r) => setTimeout(r, 50));
		c = ctx.cv;
	}
	if (!c?.aruco_ArucoDetector) throw new Error('opencv_without_aruco');
	cv = c;
	const params = new cv.aruco_DetectorParameters();
	params.cornerRefinementMethod = cv.CORNER_REFINE_SUBPIX;
	const refine = new cv.aruco_RefineParameters(10, 3, true);
	detector = new cv.aruco_ArucoDetector(cv.getPredefinedDictionary(cv.DICT_4X4_50), params, refine);
	return { ready: true };
}

function find(bitmap: ImageBitmap): MarkerFound {
	const w = bitmap.width,
		h = bitmap.height;
	canvas ??= new OffscreenCanvas(w, h);
	canvas.width = w;
	canvas.height = h;
	const c2d = canvas.getContext('2d', { willReadFrequently: true })!;
	c2d.drawImage(bitmap, 0, 0);
	const rgba = cv.matFromImageData(c2d.getImageData(0, 0, w, h));
	canvas.width = canvas.height = 0;
	const gray = new cv.Mat();
	const corners = new cv.MatVector();
	const ids = new cv.Mat();
	const rejected = new cv.MatVector();
	try {
		cv.cvtColor(rgba, gray, cv.COLOR_RGBA2GRAY);
		rgba.delete();
		detector.detectMarkers(gray, corners, ids, rejected);
		for (let i = 0; i < ids.rows; i++) {
			if (ids.data32S[i] !== 0) continue;
			const d = corners.get(i).data32F as Float32Array;
			const pts: [number, number][] = [
				[d[0]!, d[1]!],
				[d[2]!, d[3]!],
				[d[4]!, d[5]!],
				[d[6]!, d[7]!]
			];
			const sides = pts.map((p, k) =>
				Math.hypot(p[0] - pts[(k + 1) % 4]![0], p[1] - pts[(k + 1) % 4]![1])
			);
			const side = sides.reduce((a, b) => a + b, 0) / 4;
			return {
				found: true,
				corners: pts,
				side_px: side,
				ratio: Math.max(...sides) / Math.min(...sides),
				image_w: w,
				image_h: h,
				occluded: false
			};
		}
		// A large square-ish candidate that failed decoding usually means fingers on the marker.
		let occluded = false;
		for (let i = 0; i < rejected.size(); i++) {
			const d = rejected.get(i).data32F as Float32Array;
			if (Math.hypot(d[0]! - d[4]!, d[1]! - d[5]!) > 0.04 * Math.max(w, h)) occluded = true;
		}
		return { found: false, corners: [], side_px: 0, ratio: 1, image_w: w, image_h: h, occluded };
	} finally {
		gray.delete();
		corners.delete();
		ids.delete();
		rejected.delete();
	}
}

ctx.onmessage = async (e: MessageEvent<Req>) => {
	const msg = e.data;
	const reply = (r: Res) => ctx.postMessage(r);
	try {
		if (msg.op === 'init') return reply({ id: msg.id, ok: true, value: await init() });
		if (msg.op === 'dispose') {
			detector?.delete?.();
			detector = null;
			return reply({ id: msg.id, ok: true, value: null });
		}
		if (msg.op === 'marker') {
			try {
				if (!detector) await init();
				return reply({ id: msg.id, ok: true, value: find(msg.bitmap) });
			} finally {
				msg.bitmap.close();
			}
		}
		reply({ id: msg.id, ok: false, error: 'unknown op' });
	} catch (err) {
		reply({ id: msg.id, ok: false, error: String((err as Error)?.message ?? err) });
	}
};
