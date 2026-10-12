import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES, resolveRules } from '../../../src/lib/measure';
import { View } from '../../../src/lib/measure/levels';
import { markerScale } from '../../../src/lib/measure/scale';
import {
	chest,
	crotchRow,
	shoulder,
	waist,
	type SiteContext
} from '../../../src/lib/measure/sites';
import type { MeasureInput } from '../../../src/lib/measure';
import { synthInput } from './helpers';

function ctx(input: MeasureInput, config = {}): SiteContext {
	const rules = resolveRules(config);
	return {
		front: new View(input.front),
		side: new View(input.side),
		sf: markerScale(input.front.marker, input.front.frame, rules).scale,
		ss: markerScale(input.side.marker, input.side.frame, rules).scale,
		rules,
		sex: input.sex
	};
}

describe('site rules (Table 3.1)', () => {
	it('a 1-pixel landmark change moves the shoulder by exactly one pixel of scale', () => {
		const { input } = synthInput();
		const c = ctx(input);
		const before = shoulder(c).value!;
		input.front.landmarks[11] = {
			...input.front.landmarks[11]!,
			x: input.front.landmarks[11]!.x + 1 / input.front.frame.width
		};
		const after = shoulder(ctx(input)).value!;
		expect(after - before).toBeCloseTo(c.sf, 6);
	});

	it('a 1-pixel wider waist row adds the expected girth', () => {
		const { input } = synthInput();
		const c = ctx(input);
		const before = waist(c);
		const f = input.front;
		const sh = (f.landmarks[11]!.y + f.landmarks[12]!.y) / 2;
		const hp = (f.landmarks[23]!.y + f.landmarks[24]!.y) / 2;
		const r = Math.floor((sh + 0.6 * (hp - sh)) * f.mask.height);
		const rowStart = r * f.mask.width;
		let right = f.mask.width / 2;
		while (f.mask.data[rowStart + right + 1] === 1) right++;
		f.mask.data[rowStart + right + 1] = 1;
		const after = waist(ctx(input));
		// a grows by half a pixel: dP/da of the ellipse × sf / 2.
		const a = before.half_width_mm!;
		const b = before.half_depth_mm!;
		const h = 1e-3;
		const P = (x: number) => Math.PI * (3 * (x + b) - Math.sqrt((3 * x + b) * (x + 3 * b)));
		const dPda = (P(a + h) - P(a - h)) / (2 * h);
		expect(after.value! - before.value!).toBeCloseTo((dPda * c.sf) / 2, 1);
	});

	it('female bust level follows the most-forward torso point; male uses the rule level', () => {
		const female = synthInput({ sex: 'female' });
		const f = chest(ctx(female.input, { chest_level: { female: 0.35 } }));
		expect(f.level_fraction!).toBeGreaterThan(0.2);
		expect(f.level_fraction!).toBeLessThan(0.3);
		const male = synthInput({ sex: 'male' });
		expect(chest(ctx(male.input, { chest_level: { male: 0.35 } })).level_fraction).toBeCloseTo(
			0.35,
			2
		);
	});

	it('arms hanging against the body are clipped at the arm line', () => {
		const out = synthInput({ sex: 'male' });
		const down = synthInput({ sex: 'male', armsOut: false });
		const a = chest(ctx(out.input)).value!;
		const b = chest(ctx(down.input)).value!;
		// Clipping keeps the arms from doubling the chest width.
		expect(b).toBeGreaterThan(a * 0.95);
		expect(b).toBeLessThan(a * 1.25);
	});

	it('crotch detection finds the gap and returns null when the legs touch', () => {
		const gap = synthInput();
		const v = new View(gap.input.front);
		const r = crotchRow(v)!;
		const inleg = (v.bottomY - (r + 1) * v.fy) / gap.truth.px_per_mm!;
		expect(Math.abs(inleg - gap.truth.inleg!)).toBeLessThan(5);
		expect(crotchRow(new View(synthInput({ legGap: false }).input.front))).toBeNull();
	});

	it('defaults are exported unchanged', () => {
		expect(DEFAULT_RULES.min_run_px).toBe(3);
	});
});
