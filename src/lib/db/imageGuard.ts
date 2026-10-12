/**
 * Privacy invariant 2.1.1: nothing image-like may be written to IndexedDB.
 * Rejects Blob/File, ImageData, ImageBitmap, canvases, large binary buffers
 * and data:image strings anywhere in an object graph.
 */
export const MAX_BINARY_BYTES = 64 * 1024;

export class ImageDataForbiddenError extends Error {
	constructor(public path: string) {
		super(`Image-like data is not allowed in local storage (at ${path})`);
		this.name = 'ImageDataForbiddenError';
	}
}

function isInstance(value: unknown, ctorName: string): boolean {
	const ctor = (globalThis as Record<string, unknown>)[ctorName];
	return typeof ctor === 'function' && value instanceof (ctor as new () => unknown);
}

export function findImageLike(
	value: unknown,
	path = '$',
	seen = new WeakSet<object>()
): string | null {
	if (value == null) return null;
	if (typeof value === 'string') {
		return /^\s*data:image\//i.test(value) ? path : null;
	}
	if (typeof value !== 'object') return null;
	if (seen.has(value)) return null;
	seen.add(value);

	for (const name of [
		'Blob',
		'File',
		'ImageData',
		'ImageBitmap',
		'HTMLCanvasElement',
		'OffscreenCanvas',
		'HTMLImageElement',
		'HTMLVideoElement',
		'VideoFrame'
	]) {
		if (isInstance(value, name)) return path;
	}
	if (value instanceof ArrayBuffer) return value.byteLength > MAX_BINARY_BYTES ? path : null;
	if (ArrayBuffer.isView(value)) return value.byteLength > MAX_BINARY_BYTES ? path : null;

	if (Array.isArray(value)) {
		for (let i = 0; i < value.length; i++) {
			const hit = findImageLike(value[i], `${path}[${i}]`, seen);
			if (hit) return hit;
		}
		return null;
	}
	for (const [k, v] of Object.entries(value)) {
		const hit = findImageLike(v, `${path}.${k}`, seen);
		if (hit) return hit;
	}
	return null;
}

export function assertNoImageData(value: unknown): void {
	const hit = findImageLike(value);
	if (hit) throw new ImageDataForbiddenError(hit);
}
