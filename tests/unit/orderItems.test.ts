import { describe, expect, it } from 'vitest';
import type { Measurement } from '../../src/lib/api/types';
import {
	easeError,
	finishedMm,
	isResolved,
	rowsFromProfile,
	toItemInputs,
	unresolved
} from '../../src/lib/dashboard/items';
import { isOverdue } from '../../src/lib/dashboard/format';

const m = (
	site: Measurement['site_code'],
	value: number | null,
	flag: Measurement['confidence_flag'] = 'pass'
): Measurement => ({
	site_code: site,
	value_mm: value,
	method: 'auto',
	confidence_flag: flag,
	flag_reasons: flag === 'pass' ? [] : flag === 'fail' ? ['crotch_not_found'] : ['scale_disagree']
});
const ms = [m('waist', 860, 'check'), m('hip', 1012), m('inleg', null, 'fail')];

describe('order rows (Section 13.6)', () => {
	it('flagged rows block saving until confirmed or overridden', () => {
		const rows = rowsFromProfile(['waist', 'hip', 'inleg'], ms);
		expect(unresolved(rows).map((r) => r.site_code)).toEqual(['waist', 'inleg']);
		rows[0]!.flag_confirmed = true;
		expect(isResolved(rows[0]!)).toBe(true);
	});

	it('a failed row cannot simply be confirmed: override or measure at fitting', () => {
		const [, , inleg] = rowsFromProfile(['waist', 'hip', 'inleg'], ms);
		inleg!.flag_confirmed = true;
		expect(isResolved(inleg!)).toBe(false);
		inleg!.pending_fitting = true;
		expect(isResolved(inleg!)).toBe(true);
		const [, , again] = rowsFromProfile(['waist', 'hip', 'inleg'], ms);
		again!.overridden = true;
		again!.body_mm = 780;
		expect(isResolved(again!)).toBe(true);
	});

	it('finished = body + ease in mm, ease entered in the tailor unit', () => {
		const [w] = rowsFromProfile(['waist'], ms);
		w!.ease = 8;
		expect(finishedMm(w!, 'cm')).toBe(940);
		w!.ease = 1;
		expect(finishedMm(w!, 'in')).toBe(885);
	});

	it('ease range 0–30 cm with one decimal', () => {
		const [w] = rowsFromProfile(['waist'], ms);
		for (const [v, bad] of [
			[30, false],
			[30.1, true],
			[-1, true],
			[2.5, false],
			[2.55, true]
		] as const) {
			w!.ease = v;
			expect(easeError(w!, 'cm'), String(v)).toBe(bad);
		}
		w!.ease = 11.75;
		expect(easeError(w!, 'in')).toBe(false);
		w!.ease = 12;
		expect(easeError(w!, 'in')).toBe(true);
	});

	it('payload: confirmed flag, override reason, pending fitting with null body', () => {
		const rows = rowsFromProfile(['waist', 'hip', 'inleg'], ms);
		rows[0]!.flag_confirmed = true;
		rows[1]!.overridden = true;
		rows[1]!.body_mm = 1020;
		rows[1]!.override_reason = 'Tape';
		rows[2]!.pending_fitting = true;
		expect(toItemInputs(rows, 'cm')).toEqual([
			{
				site_code: 'waist',
				body_mm: 860,
				ease_mm: 0,
				overridden: false,
				override_reason: undefined,
				flag_confirmed: true,
				pending_fitting: undefined
			},
			{
				site_code: 'hip',
				body_mm: 1020,
				ease_mm: 0,
				overridden: true,
				override_reason: 'Tape',
				flag_confirmed: undefined,
				pending_fitting: undefined
			},
			{
				site_code: 'inleg',
				body_mm: null,
				ease_mm: 0,
				overridden: false,
				override_reason: undefined,
				flag_confirmed: undefined,
				pending_fitting: true
			}
		]);
	});

	it('presets fill ease in the display unit', () => {
		const [w] = rowsFromProfile(['waist'], ms, { waist: 80 }, 'cm');
		expect(w!.ease).toBe(8);
	});
});

describe('overdue', () => {
	it('past due and not collected', () => {
		expect(isOverdue('2027-05-01', 'fitting', '2027-05-02')).toBe(true);
		expect(isOverdue('2027-05-01', 'collected', '2027-05-02')).toBe(false);
		expect(isOverdue('2027-05-02', 'new', '2027-05-02')).toBe(false);
	});
});
