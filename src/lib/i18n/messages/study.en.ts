/**
 * Validation study strings (English source). Keys must be unique across all message
 * modules; tests/unit/i18n.test.ts checks parity and duplicates.
 */
export const en = {
	'study.off': 'Study mode is off.',
	'study.ref.locked':
		'This reading is already saved and locked. Ask the administrator to correct it.'
} as const;
