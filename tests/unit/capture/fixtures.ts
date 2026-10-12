import type { Landmark } from '../../../src/lib/api/types';
import type { LiveFrame } from '../../../src/lib/capture/checks';

/** A standing person, arms out, filling ~49% of frame height (front view). */
export function frontLandmarks(): Landmark[] {
	const L: Landmark[] = Array.from({ length: 33 }, () => ({
		x: 0.5,
		y: 0.5,
		z: 0,
		visibility: 0.95
	}));
	const set = (i: number, x: number, y: number) => (L[i] = { x, y, z: 0, visibility: 0.95 });
	set(0, 0.5, 0.29);
	set(11, 0.575, 0.34);
	set(12, 0.425, 0.34);
	set(13, 0.62, 0.41);
	set(14, 0.38, 0.41);
	set(15, 0.66, 0.48);
	set(16, 0.34, 0.48);
	set(23, 0.545, 0.5);
	set(24, 0.455, 0.5);
	set(25, 0.545, 0.61);
	set(26, 0.455, 0.61);
	set(27, 0.545, 0.71);
	set(28, 0.455, 0.71);
	set(29, 0.545, 0.73);
	set(30, 0.455, 0.73);
	return L;
}

/** Right side to camera, facing +x, arms slightly forward. */
export function sideLandmarks(): Landmark[] {
	const L = frontLandmarks().map((l) => ({ ...l, x: 0.5 }));
	L[0] = { ...L[0]!, x: 0.53 };
	L[15] = { ...L[15]!, x: 0.54 };
	L[16] = { ...L[16]!, x: 0.54 };
	return L;
}

export function goodFrame(
	view: 'front' | 'side' = 'front',
	over: Partial<LiveFrame> = {}
): LiveFrame {
	return {
		t: 0,
		orientation: { beta: 90, gamma: 0 },
		levelUnchecked: false,
		landmarks: view === 'front' ? frontLandmarks() : sideLandmarks(),
		maskBox: { top: 0.26, bottom: 0.74, left: 0.3, right: 0.7 },
		armMerge: { left: false, right: false },
		marker: { found: true, sidePx: 110, ratio: 1.01, occluded: false },
		luminance: 130,
		sharpness: 240,
		streamH: 1920,
		stillAvailable: true,
		...over
	};
}
