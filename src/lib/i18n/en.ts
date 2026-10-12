/**
 * English source strings. Every user-visible string goes through t() (Section 16).
 * Keys are flat and dotted by screen. Placeholders use {name}; plurals use the
 * ICU form {count, plural, one {# thing} other {# things}}.
 */
export const en = {
	'app.name': 'Virtual Tailor',
	'app.shortName': 'VT',
	'app.tagline': 'Get your tailoring measurements with your phone.',
	'app.privacyLine': 'Photos stay on this phone. Only your measurements go to your tailor.',

	'lang.label': 'Language',
	'lang.en': 'English',
	'lang.sw': 'Kiswahili',
	'lang.enShort': 'EN',
	'lang.swShort': 'SW',

	'common.back': 'Back',
	'common.continue': 'Continue',
	'common.cancel': 'Cancel',
	'common.close': 'Close',
	'common.save': 'Save',
	'common.retry': 'Try again',
	'common.loading': 'Loading…',
	'common.menu': 'Menu',
	'common.skipToContent': 'Skip to main content',
	'common.goHome': 'Go to the start',
	'common.yes': 'Yes',
	'common.no': 'No',
	'common.days': '{count, plural, one {# day} other {# days}}',

	'banner.offline':
		'You are offline. You can still measure; we will send when you are back online.',
	'banner.unreviewedSw': 'Development build: Kiswahili text has not been reviewed yet.',
	'toast.updateReady': 'A new version is ready',
	'toast.refresh': 'Refresh',

	'error.notFound.title': 'Page not found',
	'error.notFound.body': 'We could not find this page.',
	'error.forbidden.title': 'Not allowed',
	'error.forbidden.body': 'Your account cannot open this page.',
	'error.generic.title': 'Something went wrong',
	'error.generic.body': 'Please try again. If it keeps happening, contact your tailor.',

	'welcome.title': 'Welcome',
	'welcome.chooseLanguage': 'Choose your language',
	'welcome.phase0Note':
		'Virtual Tailor is being built. The measuring flow arrives in a later phase.'
} as const;

export type MessageKey = keyof typeof en;
