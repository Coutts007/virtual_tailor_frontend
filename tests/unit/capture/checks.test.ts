import { describe, expect, it } from 'vitest';
import {
	Debouncer,
	allPass,
	evaluate,
	topCorrection,
	uiRows
} from '../../../src/lib/capture/checks';
import { goodFrame, frontLandmarks } from './fixtures';

const hist = (n = 9) => Array.from({ length: n }, (_, i) => goodFrame('front', { t: i * 150 }));

describe('capture checks (Section 10.3)', () => {
	it('a good front frame passes every check', () => {
		const r = evaluate(goodFrame(), 'front', hist());
		expect(allPass(r.states)).toBe(true);
		expect(topCorrection(r)).toBeNull();
	});

	it('a good side frame passes every check', () => {
		const hs = Array.from({ length: 9 }, () => goodFrame('side'));
		expect(allPass(evaluate(goodFrame('side'), 'side', hs).states)).toBe(true);
	});

	it.each([
		[{ beta: 90, gamma: 0 }, 'pass'],
		[{ beta: 88, gamma: 2 }, 'pass'],
		[{ beta: 92, gamma: -2 }, 'pass'],
		[{ beta: 87.9, gamma: 0 }, 'fail'],
		[{ beta: 90, gamma: 2.1 }, 'fail'],
		[{ beta: 0, gamma: 0 }, 'fail'] // C1: the source's |beta| ≤ 2° rule would wrongly pass a flat phone
	])('level (C1) %o → %s', (orientation, expected) => {
		expect(evaluate(goodFrame('front', { orientation }), 'front').states.level).toBe(expected);
	});

	it('level_unchecked passes the level check', () => {
		expect(
			evaluate(goodFrame('front', { orientation: null, levelUnchecked: true }), 'front').states
				.level
		).toBe('pass');
	});

	it('no pose → "Step into the outline"', () => {
		const r = evaluate(goodFrame('front', { landmarks: null }), 'front');
		expect(topCorrection(r)).toEqual({ check: 'person', key: 'capture.msg.stepInto' });
	});

	it('low visibility on a required landmark fails person found', () => {
		const L = frontLandmarks();
		L[27] = { ...L[27]!, visibility: 0.3 };
		expect(evaluate(goodFrame('front', { landmarks: L }), 'front').states.person).toBe('fail');
	});

	it('head and feet cut off', () => {
		expect(
			topCorrection(
				evaluate(
					goodFrame('front', { maskBox: { top: 0.01, bottom: 0.7, left: 0.3, right: 0.7 } }),
					'front'
				)
			)?.key
		).toBe('capture.msg.headCut');
		expect(
			topCorrection(
				evaluate(
					goodFrame('front', { maskBox: { top: 0.3, bottom: 0.99, left: 0.3, right: 0.7 } }),
					'front'
				)
			)?.key
		).toBe('capture.msg.feetCut');
	});

	it('distance band 31–63% of frame height (C2)', () => {
		const at = (h: number) =>
			evaluate(
				goodFrame('front', { maskBox: { top: 0.2, bottom: 0.2 + h, left: 0.3, right: 0.7 } }),
				'front'
			);
		expect(at(0.3).states.distance).toBe('fail');
		expect(at(0.3).corrections.distance).toBe('capture.msg.tooFar');
		expect(at(0.32).states.distance).toBe('pass');
		expect(at(0.62).states.distance).toBe('pass');
		expect(at(0.66).corrections.distance).toBe('capture.msg.tooClose');
		// 943 px of 1920 ≈ 1.70 m at 2.5 m: inside the band.
		expect(at(943 / 1920).states.distance).toBe('pass');
	});

	it('front symmetry: turned body fails', () => {
		const L = frontLandmarks();
		L[11] = { ...L[11]!, x: 0.62 }; // left side looks longer
		expect(evaluate(goodFrame('front', { landmarks: L }), 'front').corrections.symmetry).toBe(
			'capture.msg.faceCamera'
		);
	});

	it('side profile: shoulders apart means not turned enough', () => {
		const L = goodFrame('side').landmarks!;
		L[11] = { ...L[11]!, x: 0.6 };
		expect(evaluate(goodFrame('side', { landmarks: L }), 'side').corrections.symmetry).toBe(
			'capture.msg.turnRight'
		);
	});

	it('arms close to the body fail; mask merge fails', () => {
		const L = frontLandmarks();
		L[15] = { ...L[15]!, x: 0.55 };
		expect(evaluate(goodFrame('front', { landmarks: L }), 'front').corrections.arms).toBe(
			'capture.msg.armsAway'
		);
		expect(
			evaluate(goodFrame('front', { armMerge: { left: true, right: false } }), 'front').states.arms
		).toBe('fail');
	});

	it('side arms must hang forward of the hip', () => {
		const L = goodFrame('side').landmarks!;
		L[16] = { ...L[16]!, x: 0.45 };
		L[15] = { ...L[15]!, x: 0.45 };
		expect(evaluate(goodFrame('side', { landmarks: L }), 'side').corrections.arms).toBe(
			'capture.msg.armsForward'
		);
	});

	it('marker: not found, occluded, skewed, too small (iOS asks to step closer)', () => {
		const m = (o: object, still = true) =>
			evaluate(
				goodFrame('front', {
					marker: { found: true, sidePx: 110, ratio: 1.01, occluded: false, ...o },
					stillAvailable: still
				}),
				'front'
			).corrections.marker;
		expect(m({ found: false })).toBe('capture.msg.sheetFlat');
		expect(m({ found: false, occluded: true })).toBe('capture.msg.fingersOff');
		expect(m({ ratio: 1.05 })).toBe('capture.msg.sheetFlat');
		expect(m({ sidePx: 70 }, false)).toBe('capture.msg.stepCloserSheet');
		expect(m({ sidePx: 80 })).toBeUndefined();
	});

	it('light: dark, bright, blurry', () => {
		expect(evaluate(goodFrame('front', { luminance: 40 }), 'front').corrections.light).toBe(
			'capture.msg.tooDark'
		);
		expect(evaluate(goodFrame('front', { luminance: 240 }), 'front').corrections.light).toBe(
			'capture.msg.tooBright'
		);
		expect(evaluate(goodFrame('front', { sharpness: 20 }), 'front').corrections.light).toBe(
			'capture.msg.holdStill'
		);
	});

	it('stability: jitter above 1% of person height fails', () => {
		const shaky = hist().map((f, i) => ({
			...f,
			landmarks: f.landmarks!.map((l) => ({ ...l, x: l.x + (i % 2) * 0.02 }))
		}));
		expect(evaluate(goodFrame(), 'front', shaky).states.stability).toBe('fail');
	});

	it('priority order: level beats everything', () => {
		const r = evaluate(
			goodFrame('front', { orientation: { beta: 70, gamma: 0 }, landmarks: null, luminance: 10 }),
			'front'
		);
		expect(topCorrection(r)?.check).toBe('level');
	});

	it('UI rows fold person into frame', () => {
		const r = evaluate(goodFrame('front', { landmarks: null }), 'front');
		expect(uiRows(r.states).frame).toBe('fail');
		expect(Object.keys(uiRows(r.states))).toHaveLength(7);
	});
});

describe('hysteresis', () => {
	it('a state must hold 300 ms before the UI flips', () => {
		const d = new Debouncer();
		const good = evaluate(goodFrame(), 'front', hist());
		expect(d.update(good, 0).states.level).toBe('pending');
		expect(d.update(good, 299).states.level).toBe('pending');
		expect(d.update(good, 300).states.level).toBe('pass');
		const bad = evaluate(
			goodFrame('front', { orientation: { beta: 70, gamma: 0 } }),
			'front',
			hist()
		);
		expect(d.update(bad, 400).states.level).toBe('pass'); // flicker ignored
		expect(d.update(good, 450).states.level).toBe('pass');
	});

	it('a message stays ≥ 1.5 s unless fixed', () => {
		const d = new Debouncer();
		const dark = evaluate(goodFrame('front', { luminance: 30 }), 'front', hist());
		d.update(dark, 0);
		expect(d.update(dark, 300).message?.key).toBe('capture.msg.tooDark');
		// A higher-priority problem appears: the dark message stays for its minimum time.
		const darkAndFar = evaluate(
			goodFrame('front', {
				luminance: 30,
				maskBox: { top: 0.4, bottom: 0.6, left: 0.3, right: 0.7 }
			}),
			'front',
			hist()
		);
		d.update(darkAndFar, 400);
		expect(d.update(darkAndFar, 800).message?.key).toBe('capture.msg.tooDark');
		expect(d.update(darkAndFar, 1900).message?.key).toBe('capture.msg.tooFar');
	});
});
