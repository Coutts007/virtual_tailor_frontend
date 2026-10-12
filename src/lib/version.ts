import { version } from '../../package.json';
import { RULES_VERSION } from '$lib/measure';

/** App version shown in Settings (Section 13.12). */
export const APP_VERSION: string = version;

/** Measurement rules version recorded with every profile (Section 11). */
export { RULES_VERSION };
