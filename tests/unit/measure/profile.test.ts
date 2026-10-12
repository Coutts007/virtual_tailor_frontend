import { describe, expect, it } from 'vitest';
import type { Measurement, SiteCode } from '../../../src/lib/api/types';
import { computeProfile, configHash } from '../../../src/lib/measure';
import { synthInput } from './helpers';

const LENGTHS: SiteCode[] = ['stature', 'shoulder', 'sleeve', 'outleg', 'inleg'];
const GIRTHS: SiteCode[] = ['chest', 'waist', 'hip', 'neck'];
const row = (ms: Measurement[], s: SiteCode) => ms.find((m) => m.site_code === s)!;
const err = (v: number | null, t: number) => Math.abs((v ?? NaN) / t - 1) * 100;

describe('full synthetic body (FR-07, 11.4)', () => {
	const cases = [
		{ sex: 'female' as const, height: 1700, distance_m: 2.3, maskScale: 1, len: 1.5, gir: 3 },
		{ sex: 'male' as const, height: 1700, distance_m: 2.3, maskScale: 1, len: 1.5, gir: 3 },
		{ sex: 'male' as const, height: 1900, distance_m: 2.5, maskScale: 1, len: 1.5, gir: 3 },
		{ sex: 'female' as const, height: 1500, distance_m: 2.0, maskScale: 1, len: 1.5, gir: 3 },
		{
			sex: 'unspecified' as const,
			height: 1650,
			distance_m: 2.3,
			maskScale: 0.5,
			len: 1.5,
			gir: 3
		},
		// Coarse masks (live-check resolution): wider tolerance.
		{ sex: 'female' as const, height: 1650, distance_m: 2.3, maskScale: 0.25, len: 2, gir: 4 }
	];
	for (const c of cases) {
		it(`${c.sex} ${c.height} mm at ${c.distance_m} m, mask ×${c.maskScale}: lengths ±${c.len} %, girths ±${c.gir} %`, () => {
			const { input, truth } = synthInput(c);
			const r = computeProfile(input);
			expect(r.measurements.map((m) => m.site_code)).toEqual([
				'stature',
				'neck',
				'shoulder',
				'chest',
				'waist',
				'hip',
				'sleeve',
				'outleg',
				'inleg'
			]);
			for (const s of LENGTHS)
				expect(err(row(r.measurements, s).value_mm, truth[s]!), s).toBeLessThan(c.len);
			for (const s of GIRTHS)
				expect(err(row(r.measurements, s).value_mm, truth[s]!), s).toBeLessThan(c.gir);
			expect(r.measurements.every((m) => m.confidence_flag === 'pass')).toBe(true);
			expect(r.failed_views).toEqual([]);
			expect(r.retake_view).toBeNull();
			expect(r.scale_disagreement_pct).toBeLessThan(1);
			expect(err(r.stature_estimated_mm, c.height)).toBeLessThan(1);
		});
	}

	it('records provenance on girth rows and no undefined fields', () => {
		const r = computeProfile(synthInput().input);
		const waist = row(r.measurements, 'waist');
		expect(waist).toMatchObject({ method: 'auto', correction_factor: 1, level_fraction: 0.6 });
		expect(waist.half_width_mm).toBeGreaterThan(waist.half_depth_mm!);
		expect(row(r.measurements, 'shoulder').half_width_mm).toBeGreaterThan(0);
		for (const m of r.measurements) expect(Object.values(m)).not.toContain(undefined);
		expect(r.rules_version).toBe('0.1-uncalibrated');
		expect(r.config_hash).toBe(configHash());
	});
});

describe('scale disagreement (FR-06, 11.1 step 3)', () => {
	it('2–4 % → every site Check (scale_disagree), no retake', () => {
		const { input, truth } = synthInput({ markerSidePx: 150 * 0.6026 * 1.03 });
		void truth;
		const r = computeProfile(input);
		expect(r.scale_disagreement_pct).toBeGreaterThan(2);
		expect(r.scale_disagreement_pct).toBeLessThan(4);
		expect(r.retake_view).toBeNull();
		for (const m of r.measurements) {
			expect(m.confidence_flag).toBe('check');
			expect(m.flag_reasons).toContain('scale_disagree');
		}
	});
	it('> 4 % → retake the view with the lower marker confidence', () => {
		const a = synthInput({ markerSidePx: 150 * 0.6026 * 1.06 });
		a.input.front.marker!.confidence = 0.9;
		a.input.side.marker!.confidence = 0.85;
		const r = computeProfile(a.input);
		expect(r.scale_disagreement_pct).toBeGreaterThan(4);
		expect(r.retake_view).toBe('side');
		a.input.side.marker!.confidence = 0.95;
		expect(computeProfile(a.input).retake_view).toBe('front');
	});
	it('within 2 % → no scale flag', () => {
		const r = computeProfile(synthInput({ markerSidePx: 150 * 0.6026 * 1.015 }).input);
		expect(r.scale_disagreement_pct).toBeLessThan(2);
		expect(r.measurements.some((m) => m.flag_reasons.includes('scale_disagree'))).toBe(false);
	});
});

describe('failed views (C4: null on fail)', () => {
	it('front marker missing → front sites fail with null, retake front', () => {
		const { input } = synthInput();
		input.front.marker = null;
		const r = computeProfile(input);
		expect(r.failed_views).toEqual(['front']);
		expect(r.retake_view).toBe('front');
		expect(r.scale_front_mm_px).toBe(0);
		expect(r.stature_estimated_mm).toBeNull();
		for (const m of r.measurements) {
			expect(m.confidence_flag).toBe('fail');
			expect(m.value_mm).toBeNull();
			expect(m.flag_reasons).toContain('view_failed');
		}
	});
	it('side marker not square → only sites needing the side fail', () => {
		const { input } = synthInput();
		input.side.marker!.corners[2] = [
			input.side.marker!.corners[2]![0] + 20,
			input.side.marker!.corners[2]![1]
		];
		const r = computeProfile(input);
		expect(r.failed_views).toEqual(['side']);
		expect(r.retake_view).toBe('side');
		for (const s of ['shoulder', 'sleeve', 'inleg', 'stature'] as SiteCode[])
			expect(row(r.measurements, s).confidence_flag, s).toBe('pass');
		for (const s of ['chest', 'waist', 'hip', 'neck', 'outleg'] as SiteCode[]) {
			expect(row(r.measurements, s).value_mm, s).toBeNull();
			expect(row(r.measurements, s).flag_reasons).toEqual(['view_failed']);
		}
	});
	it('an empty mask fails the view', () => {
		const { input } = synthInput();
		input.side.mask = { ...input.side.mask, data: new Uint8Array(input.side.mask.data.length) };
		expect(computeProfile(input).failed_views).toEqual(['side']);
	});
});

describe('flags (FR-08, 11.3)', () => {
	it('legs together → inside leg Not measured (crotch_not_found), value null', () => {
		const r = computeProfile(synthInput({ legGap: false }).input);
		expect(row(r.measurements, 'inleg')).toMatchObject({
			value_mm: null,
			confidence_flag: 'fail',
			flag_reasons: ['crotch_not_found']
		});
		expect(row(r.measurements, 'waist').confidence_flag).toBe('pass');
	});
	it('loose clothing → girths Check only', () => {
		const r = computeProfile(synthInput({}, { clothing_fit: 'loose' }).input);
		for (const s of GIRTHS)
			expect(row(r.measurements, s).flag_reasons, s).toEqual(['loose_clothing']);
		for (const s of LENGTHS) expect(row(r.measurements, s).confidence_flag, s).toBe('pass');
	});
	it('level unchecked → every site Check', () => {
		const r = computeProfile(synthInput({}, { level_unchecked: true }).input);
		for (const m of r.measurements) expect(m.flag_reasons).toEqual(['level_unchecked']);
	});
	it('weak marker on one view → Check on the sites using it', () => {
		const { input } = synthInput();
		input.side.marker!.confidence = 0.7;
		const r = computeProfile(input);
		expect(row(r.measurements, 'waist').flag_reasons).toEqual(['marker_weak']);
		expect(row(r.measurements, 'sleeve').confidence_flag).toBe('pass');
	});
	it('landmark visibility 0.5–0.7 → Check; < 0.5 → Not measured', () => {
		const { input } = synthInput();
		input.front.landmarks[12] = { ...input.front.landmarks[12]!, visibility: 0.6 };
		let r = computeProfile(input);
		expect(row(r.measurements, 'shoulder')).toMatchObject({
			confidence_flag: 'check',
			flag_reasons: ['landmark_low']
		});
		input.front.landmarks[12] = { ...input.front.landmarks[12]!, visibility: 0.3 };
		r = computeProfile(input);
		expect(row(r.measurements, 'shoulder')).toMatchObject({
			confidence_flag: 'fail',
			value_mm: null
		});
		// The sleeve uses the better-seen arm, so it stays good.
		expect(row(r.measurements, 'sleeve').confidence_flag).toBe('pass');
	});
	it('outside the plausible range → Not measured (out_of_range)', () => {
		const { input } = synthInput({}, {});
		input.config = { plausible_mm: { waist: [450, 500] } as never };
		expect(row(computeProfile(input).measurements, 'waist')).toMatchObject({
			value_mm: null,
			flag_reasons: ['out_of_range']
		});
	});
	it('waist level far from the narrowest width → Check (waist_level_mismatch)', () => {
		const { input } = synthInput();
		input.config = { waist_level: 0.75 };
		expect(row(computeProfile(input).measurements, 'waist').flag_reasons).toContain(
			'waist_level_mismatch'
		);
	});
	it('a hole in the mask at the waist row → Not measured (mask_gap)', () => {
		const { input } = synthInput();
		const f = input.front;
		const y = (f.landmarks[11]!.y + f.landmarks[23]!.y) / 2; // roughly mid-torso
		const sh = (f.landmarks[11]!.y + f.landmarks[12]!.y) / 2;
		const hp = (f.landmarks[23]!.y + f.landmarks[24]!.y) / 2;
		const wy = Math.floor((sh + 0.6 * (hp - sh)) * f.mask.height);
		void y;
		const cx = Math.floor(f.mask.width / 2);
		for (let x = cx - 200; x <= cx + 200; x++) if (x !== cx) f.mask.data[wy * f.mask.width + x] = 0;
		const r = computeProfile(input);
		expect(row(r.measurements, 'waist')).toMatchObject({
			value_mm: null,
			flag_reasons: ['mask_gap']
		});
	});
});
