/**
 * FakeVisionEngine (Section 20.4): replays scripted check sequences and returns
 * synthetic bursts from the measurement module's synthetic body, so the whole
 * capture flow runs on a laptop with no camera. Development and tests only.
 */
import type { Landmark, Sex, ViewChecks } from '$lib/api/types';
import type { View } from '$lib/capture/checks';
import { defaultBody, synthesizeView } from '$lib/measure/synthetic';
import { scenario, type FakeIssue, type FakeScenario } from './fakeScenarios';
import {
	BurstFailedError,
	type LiveAnalysis,
	type StreamInfo,
	type ViewCapture,
	type VisionEngine
} from './types';

const PASS: ViewChecks = {
	level: 'pass',
	frame: 'pass',
	distance: 'pass',
	symmetry: 'pass',
	arms: 'pass',
	marker: 'pass',
	light: 'pass',
	sharpness: 'pass'
};

export interface FakeOptions {
	scenarioId: string;
	/** < 1 speeds scripted steps up (e2e tests). */
	timeScale?: number;
	height_mm: number;
	sex: Sex;
	stillAvailable?: boolean;
}

/** Burst attempts per view for the page's lifetime, so scripted errors happen once even though each view mounts a new engine. */
const burstAttempts: Record<View, number> = { front: 0, side: 0 };

export class FakeVisionEngine implements VisionEngine {
	readonly kind = 'fake' as const;
	private sc: FakeScenario;
	private viewStart = 0;
	private base: Record<View, { landmarks: Landmark[]; box: LiveAnalysis['maskBox'] }> | null = null;
	private tick = 0;

	constructor(private opts: FakeOptions) {
		this.sc = scenario(opts.scenarioId);
	}

	async start(): Promise<StreamInfo> {
		const body = defaultBody(this.opts.height_mm, this.opts.sex);
		const make = (view: View) => {
			const { input } = synthesizeView(body, view, { maskScale: 0.1, distance_m: 2.3, seed: 7 });
			const m = input.mask;
			let top = 1,
				bottom = 0,
				left = 1,
				right = 0;
			for (let y = 0; y < m.height; y++)
				for (let x = 0; x < m.width; x++)
					if (m.data[y * m.width + x]) {
						top = Math.min(top, y / m.height);
						bottom = Math.max(bottom, (y + 1) / m.height);
						left = Math.min(left, x / m.width);
						right = Math.max(right, (x + 1) / m.width);
					}
			return { landmarks: input.landmarks, box: { top, bottom, left, right } };
		};
		this.base = { front: make('front'), side: make('side') };
		return { width: 1080, height: 1920, lens_note: 'simulated' };
	}

	beginView(_view: View, now: number) {
		this.viewStart = now;
	}

	/** Issues active at `now` for this view. */
	issuesAt(view: View, now: number): FakeIssue[] {
		const scale = this.opts.timeScale ?? 1;
		let t = (now - this.viewStart) / scale;
		for (const step of this.sc[view]) {
			if (t < step.ms) return step.issues;
			t -= step.ms;
		}
		return [];
	}

	async analyze(view: View, now: number): Promise<LiveAnalysis | null> {
		if (!this.base) return null;
		const issues = new Set(this.issuesAt(view, now));
		this.tick++;
		const jitter = (this.tick % 2 ? 1 : -1) * (issues.has('shaky') ? 0.02 : 0.0004);
		let L = this.base[view].landmarks.map((l) => ({ ...l, x: l.x + jitter, y: l.y }));
		let box = { ...this.base[view].box! };
		const scaleAbout = (k: number, cy = 0.5) => {
			L = L.map((l) => ({ ...l, x: 0.5 + (l.x - 0.5) * k, y: cy + (l.y - cy) * k }));
			box = {
				top: cy + (box.top - cy) * k,
				bottom: cy + (box.bottom - cy) * k,
				left: 0.5 + (box.left - 0.5) * k,
				right: 0.5 + (box.right - 0.5) * k
			};
		};
		if (issues.has('tooFar')) scaleAbout(0.55);
		if (issues.has('tooClose')) scaleAbout(1.35);
		if (issues.has('headCut')) {
			L = L.map((l) => ({ ...l, y: l.y - 0.27 }));
			box = { ...box, top: box.top - 0.27, bottom: box.bottom - 0.27 };
		}
		if (issues.has('turned')) {
			if (view === 'front') L[11] = { ...L[11]!, x: L[11]!.x + 0.05 };
			else {
				L[11] = { ...L[11]!, x: L[11]!.x + 0.08 };
				L[23] = { ...L[23]!, x: L[23]!.x + 0.06 };
			}
		}
		if (issues.has('armsIn')) {
			if (view === 'front') {
				L[15] = { ...L[15]!, x: L[23]!.x + 0.005 };
				L[16] = { ...L[16]!, x: L[24]!.x - 0.005 };
			} else {
				const hip = L[24]!.x;
				L[15] = { ...L[15]!, x: hip - 0.03 };
				L[16] = { ...L[16]!, x: hip - 0.03 };
			}
		}
		const noPerson = issues.has('noPerson');
		return {
			landmarks: noPerson ? null : L,
			maskBox: noPerson ? null : box,
			armMerge: { left: issues.has('armsIn') && view === 'front', right: false },
			marker: noPerson
				? { found: false, sidePx: 0, ratio: 1, occluded: false }
				: {
						found: !issues.has('noMarker') && !issues.has('fingers'),
						occluded: issues.has('fingers'),
						sidePx: issues.has('tooFar') ? 60 : 112,
						ratio: 1.01
					},
			luminance: issues.has('dark') ? 35 : issues.has('bright') ? 238 : 128,
			sharpness: issues.has('blur') ? 40 : 260,
			streamH: 1920,
			stillAvailable: this.opts.stillAvailable ?? true
		};
	}

	/** Fake orientation: 'tilted' issue → off-level. */
	orientationAt(view: View, now: number): { beta: number; gamma: number } {
		return this.issuesAt(view, now).includes('tilted')
			? { beta: 81, gamma: 4 }
			: { beta: 90.2, gamma: 0.3 };
	}

	async burst(view: View): Promise<ViewCapture> {
		burstAttempts[view]++;
		const b = this.sc.burst ?? {};
		if ((b.failFrames ?? 0) > 2 && burstAttempts[view] === 1) throw new BurstFailedError();
		const body = defaultBody(this.opts.height_mm, this.opts.sex);
		const { input } = synthesizeView(body, view, {
			maskScale: 0.25,
			distance_m: 2.3,
			legGap: b.legGap ?? true,
			noise: 0.4,
			seed: 11 + burstAttempts[view]
		});
		let markerConfidence = 0.95;
		// Scale disagreement: the marker reads the wrong size on the first front burst only.
		if (b.scaleError && view === 'front' && burstAttempts.front === 1 && input.marker) {
			const k = 1 + b.scaleError;
			const [cx, cy] = input.marker.corners.reduce(
				([sx, sy], [x, y]) => [sx + x / 4, sy + y / 4],
				[0, 0]
			);
			input.marker = {
				...input.marker,
				side_px: input.marker.side_px * k,
				corners: input.marker.corners.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]) as [
					number,
					number
				][]
			};
			markerConfidence = b.markerConfidence ?? 0.7;
		}
		if (input.marker) input.marker = { ...input.marker, confidence: markerConfidence };
		return {
			view,
			data: input,
			checks: { ...PASS },
			marker_confidence: markerConfidence,
			frames_ok: 5,
			still_source: 'canvas'
		};
	}

	draw(canvas: HTMLCanvasElement, last: LiveAnalysis | null, view: View) {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const { width: W, height: H } = canvas;
		const g = ctx.createLinearGradient(0, 0, 0, H);
		g.addColorStop(0, '#3a3631');
		g.addColorStop(0.78, '#4a443d');
		g.addColorStop(0.78, '#2c2925');
		g.addColorStop(1, '#24211e');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, W, H);
		if (last?.luminance != null && last.luminance < 60) {
			ctx.fillStyle = 'rgb(0 0 0 / 0.6)';
			ctx.fillRect(0, 0, W, H);
		}
		const L = last?.landmarks;
		if (L) {
			const P = (i: number) => [L[i]!.x * W, L[i]!.y * H] as const;
			ctx.strokeStyle = '#d9cfc2';
			ctx.lineCap = 'round';
			ctx.lineWidth = W * 0.045;
			const bones = [
				[11, 12],
				[11, 23],
				[12, 24],
				[23, 24],
				[11, 13],
				[13, 15],
				[12, 14],
				[14, 16],
				[23, 25],
				[25, 27],
				[24, 26],
				[26, 28]
			];
			for (const [a, b] of bones) {
				ctx.beginPath();
				ctx.moveTo(...P(a!));
				ctx.lineTo(...P(b!));
				ctx.stroke();
			}
			const [hx, hy] = P(0);
			ctx.fillStyle = '#d9cfc2';
			ctx.beginPath();
			ctx.arc(hx, hy - H * 0.01, W * 0.045, 0, Math.PI * 2);
			ctx.fill();
			if (last?.marker?.found) {
				const s = W * 0.07;
				const [mx, my] =
					view === 'front' ? [(L[11]!.x + L[12]!.x) / 2, L[11]!.y + 0.05] : [L[24]!.x, L[24]!.y];
				ctx.fillStyle = '#fff';
				ctx.fillRect(mx * W - s * 0.65, my * H - s * 0.65, s * 1.3, s * 1.3);
				ctx.fillStyle = '#000';
				ctx.fillRect(mx * W - s / 2, my * H - s / 2, s, s);
			}
		}
		ctx.fillStyle = 'rgb(255 255 255 / 0.55)';
		ctx.font = `600 ${Math.round(W * 0.035)}px system-ui, sans-serif`;
		ctx.fillText('SIMULATED CAMERA', W * 0.04, H * 0.97);
	}

	stop() {
		this.base = null;
	}
}
