import type { PublicSettings } from '../src/lib/api/types';

/**
 * Deterministic seed data (Section 20.4). Phase 1 fills users, clients,
 * profiles, orders, audit and study data.
 */
export const CONSENT_VERSION = '1.0';

export function createSeed() {
	const settings: PublicSettings & { retention_months: number } = {
		study_mode: true,
		consent_version: CONSENT_VERSION,
		min_app_version: '0.0.1',
		retention_months: 24
	};
	return { settings };
}

export type Seed = ReturnType<typeof createSeed>;
