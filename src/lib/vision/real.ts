/**
 * Real camera + worker pipeline. Implemented in Phase 3 (Section 10).
 */
import type { View } from '$lib/capture/checks';
import type { LiveAnalysis, StreamInfo, ViewCapture, VisionEngine } from './types';

export class RealVisionEngine implements VisionEngine {
	readonly kind = 'real' as const;
	async start(): Promise<StreamInfo> {
		throw new Error('camera_unavailable');
	}
	beginView(_v: View, _n: number) {}
	async analyze(): Promise<LiveAnalysis | null> {
		return null;
	}
	async burst(): Promise<ViewCapture> {
		throw new Error('camera_unavailable');
	}
	stop() {}
}
