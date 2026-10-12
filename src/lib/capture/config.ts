/**
 * Every capture threshold in one place (Section 10.3). Versioned as part of
 * rules_version via configHash; tune in the pilot on /dev/capture-tuning.
 */
export const CAPTURE_CONFIG = {
	/** C1: upright portrait phone reports beta ≈ 90°. */
	level: { betaMin: 88, betaMax: 92, gammaMax: 2 },
	person: {
		minVisibility: 0.5,
		front: [0, 11, 12, 23, 24, 27, 28],
		frontHeelsAnyOf: [29, 30],
		side: [12, 24, 26, 28, 30]
	},
	frame: { topMarginMin: 0.03, bottomMax: 0.97, sideMarginMin: 0.03 },
	/** C2: 31–63% of frame height (600–1,200 px on a 1920-tall stream). */
	distance: { minFrac: 600 / 1920, maxFrac: 1200 / 1920 },
	symmetry: { frontRatioTol: 0.05, sideGapMaxFrac: 0.04 },
	arms: { wristHipMinShoulderFrac: 0.25 },
	marker: { maxSideRatio: 1.03, minSidePx: 80 },
	light: { lumMin: 60, lumMax: 220, blurMin: 100 /* T_blur placeholder, set in pilot */ },
	stability: { samples: 10, maxJitterFrac: 0.01 },
	timing: {
		hysteresisMs: 300,
		messageMinMs: 1500,
		greenHoldMs: 1000,
		countdownS: 3,
		walkAwayS: 8,
		sideTransitionS: 6,
		levelHoldMs: 1000,
		speakMinGapMs: 3000
	},
	live: { minFps: 5, maxFps: 8, longEdge: 1280 },
	burst: { frames: 5, spacingMs: 200, longEdge: 1920, lowMemLongEdge: 1280, maxBadFrames: 2 }
} as const;

export type CaptureConfig = typeof CAPTURE_CONFIG;

/** FNV-1a over a stable JSON string. */
function fnv(s: string): string {
	let h = 0x811c9dc5;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 0x01000193) >>> 0;
	}
	return h.toString(16).padStart(8, '0');
}

function stable(v: unknown): string {
	if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
	if (v && typeof v === 'object')
		return `{${Object.keys(v)
			.sort()
			.map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`)
			.join(',')}}`;
	return JSON.stringify(v);
}

export function captureConfigHash(cfg: CaptureConfig = CAPTURE_CONFIG): string {
	return fnv(stable(cfg));
}
