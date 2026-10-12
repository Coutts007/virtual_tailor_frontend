import { version } from '../../package.json';

/** App version shown in Settings (Section 13.12). */
export const APP_VERSION: string = version;

/**
 * Shown until the measurement module is wired in; the parent repoints this to
 * RULES_VERSION from $lib/measure after Phase 4 merges.
 */
export const RULES_VERSION_FALLBACK = '0.1-uncalibrated';
