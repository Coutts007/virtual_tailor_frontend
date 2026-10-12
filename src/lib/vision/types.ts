import type { Landmark, MarkerObs, ViewChecks } from '$lib/api/types';
import type { LiveFrame, View } from '$lib/capture/checks';

/** Binary person mask at mask resolution (1 = person). Memory only, never stored. */
export interface MaskData {
	data: Uint8Array;
	width: number;
	height: number;
}

/** Per-view input to the measurement module (structurally = measure ViewInput). */
export interface ViewData {
	landmarks: Landmark[];
	mask: MaskData;
	marker: MarkerObs | null;
	frame: { width: number; height: number };
}

/** Result of a 5-frame burst (Section 10.4). */
export interface ViewCapture {
	view: View;
	data: ViewData;
	checks: ViewChecks;
	marker_confidence: number;
	frames_ok: number;
	still_source: 'imagecapture' | 'canvas' | 'file';
}

/** What a live analysis contributes to a LiveFrame (orientation comes from the phone). */
export type LiveAnalysis = Omit<LiveFrame, 't' | 'orientation' | 'levelUnchecked'>;

export interface StreamInfo {
	width: number;
	height: number;
	lens_note?: string;
	applied?: Record<string, unknown>;
}

export interface VisionEngine {
	readonly kind: 'fake' | 'real';
	/** Opens the camera (real) or the scripted scenario (fake). */
	start(target?: HTMLVideoElement | null): Promise<StreamInfo>;
	/** Called when a view starts so scripted scenarios restart. */
	beginView(view: View, now: number): void;
	analyze(view: View, now: number): Promise<LiveAnalysis | null>;
	burst(view: View, now: number): Promise<ViewCapture>;
	/** Draws the simulated camera (fake only). */
	draw?(canvas: HTMLCanvasElement, last: LiveAnalysis | null, view: View): void;
	/** Stops tracks and workers; releases every frame (privacy invariant 2). */
	stop(): void;
}

export class BurstFailedError extends Error {
	constructor() {
		super('burst_failed');
	}
}
