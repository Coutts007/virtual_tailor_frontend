/**
 * Frame grabbing (Section 10.2): draw the current video frame, rotated to
 * portrait if needed, downscaled to a long edge, into a reusable canvas and
 * return an ImageBitmap to transfer to a worker. Bitmaps are counted so the
 * memory privacy test can prove none survive (Section 21.1).
 */
let live = 0;
export function liveBitmaps(): number {
	return live;
}
/** Closes a bitmap and updates the counter. */
export function release(b: ImageBitmap | null | undefined): void {
	if (!b) return;
	b.close();
	live = Math.max(0, live - 1);
}
/** Call when a bitmap was transferred to a worker (the worker closes it). */
export function transferred(): void {
	live = Math.max(0, live - 1);
}

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;
const canvases = new Map<number, AnyCanvas>();

function canvasFor(key: number, w: number, h: number): AnyCanvas {
	let c = canvases.get(key);
	if (!c) {
		c =
			typeof OffscreenCanvas !== 'undefined'
				? new OffscreenCanvas(w, h)
				: Object.assign(document.createElement('canvas'), { width: w, height: h });
		canvases.set(key, c);
	}
	if (c.width !== w) c.width = w;
	if (c.height !== h) c.height = h;
	return c;
}

/** Safari caps canvases at 16.78 megapixels (10.2). */
export const MAX_CANVAS_PIXELS = 16_777_216;

export function fit(srcW: number, srcH: number, longEdge: number): { w: number; h: number } {
	const k = Math.min(1, longEdge / Math.max(srcW, srcH));
	let w = Math.round(srcW * k);
	let h = Math.round(srcH * k);
	const px = w * h;
	if (px > MAX_CANVAS_PIXELS) {
		const s = Math.sqrt(MAX_CANVAS_PIXELS / px);
		w = Math.floor(w * s);
		h = Math.floor(h * s);
	}
	return { w, h };
}

export async function grabFrame(
	source: HTMLVideoElement | ImageBitmap,
	longEdge: number,
	rotate: boolean,
	key = longEdge
): Promise<ImageBitmap> {
	const sw = 'videoWidth' in source ? source.videoWidth : source.width;
	const sh = 'videoHeight' in source ? source.videoHeight : source.height;
	const portraitW = rotate ? sh : sw;
	const portraitH = rotate ? sw : sh;
	const { w, h } = fit(portraitW, portraitH, longEdge);
	const c = canvasFor(key, w, h);
	const ctx = c.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
	ctx.save();
	if (rotate) {
		// Landscape delivery for a portrait request (iOS): rotate 90° clockwise.
		ctx.translate(w, 0);
		ctx.rotate(Math.PI / 2);
		ctx.drawImage(source, 0, 0, h, w);
	} else ctx.drawImage(source, 0, 0, w, h);
	ctx.restore();
	const bmp = await createImageBitmap(c);
	live++;
	return bmp;
}

/** Privacy invariant 2: reset every working canvas to 0 × 0. */
export function releaseCanvases(): void {
	for (const c of canvases.values()) {
		c.width = 0;
		c.height = 0;
	}
	canvases.clear();
}
