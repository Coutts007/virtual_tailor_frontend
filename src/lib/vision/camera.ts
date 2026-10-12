/**
 * Camera access (Section 10.1). Phase 2 provides the permission probe; Phase 3
 * adds lens selection, constraints, stills and track lifecycle.
 */
import { isSimulated } from './index';

export interface CameraProbe {
	hasEnvironment: boolean;
	/** Long edge of the best stream the camera offers. */
	longEdge: number | null;
}

/** Triggers the permission prompt (after priming) and reads capabilities. */
export async function probeCamera(): Promise<CameraProbe> {
	if (isSimulated()) return { hasEnvironment: true, longEdge: 1920 };
	const stream = await navigator.mediaDevices.getUserMedia({
		video: {
			facingMode: { ideal: 'environment' },
			width: { ideal: 1080 },
			height: { ideal: 1920 }
		},
		audio: false
	});
	try {
		const track = stream.getVideoTracks()[0];
		const caps = track?.getCapabilities?.() as MediaTrackCapabilities | undefined;
		const settings = track?.getSettings();
		const longEdge =
			Math.max(
				caps?.width?.max ?? settings?.width ?? 0,
				caps?.height?.max ?? settings?.height ?? 0
			) || null;
		const devices = await navigator.mediaDevices.enumerateDevices();
		const cams = devices.filter((d) => d.kind === 'videoinput');
		const facing = settings?.facingMode;
		const hasEnvironment =
			facing === 'environment' ||
			cams.some((d) => /back|rear|environment/i.test(d.label)) ||
			(cams.length > 1 && facing !== 'user');
		return { hasEnvironment, longEdge };
	} finally {
		for (const tr of stream.getTracks()) tr.stop();
	}
}
