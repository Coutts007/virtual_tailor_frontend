/**
 * DeviceOrientation for the level check (C1). iOS needs requestPermission()
 * from a tap; if denied, the level check is skipped and flagged (UC-01 alt 2a).
 */
export const orientation = $state<{
	beta: number | null;
	gamma: number | null;
	available: boolean | null;
	denied: boolean;
}>({
	beta: null,
	gamma: null,
	available: null,
	denied: false
});

type IOSOrientation = typeof DeviceOrientationEvent & {
	requestPermission?: () => Promise<'granted' | 'denied'>;
};

export function needsMotionPermission(): boolean {
	return (
		typeof DeviceOrientationEvent !== 'undefined' &&
		typeof (DeviceOrientationEvent as IOSOrientation).requestPermission === 'function'
	);
}

/** Must be called from a user gesture on iOS. */
export async function requestMotionPermission(): Promise<boolean> {
	if (!needsMotionPermission()) return true;
	try {
		const r = await (DeviceOrientationEvent as IOSOrientation).requestPermission!();
		orientation.denied = r !== 'granted';
		return r === 'granted';
	} catch {
		orientation.denied = true;
		return false;
	}
}

let listening = 0;
function handle(e: DeviceOrientationEvent) {
	if (e.beta == null || e.gamma == null) return;
	orientation.beta = e.beta;
	orientation.gamma = e.gamma;
	orientation.available = true;
}

/** Ref-counted listener; returns a stop function. */
export function watchOrientation(timeoutMs = 2000): () => void {
	if (typeof window === 'undefined') return () => {};
	if (listening++ === 0) addEventListener('deviceorientation', handle);
	const t = setTimeout(() => {
		if (orientation.available == null) orientation.available = false;
	}, timeoutMs);
	return () => {
		clearTimeout(t);
		if (--listening === 0) removeEventListener('deviceorientation', handle);
	};
}

/** Test and fake-vision hook: set the orientation directly. */
export function setOrientation(beta: number | null, gamma: number | null) {
	orientation.beta = beta;
	orientation.gamma = gamma;
	orientation.available = beta != null;
}
