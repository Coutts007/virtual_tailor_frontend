/**
 * Messages between the main thread and the vision workers (Section 10.5).
 * Workers receive ImageBitmaps (transferred) and reply with numbers only;
 * the binary mask is the one array a burst reply carries, at mask resolution.
 */
import type { Landmark } from '$lib/api/types';

export type Req =
	| { id: number; op: 'init'; variant?: 'lite' | 'full' }
	| { id: number; op: 'live'; bitmap: ImageBitmap; ts: number; view: 'front' | 'side' }
	| { id: number; op: 'image'; bitmap: ImageBitmap; view: 'front' | 'side' }
	| { id: number; op: 'marker'; bitmap: ImageBitmap }
	| { id: number; op: 'dispose' };

export type Res =
	{ id: number; ok: true; value: unknown } | { id: number; ok: false; error: string };

export interface PoseLive {
	landmarks: Landmark[] | null;
	maskBox: { top: number; bottom: number; left: number; right: number } | null;
	armMerge: { left: boolean; right: boolean } | null;
	luminance: number | null;
	sharpness: number | null;
	frameW: number;
	frameH: number;
	delegate: 'GPU' | 'CPU';
}

export interface PoseImage extends PoseLive {
	mask: { data: Uint8Array; width: number; height: number } | null;
}

export interface MarkerFound {
	found: boolean;
	corners: [number, number][];
	side_px: number;
	ratio: number;
	image_w: number;
	image_h: number;
	occluded: boolean;
}
