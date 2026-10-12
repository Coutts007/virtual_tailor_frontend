/**
 * Phone check (Section 9.4) against the platform floor (2.2, C3).
 * Camera checks need permission, so they run in two stages: the page runs
 * everything else at once, and the camera rows are completed on /setup right
 * after the client allows the camera (priming before the prompt, 9.6).
 */
import { simd } from 'wasm-feature-detect';
import type { DeviceInfo } from './deviceInfo';

export type CheckStatus = 'pass' | 'caution' | 'fail' | 'skip' | 'pending';
export type PreflightId =
	| 'secure'
	| 'browser'
	| 'simd'
	| 'memory'
	| 'camera'
	| 'resolution'
	| 'motion'
	| 'storage'
	| 'models';
export interface PreflightRow {
	id: PreflightId;
	status: CheckStatus;
	/** Extra info for the row text, e.g. MB to download. */
	detail?: Record<string, string | number>;
}
export interface PreflightResult {
	rows: PreflightRow[];
	verdict: 'ready' | 'slower' | 'cannot';
	device: DeviceInfo;
	stream_max: number | null;
	checked_at: string;
}

/** Safari/iOS versions are encoded major + minor / 100 (see deviceInfo): 16.4 → 16.04. */
export const FLOOR = { chrome: 91, samsung: 16, safari: 16.04, android: 11, ios: 16.04 };
export const RECOMMENDED = { chrome: 105, safari: 16.04, memoryGb: 4 };

export function browserStatus(d: DeviceInfo): CheckStatus {
	const { browser_name: b, browser_major: v } = d;
	if (d.os_name === 'android' && d.os_major && d.os_major < FLOOR.android) return 'fail';
	if (d.os_name === 'ios' && d.os_major && d.os_major < FLOOR.ios) return 'fail';
	if (b === 'chrome')
		return v < FLOOR.chrome ? 'fail' : v < RECOMMENDED.chrome ? 'caution' : 'pass';
	if (b === 'samsung') return v < FLOOR.samsung ? 'fail' : 'pass';
	if (b === 'safari') return v < FLOOR.safari ? 'fail' : 'pass';
	// Other browsers: feature detection decides; warn.
	return 'caution';
}

export function memoryStatus(gb: number | null): CheckStatus {
	if (gb == null) return 'skip'; // iOS / Safari: unknown
	if (gb <= 2) return 'fail';
	if (gb <= 3) return 'caution';
	return 'pass';
}

/** Long edge of the best stream: fail < 1280, caution < 1920. */
export function resolutionStatus(longEdge: number | null): CheckStatus {
	if (longEdge == null) return 'pending';
	if (longEdge < 1280) return 'fail';
	if (longEdge < 1920) return 'caution';
	return 'pass';
}

export function verdict(rows: PreflightRow[]): PreflightResult['verdict'] {
	if (rows.some((r) => r.status === 'fail')) return 'cannot';
	if (rows.some((r) => r.status === 'caution')) return 'slower';
	return 'ready';
}

export async function motionAvailable(timeoutMs = 2000): Promise<boolean> {
	if (typeof DeviceOrientationEvent === 'undefined') return false;
	const needsPermission =
		typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown })
			.requestPermission === 'function';
	if (needsPermission) return true; // iOS: confirmed after "Allow motion" on /setup
	return new Promise((resolve) => {
		const t = setTimeout(
			() => (removeEventListener('deviceorientation', h), resolve(false)),
			timeoutMs
		);
		const h = (e: DeviceOrientationEvent) => {
			if (e.beta == null) return;
			clearTimeout(t);
			removeEventListener('deviceorientation', h);
			resolve(true);
		};
		addEventListener('deviceorientation', h);
	});
}

export async function runPreflight(
	device: DeviceInfo,
	opts: {
		modelsCached: boolean;
		modelMb: number;
		camera?: { hasEnvironment: boolean; longEdge: number | null } | null;
		simulated?: boolean;
	}
): Promise<PreflightResult> {
	const rows: PreflightRow[] = [];
	rows.push({ id: 'secure', status: isSecureContext ? 'pass' : 'fail' });
	rows.push({ id: 'browser', status: browserStatus(device) });
	let hasSimd = false;
	try {
		hasSimd = await simd();
	} catch {
		hasSimd = false;
	}
	rows.push({ id: 'simd', status: hasSimd ? 'pass' : 'fail' });
	rows.push({ id: 'memory', status: memoryStatus(device.memory_gb) });
	if (opts.simulated) {
		rows.push({ id: 'camera', status: 'pass', detail: { simulated: 1 } });
		rows.push({ id: 'resolution', status: 'pass', detail: { simulated: 1 } });
	} else if (opts.camera) {
		rows.push({ id: 'camera', status: opts.camera.hasEnvironment ? 'pass' : 'fail' });
		rows.push({ id: 'resolution', status: resolutionStatus(opts.camera.longEdge) });
	} else {
		rows.push({ id: 'camera', status: 'pending' });
		rows.push({ id: 'resolution', status: 'pending' });
	}
	rows.push({
		id: 'motion',
		status: opts.simulated || (await motionAvailable()) ? 'pass' : 'caution'
	});
	let storage: CheckStatus = 'skip';
	try {
		const est = await navigator.storage?.estimate?.();
		if (est?.quota != null)
			storage = (est.quota - (est.usage ?? 0)) / 1e6 < 100 ? 'caution' : 'pass';
		await navigator.storage?.persist?.();
	} catch {
		/* unknown */
	}
	rows.push({ id: 'storage', status: storage });
	rows.push({
		id: 'models',
		status: 'pass',
		detail: opts.modelsCached ? { cached: 1 } : { mb: opts.modelMb }
	});
	return {
		rows,
		verdict: verdict(rows),
		device,
		stream_max: opts.camera?.longEdge ?? null,
		checked_at: new Date().toISOString()
	};
}
