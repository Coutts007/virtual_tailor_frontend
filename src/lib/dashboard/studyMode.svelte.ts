import { invalidatePublicSettings, publicSettings } from './publicSettings';

/** Study mode switch for navigation (admin Study section, Section 14). */
export const studyMode = $state({ on: false, consentVersion: '' });

export async function refreshStudyMode(force = false): Promise<void> {
	if (force) invalidatePublicSettings();
	try {
		const s = await publicSettings(force);
		studyMode.on = s.study_mode;
		studyMode.consentVersion = s.consent_version;
	} catch {
		/* keep last value offline */
	}
}
