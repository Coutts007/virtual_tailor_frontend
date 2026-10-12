import { describe, expect, it } from 'vitest';
import { buildShareText } from '../../src/lib/domain/shareText';

const base = {
	client_code: 'AB1234',
	display_name: 'Amina',
	profile_version: 2,
	captured_at: '2027-05-12T07:42:00Z',
	garment_label: 'Shirt',
	due_date: '2027-05-26',
	lines: [
		{ label: 'Chest', site_code: 'chest' as const, value_mm: 985, flag: 'pass' as const },
		{ label: 'Waist', site_code: 'waist' as const, value_mm: 860, flag: 'check' as const },
		{ label: 'Inside leg', site_code: 'inleg' as const, value_mm: null, flag: 'fail' as const }
	]
};

describe('share text (Section 13.9)', () => {
	it('matches the template exactly, name off by default', () => {
		expect(buildShareText({ ...base, include_name: false })).toBe(
			[
				'Virtual Tailor · Client AB1234 · Profile v2 (12 May 2027) · Shirt · Due 26 May 2027',
				'Chest 98.5 cm ✓',
				'Waist 86.0 cm ▲ check',
				'Inside leg — not measured',
				'No photo is stored.'
			].join('\n')
		);
	});
	it('includes the name only when asked', () => {
		expect(buildShareText({ ...base, include_name: true }).split('\n')[0]).toContain(
			'Client AB1234 · Amina ·'
		);
	});
	it('never contains a link', () => {
		expect(buildShareText({ ...base, include_name: true })).not.toMatch(/https?:/);
	});
});
