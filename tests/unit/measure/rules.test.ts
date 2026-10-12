import { describe, expect, it } from 'vitest';
import { configHash, DEFAULT_RULES, resolveRules, RULES_VERSION } from '../../../src/lib/measure';

describe('rules config', () => {
	it('is uncalibrated with placeholder factors', () => {
		expect(RULES_VERSION).toBe('0.1-uncalibrated');
		expect(DEFAULT_RULES.cf).toEqual({ chest: 1, waist: 1, hip: 1, neck: 1 });
		expect(DEFAULT_RULES.waist_level).toBe(0.6);
		expect(DEFAULT_RULES.chest_level.female).toBe(0.25);
	});
	it('merges partial nested overrides', () => {
		const r = resolveRules({
			cf: { chest: 1.02 } as never,
			chest_level: { female: 0.27 } as never
		});
		expect(r.cf).toEqual({ chest: 1.02, waist: 1, hip: 1, neck: 1 });
		expect(r.chest_level).toEqual({ female: 0.27, male: 0.25, unspecified: 0.25 });
	});
	it('hash is deterministic, order-independent and changes with any constant', () => {
		expect(configHash()).toMatch(/^cfg-[0-9a-f]{8}$/);
		expect(configHash()).toBe(configHash(DEFAULT_RULES));
		expect(configHash({ waist_level: 0.6 })).toBe(configHash());
		expect(configHash({ waist_level: 0.61 })).not.toBe(configHash());
		expect(configHash({ cf: { chest: 1, waist: 1, hip: 1.01, neck: 1 } })).not.toBe(configHash());
	});
});
