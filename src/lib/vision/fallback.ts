/**
 * Camera-app fallback (Section 10.1.7, assisted mode only): one photo per view
 * from <input type="file" capture>, checks run after the fact, profile flagged
 * capture_fallback. The file is decoded in memory, analysed, and released;
 * it is never stored or sent.
 */
import type { CheckState, ViewChecks } from '$lib/api/types';
import { evaluate, type View } from '$lib/capture/checks';
import { CAPTURE_CONFIG } from '$lib/capture/config';
import { combineMarkers } from './burst';
import { grabFrame, release, releaseCanvases } from './imageOps';
import type { MarkerFound, PoseImage } from './protocol';
import type { ViewCapture } from './types';
import { WorkerClient } from './workerClient';

let pose: WorkerClient | null = null;
let marker: WorkerClient | null = null;

export async function analysePhoto(
	file: File,
	view: View
): Promise<{ capture: ViewCapture | null; failed: string[] }> {
	pose ??= new WorkerClient('pose', '/workers/pose.worker.js');
	marker ??= new WorkerClient('marker', '/workers/marker.worker.js');
	await Promise.all([pose.init({ op: 'init', variant: 'lite' }), marker.init({ op: 'init' })]);
	const full = await createImageBitmap(file);
	try {
		const portrait = full.width > full.height;
		const a = await grabFrame(full, CAPTURE_CONFIG.burst.longEdge, portrait, -3);
		const b = await grabFrame(full, CAPTURE_CONFIG.burst.longEdge, portrait, -4);
		const [p, m] = await Promise.all([
			pose.call<PoseImage>({ op: 'image', bitmap: a, view }, [a], 15_000),
			marker.call<MarkerFound>({ op: 'marker', bitmap: b }, [b], 15_000)
		]);
		const r = evaluate(
			{
				t: 0,
				orientation: null,
				levelUnchecked: true,
				landmarks: p.landmarks,
				maskBox: p.maskBox,
				armMerge: p.armMerge,
				marker: { found: m.found, sidePx: m.side_px, ratio: m.ratio, occluded: m.occluded },
				luminance: p.luminance,
				sharpness: p.sharpness,
				streamH: p.frameH,
				stillAvailable: true
			},
			view
		);
		const st = (s: string): CheckState => (s === 'fail' ? 'fail' : 'pass');
		const checks: ViewChecks = {
			level: 'skipped',
			frame: st(r.states.person === 'fail' ? 'fail' : r.states.frame),
			distance: st(r.states.distance),
			symmetry: st(r.states.symmetry),
			arms: st(r.states.arms),
			marker: st(r.states.marker),
			light: st(r.states.light),
			sharpness: r.corrections.light === 'capture.msg.holdStill' ? 'fail' : 'pass'
		};
		const failed = Object.entries(checks)
			.filter(([, v]) => v === 'fail')
			.map(([k]) => k);
		if (!p.landmarks || !p.mask || !m.found)
			return { capture: null, failed: failed.length ? failed : ['frame'] };
		const { marker: obs, confidence } = combineMarkers([m], 1);
		return {
			capture: {
				view,
				data: {
					landmarks: p.landmarks,
					mask: p.mask,
					marker: obs,
					frame: { width: p.frameW, height: p.frameH }
				},
				checks,
				marker_confidence: confidence,
				frames_ok: 1,
				still_source: 'file'
			},
			failed
		};
	} finally {
		release(full);
		releaseCanvases();
	}
}

export function disposeFallback() {
	pose?.terminate();
	marker?.terminate();
	pose = marker = null;
}
