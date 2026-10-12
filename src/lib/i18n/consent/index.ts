/**
 * Consent text (FR-03, Section 9.3), versioned. Separate long-form documents
 * per language; the version string is recorded with every profile.
 * Contacts and DPA details marked [CONFIRM] are pending the owner.
 */
import { en } from './v1.0.en';
import { sw } from './v1.0.sw';
import type { Lang } from '../t.svelte';

export const CONSENT_VERSION = '1.0';

export interface ConsentDoc {
	title: string;
	/** Short opening shown in the consent box. */
	summary: string[];
	sections: { heading: string; paragraphs: string[]; list?: string[] }[];
	/** "On this phone" vs "Sent to your tailor" (9.13). */
	storedTable: { onPhone: string[]; sentToTailor: string[] };
	reviewed: boolean;
}

export const CONSENT: Record<Lang, ConsentDoc> = { en, sw };
