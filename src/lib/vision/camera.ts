/**
 * Camera (Section 10.1). Opens the rear camera at 1080 × 1920 portrait, avoids
 * the ultra-wide lens, asks for continuous focus, reads back what was applied,
 * and stops every track when capture ends (Safari falls back to 640 × 480 when
 * an old stream is still open). Nothing here stores or sends a frame.
 */
import { isSimulated } from './index';

export interface CameraProbe {
	hasEnvironment: boolean;
	/** Long edge of the best stream the camera offers. */
	longEdge: number | null;
}

export interface OpenCamera {
	stream: MediaStream;
	track: MediaStreamTrack;
	width: number;
	height: number;
	/** The stream arrived landscape for a portrait request (iOS): rotate in the pipeline. */
	rotate: boolean;
	lens_note: string;
	applied: Record<string, unknown>;
	imageCapture: { takePhoto(): Promise<Blob> } | null;
	stop(): void;
}

export const CONSTRAINTS: MediaStreamConstraints = {
	video: {
		facingMode: { ideal: 'environment' },
		width: { ideal: 1080 },
		height: { ideal: 1920 },
		aspectRatio: { ideal: 9 / 16 },
		frameRate: { ideal: 30, max: 30 }
	},
	audio: false
};

const WIDE = /wide|ultra|0[.,]5/i;

type Caps = MediaTrackCapabilities & { zoom?: { min: number; max: number }; focusMode?: string[] };

/** Triggers the permission prompt (after priming) and reads capabilities. */
export async function probeCamera(): Promise<CameraProbe> {
	if (isSimulated()) return { hasEnvironment: true, longEdge: 1920 };
	const stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
	try {
		const track = stream.getVideoTracks()[0];
		const caps = track?.getCapabilities?.() as Caps | undefined;
		const settings = track?.getSettings();
		const longEdge =
			Math.max(
				caps?.width?.max ?? settings?.width ?? 0,
				caps?.height?.max ?? settings?.height ?? 0
			) || null;
		const cams = (await navigator.mediaDevices.enumerateDevices()).filter(
			(d) => d.kind === 'videoinput'
		);
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

async function tune(track: MediaStreamTrack): Promise<Record<string, unknown>> {
	const caps = (track.getCapabilities?.() ?? {}) as Caps;
	const advanced: Record<string, unknown>[] = [];
	// Prevent the ultra-wide on phones that expose zoom < 1 (10.1.2).
	if (caps.zoom && caps.zoom.min < 1) advanced.push({ zoom: 1 });
	if (caps.focusMode?.includes('continuous')) advanced.push({ focusMode: 'continuous' });
	for (const a of advanced) {
		try {
			await track.applyConstraints({ advanced: [a as MediaTrackConstraintSet] });
		} catch {
			/* ignored constraints never fail capture (10.1.3) */
		}
	}
	const s = track.getSettings() as MediaTrackSettings & { zoom?: number; focusMode?: string };
	return {
		width: s.width,
		height: s.height,
		frameRate: s.frameRate,
		zoom: s.zoom,
		focusMode: s.focusMode,
		deviceLabel: track.label
	};
}

export async function openCamera(video: HTMLVideoElement | null): Promise<OpenCamera> {
	let stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
	let track = stream.getVideoTracks()[0]!;
	let lens_note = track.label ? `lens: ${track.label}` : 'lens: unknown';

	// Multi-camera Android: if we landed on an ultra-wide, switch to the main back camera.
	if (WIDE.test(track.label)) {
		const cams = (await navigator.mediaDevices.enumerateDevices()).filter(
			(d) =>
				d.kind === 'videoinput' && /back|rear|environment/i.test(d.label) && !WIDE.test(d.label)
		);
		for (const cam of cams) {
			try {
				for (const t of stream.getTracks()) t.stop();
				const v = CONSTRAINTS.video as MediaTrackConstraints;
				stream = await navigator.mediaDevices.getUserMedia({
					video: { ...v, facingMode: undefined, deviceId: { exact: cam.deviceId } },
					audio: false
				});
				track = stream.getVideoTracks()[0]!;
				lens_note = `lens: switched to ${track.label}`;
				break;
			} catch {
				/* try the next one */
			}
		}
	}
	if (/iPhone|iPad/.test(navigator.userAgent))
		lens_note += ' (iOS may switch lenses; per-view marker scale applies)';

	const applied = await tune(track);
	if (video) {
		video.srcObject = stream;
		video.muted = true;
		video.playsInline = true;
		await video.play().catch(() => {});
		if (!video.videoWidth)
			await new Promise((r) => video.addEventListener('loadedmetadata', r, { once: true }));
	}
	const width = video?.videoWidth || (applied.width as number) || 1080;
	const height = video?.videoHeight || (applied.height as number) || 1920;
	const IC = (
		globalThis as unknown as {
			ImageCapture?: new (t: MediaStreamTrack) => { takePhoto(): Promise<Blob> };
		}
	).ImageCapture;
	const imageCapture = IC ? new IC(track) : null;

	return {
		stream,
		track,
		width: Math.min(width, height),
		height: Math.max(width, height),
		rotate: width > height,
		lens_note,
		applied,
		imageCapture,
		stop() {
			for (const t of stream.getTracks()) t.stop();
			if (video) {
				video.pause();
				video.srcObject = null;
			}
		}
	};
}
