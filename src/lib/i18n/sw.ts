import type { MessageKey } from './en';

/**
 * Kiswahili first draft (decision 10). Every entry is `reviewed: false` in
 * docs/i18n-review.md until a native speaker approves it.
 */
export const sw: Record<MessageKey, string> = {
	'app.name': 'Virtual Tailor',
	'app.shortName': 'VT',
	'app.tagline': 'Pata vipimo vyako vya ushonaji kwa simu yako.',
	'app.privacyLine':
		'Picha zinabaki kwenye simu hii. Vipimo vyako tu ndivyo vinavyokwenda kwa fundi wako.',

	'lang.label': 'Lugha',
	'lang.en': 'English',
	'lang.sw': 'Kiswahili',
	'lang.enShort': 'EN',
	'lang.swShort': 'SW',

	'common.back': 'Rudi',
	'common.continue': 'Endelea',
	'common.cancel': 'Ghairi',
	'common.close': 'Funga',
	'common.save': 'Hifadhi',
	'common.retry': 'Jaribu tena',
	'common.loading': 'Inapakia…',
	'common.menu': 'Menyu',
	'common.skipToContent': 'Ruka hadi maudhui',
	'common.goHome': 'Nenda mwanzo',
	'common.yes': 'Ndiyo',
	'common.no': 'Hapana',
	'common.days': '{count, plural, one {siku #} other {siku #}}',

	'banner.offline': 'Huna mtandao. Bado unaweza kupima; tutatuma ukirudi mtandaoni.',
	'banner.unreviewedSw': 'Toleo la majaribio: maandishi ya Kiswahili bado hayajakaguliwa.',
	'toast.updateReady': 'Toleo jipya liko tayari',
	'toast.refresh': 'Onyesha upya',

	'error.notFound.title': 'Ukurasa haupatikani',
	'error.notFound.body': 'Hatukuweza kupata ukurasa huu.',
	'error.forbidden.title': 'Hairuhusiwi',
	'error.forbidden.body': 'Akaunti yako haiwezi kufungua ukurasa huu.',
	'error.generic.title': 'Kuna tatizo',
	'error.generic.body': 'Tafadhali jaribu tena. Likiendelea, wasiliana na fundi wako.',

	'welcome.title': 'Karibu',
	'welcome.chooseLanguage': 'Chagua lugha yako',
	'welcome.phase0Note': 'Virtual Tailor inajengwa. Hatua za kupima zitakuja baadaye.'
};
