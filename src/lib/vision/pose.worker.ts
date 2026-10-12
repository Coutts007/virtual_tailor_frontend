/// <reference lib="webworker" />
/**
 * Pose + segmentation worker (Section 10.5), bundled as a classic worker into
 * /workers/pose.worker.js by `npm run vendor` (MediaPipe's loader needs
 * importScripts). Loads the self-hosted model and WASM, GPU delegate with CPU
 * fallback. Replies with numbers and, for bursts, the binary mask. Never posts
 * an image back; every bitmap and MPMask is closed here.
 */
import {
	FilesetResolver,
	PoseLandmarker,
	type PoseLandmarkerResult
} from '@mediapipe/tasks-vision';
import type { Landmark } from '../api/types';
import type { PoseImage, PoseLive, Req, Res } from './protocol';
import { armMerge, binarise, laplacianVariance, maskBox, meanLuma, type Mask } from './frameStats';

const ctx = self as unknown as DedicatedWorkerGlobalScope;
let landmarker: PoseLandmarker | null = null;
let mode: 'VIDEO' | 'IMAGE' = 'VIDEO';
let delegate: 'GPU' | 'CPU' = 'GPU';
let scratch: OffscreenCanvas | null = null;

async function init(variant: 'lite' | 'full' = 'lite') {
	if (landmarker) return { delegate };
	const fileset = await FilesetResolver.forVisionTasks('/wasm');
	const make = (d: 'GPU' | 'CPU') =>
		PoseLandmarker.createFromOptions(fileset, {
			baseOptions: { modelAssetPath: `/models/pose_landmarker_${variant}.task`, delegate: d },
			runningMode: 'VIDEO',
			numPoses: 1,
			outputSegmentationMasks: true,
			minPoseDetectionConfidence: 0.5,
			minPosePresenceConfidence: 0.5,
			minTrackingConfidence: 0.5
		});
	try {
		landmarker = await make('GPU');
		delegate = 'GPU';
	} catch {
		landmarker = await make('CPU');
		delegate = 'CPU';
	}
	mode = 'VIDEO';
	return { delegate };
}

async function setMode(m: 'VIDEO' | 'IMAGE') {
	if (mode === m || !landmarker) return;
	await landmarker.setOptions({ runningMode: m });
	mode = m;
}

/** Luma statistics need pixels: draw into a worker-only canvas, then reset it. */
function pixelStats(bitmap: ImageBitmap, box: PoseLive['maskBox']) {
	if (!box) return { luminance: null, sharpness: null };
	const w = bitmap.width,
		h = bitmap.height;
	scratch ??= new OffscreenCanvas(w, h);
	scratch.width = w;
	scratch.height = h;
	const c = scratch.getContext('2d', { willReadFrequently: true })!;
	c.drawImage(bitmap, 0, 0);
	const px = c.getImageData(0, 0, w, h).data;
	const stats = {
		luminance: meanLuma(px, w, h, box, 4),
		sharpness: laplacianVariance(px, w, h, box, 2)
	};
	scratch.width = scratch.height = 0;
	return stats;
}

function reduce(
	r: PoseLandmarkerResult,
	bitmap: ImageBitmap,
	view: 'front' | 'side',
	keepMask: boolean
): PoseImage {
	const lm = r.landmarks?.[0];
	const landmarks: Landmark[] | null = lm
		? lm.map((p) => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility ?? 0 }))
		: null;
	let mask: Mask | null = null;
	const mp = r.segmentationMasks?.[0];
	if (mp) {
		mask = { data: binarise(mp.getAsFloat32Array()), width: mp.width, height: mp.height };
	}
	for (const m of r.segmentationMasks ?? []) m.close();
	const box = mask ? maskBox(mask) : null;
	const stats = pixelStats(bitmap, box);
	return {
		landmarks,
		maskBox: box,
		armMerge: mask && landmarks && view === 'front' ? armMerge(mask, landmarks) : null,
		...stats,
		frameW: bitmap.width,
		frameH: bitmap.height,
		delegate,
		mask: keepMask ? mask : null
	};
}

ctx.onmessage = async (e: MessageEvent<Req>) => {
	const msg = e.data;
	const reply = (r: Res, transfer: Transferable[] = []) => ctx.postMessage(r, transfer);
	try {
		if (msg.op === 'init') return reply({ id: msg.id, ok: true, value: await init(msg.variant) });
		if (msg.op === 'dispose') {
			landmarker?.close();
			landmarker = null;
			return reply({ id: msg.id, ok: true, value: null });
		}
		if (!landmarker) await init();
		if (msg.op === 'live') {
			try {
				await setMode('VIDEO');
				const r = landmarker!.detectForVideo(msg.bitmap, msg.ts);
				const { mask: _m, ...live } = reduce(r, msg.bitmap, msg.view, false);
				return reply({ id: msg.id, ok: true, value: live });
			} finally {
				msg.bitmap.close();
			}
		}
		if (msg.op === 'image') {
			try {
				await setMode('IMAGE');
				const r = landmarker!.detect(msg.bitmap);
				const out = reduce(r, msg.bitmap, msg.view, true);
				return reply({ id: msg.id, ok: true, value: out }, out.mask ? [out.mask.data.buffer] : []);
			} finally {
				msg.bitmap.close();
			}
		}
		reply({ id: msg.id, ok: false, error: 'unknown op' });
	} catch (err) {
		reply({ id: msg.id, ok: false, error: String((err as Error)?.message ?? err) });
	}
};
