/**
 * Real camera + worker pipeline (Section 10). Live: frames at 5–8 fps,
 * downscaled to 1,280 px, pose + segmentation every frame, marker every second
 * frame. Burst: 5 frames ~200 ms apart at ≤ 1,920 px (1,280 px when memory ≤ 3 GB)
 * plus, on Android, one full-resolution still for marker corners. Every bitmap
 * is closed and every canvas reset (privacy invariant 2).
 */
import type { ViewChecks } from '$lib/api/types';
import type { View } from '$lib/capture/checks';
import { CAPTURE_CONFIG } from '$lib/capture/config';
import { openCamera, type OpenCamera } from './camera';
import { combineMarkers, majorityMask, medianLandmarks } from './burst';
import { grabFrame, releaseCanvases, fit } from './imageOps';
import type { MarkerFound, PoseImage, PoseLive } from './protocol';
import {
	BurstFailedError,
	type LiveAnalysis,
	type StreamInfo,
	type ViewCapture,
	type VisionEngine
} from './types';
import { WorkerClient } from './workerClient';

const PASS: ViewChecks = {
	level: 'pass',
	frame: 'pass',
	distance: 'pass',
	symmetry: 'pass',
	arms: 'pass',
	marker: 'pass',
	light: 'pass',
	sharpness: 'pass'
};

export class RealVisionEngine implements VisionEngine {
	readonly kind = 'real' as const;
	private cam: OpenCamera | null = null;
	private video: HTMLVideoElement | null = null;
	private pose = new WorkerClient('pose', '/workers/pose.worker.js');
	private marker = new WorkerClient('marker', '/workers/marker.worker.js');
	private frameNo = 0;
	private lastMarker: LiveAnalysis['marker'] = null;
	/** Last pose result; reused for up to 2 s when a live call times out on a slow phone. */
	private lastPose: { at: number; value: PoseLive } | null = null;
	private lowMemory = ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 3;
	delegate: 'GPU' | 'CPU' = 'GPU';

	constructor(private variant: 'lite' | 'full' = 'lite') {}

	async start(video?: HTMLVideoElement | null): Promise<StreamInfo> {
		this.video = video ?? null;
		this.cam = await openCamera(this.video);
		const [p] = await Promise.all([
			this.pose.init({ op: 'init', variant: this.variant }),
			this.marker.init({ op: 'init' })
		]);
		this.delegate = (p as { delegate: 'GPU' | 'CPU' }).delegate;
		return {
			width: this.cam.width,
			height: this.cam.height,
			lens_note: this.cam.lens_note,
			applied: this.cam.applied
		};
	}

	beginView() {
		this.frameNo = 0;
		this.lastMarker = null;
		this.lastPose = null;
	}

	/** Scale-resolution factor: marker side is judged at the resolution used for scale (10.3 #7). */
	private scaleFactor(liveLong: number): number {
		const still = this.cam?.imageCapture
			? Math.max(this.cam.width, this.cam.height) * 2
			: Math.max(this.cam?.width ?? 1080, this.cam?.height ?? 1920);
		return still / liveLong;
	}

	async analyze(view: View, now: number): Promise<LiveAnalysis | null> {
		if (!this.video || !this.cam || this.video.readyState < 2) return null;
		const rotate = this.cam.rotate;
		const long = CAPTURE_CONFIG.live.longEdge;
		const doMarker = this.frameNo++ % 2 === 0;
		const poseBmp = await grabFrame(this.video, long, rotate);
		const markerBmp = doMarker ? await grabFrame(this.video, long, rotate) : null;
		const [p, m] = await Promise.all([
			this.pose
				.call<PoseLive>({ op: 'live', bitmap: poseBmp, ts: Math.round(now), view }, [poseBmp], 1000)
				.catch(() => null),
			markerBmp
				? this.marker
						.call<MarkerFound>({ op: 'marker', bitmap: markerBmp }, [markerBmp], 1000)
						.catch(() => null)
				: Promise.resolve(undefined)
		]);
		if (m !== undefined) {
			this.lastMarker = m
				? {
						found: m.found,
						sidePx: m.side_px * this.scaleFactor(Math.max(m.image_w, m.image_h)),
						ratio: m.ratio,
						occluded: m.occluded
					}
				: { found: false, sidePx: 0, ratio: 1, occluded: false };
		}
		let pose = p;
		if (pose) this.lastPose = { at: now, value: pose };
		else if (this.lastPose && now - this.lastPose.at < 2000) pose = this.lastPose.value;
		if (!pose) {
			// No pose yet (model warming up or a slow frame): still report the sheet.
			return {
				landmarks: null,
				maskBox: null,
				armMerge: null,
				marker: this.lastMarker,
				luminance: null,
				sharpness: null,
				streamH: this.cam.height,
				stillAvailable: !!this.cam.imageCapture
			};
		}
		const p2 = pose;
		this.delegate = p2.delegate;
		return {
			landmarks: p2.landmarks,
			maskBox: p2.maskBox,
			armMerge: p2.armMerge,
			marker: this.lastMarker,
			luminance: p2.luminance,
			sharpness: p2.sharpness,
			streamH: this.cam.height,
			stillAvailable: !!this.cam.imageCapture
		};
	}

	async burst(view: View): Promise<ViewCapture> {
		if (!this.video || !this.cam) throw new BurstFailedError();
		const B = CAPTURE_CONFIG.burst;
		const long = this.lowMemory ? B.lowMemLongEdge : B.longEdge;
		const rotate = this.cam.rotate;

		// Full-resolution still for marker corners (Android ImageCapture); iOS uses frames.
		let stillMarker: MarkerFound | null = null;
		let still_source: ViewCapture['still_source'] = 'canvas';
		const stillJob = (async () => {
			if (!this.cam?.imageCapture) return;
			try {
				const blob = await this.cam.imageCapture.takePhoto();
				const full = await createImageBitmap(blob);
				const { w, h } = fit(full.width, full.height, 4096);
				const bmp =
					w === full.width
						? full
						: await createImageBitmap(full, { resizeWidth: w, resizeHeight: h });
				if (bmp !== full) full.close();
				stillMarker = await this.marker.call<MarkerFound>(
					{ op: 'marker', bitmap: bmp },
					[bmp],
					10_000
				);
				if (stillMarker?.found) still_source = 'imagecapture';
			} catch {
				stillMarker = null;
			}
		})();

		const poses: PoseImage[] = [];
		const markers: MarkerFound[] = [];
		for (let i = 0; i < B.frames; i++) {
			const t0 = performance.now();
			const a = await grabFrame(this.video, long, rotate, -1);
			const b = await grabFrame(this.video, long, rotate, -2);
			const [p, m] = await Promise.all([
				this.pose.call<PoseImage>({ op: 'image', bitmap: a, view }, [a], 10_000).catch(() => null),
				this.marker.call<MarkerFound>({ op: 'marker', bitmap: b }, [b], 10_000).catch(() => null)
			]);
			if (p) poses.push(p);
			if (m) markers.push(m);
			const wait = B.spacingMs - (performance.now() - t0);
			if (wait > 0 && i < B.frames - 1) await new Promise((r) => setTimeout(r, wait));
		}
		await stillJob;
		releaseCanvases();
		if (this.lowMemory) this.marker.terminate();

		const goodPose = poses.filter((p) => p.landmarks && p.mask);
		const goodMarker = markers.filter((m) => m.found);
		if (
			B.frames - goodPose.length > B.maxBadFrames ||
			B.frames - goodMarker.length > B.maxBadFrames
		) {
			for (const p of poses) if (p.mask) p.mask.data = new Uint8Array(0);
			throw new BurstFailedError();
		}

		const landmarks = medianLandmarks(goodPose.map((p) => p.landmarks!));
		const masks = goodPose.map((p) => p.mask!).filter((m) => m.width === goodPose[0]!.mask!.width);
		const mask = majorityMask(masks);
		for (const p of poses) if (p.mask) p.mask.data = new Uint8Array(0);
		const frames = combineMarkers(markers, B.frames);
		const marker = (stillMarker as MarkerFound | null)?.found
			? { ...combineMarkers([stillMarker!], 1).marker!, confidence: frames.confidence }
			: frames.marker;

		return {
			view,
			data: {
				landmarks,
				mask,
				marker,
				frame: { width: goodPose[0]!.frameW, height: goodPose[0]!.frameH }
			},
			checks: { ...PASS },
			marker_confidence: frames.confidence,
			frames_ok: goodPose.length,
			still_source
		};
	}

	stop() {
		this.cam?.stop();
		this.cam = null;
		this.video = null;
		this.pose.terminate();
		this.marker.terminate();
		releaseCanvases();
	}
}
