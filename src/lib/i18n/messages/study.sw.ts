import type { en } from './study.en';

/** Validation study strings, Kiswahili draft (decision 10: reviewed = false until approved). */
export const sw: Record<keyof typeof en, string> = {
	'study.off': 'Hali ya utafiti imezimwa.',
	'study.ref.locked': 'Usomaji huu tayari umehifadhiwa na kufungwa. Muombe msimamizi aurekebishe.',
	'study.ref.title': 'Usomaji wa tepu',
	'study.ref.header': 'Mpimaji {code}',
	'study.ref.intro':
		'Weka usomaji wako wa tepu. Hutaona vipimo vya programu wala usomaji wa mpimaji mwingine.',
	'study.ref.offline':
		'Huna mtandao. Usomaji unahifadhiwa kwenye kifaa hiki na kutumwa ukiunganisha tena.',
	'study.ref.participant': 'Nambari ya mshiriki',
	'study.ref.participantHint': 'Kwa mfano P001',
	'study.ref.participantInvalid': 'Tumia P na tarakimu tatu, kwa mfano P001.',
	'study.ref.participantUnknown': '{code} hajasajiliwa. Kagua nambari.',
	'study.ref.readingNo': 'Usomaji',
	'study.ref.reading': 'Usomaji {n}',
	'study.ref.sites': 'Vipimo kwa sentimita (sm 0.1)',
	'study.ref.howTo': 'Jinsi ya kupima {site}',
	'study.ref.precision': 'Tumia desimali moja tu, kwa mfano 86.5',
	'study.ref.noneEntered': 'Weka angalau kipimo kimoja.',
	'study.ref.submit': 'Hifadhi na funga usomaji',
	'study.ref.lockedNote':
		'Usomaji uliohifadhiwa unafungwa. Ni msimamizi tu anayeweza kuurekebisha.',
	'study.ref.confirmTitle': 'Tafadhali kagua kabla ya kuhifadhi',
	'study.ref.implausible': 'Uliweka {value} kwa {site}. Je, ni sahihi?',
	'study.ref.empty': '{count, plural, one {Kipimo # kiko wazi.} other {Vipimo # viko wazi.}}',
	'study.ref.goBack': 'Rudi',
	'study.ref.confirmSubmit': 'Ndiyo, hifadhi',
	'study.ref.saved': 'Imehifadhiwa {participant}, usomaji {reading}, mpimaji {measurer}',
	'study.ref.queued': 'Imehifadhiwa kwenye kifaa hiki. Itatumwa yenyewe ukiwa mtandaoni.',
	'study.ref.outOfOrder': 'Usomaji 2 uliwekwa kabla ya usomaji 1. Hili linarekodiwa.',
	'study.ref.next': 'Weka usomaji unaofuata',
	'study.ref.pending':
		'{count, plural, one {Usomaji # unasubiri kutumwa.} other {Usomaji # unasubiri kutumwa.}}',
	'study.ref.sendNow': 'Tuma sasa',
	'study.ref.flushed': 'Usomaji {sent} uliosubiri umetumwa; {locked} ulikuwa tayari umefungwa.',
	'study.instr.stature':
		'Bila viatu, visigino pamoja ukutani, kichwa sawa. Shusha kibao hadi juu ya kichwa; soma ukiwa usawa wa macho.',
	'study.instr.shoulder':
		'Mgongoni kutoka ncha ya mfupa wa bega mmoja (akromioni) hadi mwingine, ukifuata mkunjo.',
	'study.instr.chest':
		'Tepu sawa kuzunguka sehemu kubwa zaidi ya kifua, chini ya mikono, baada ya kupumua kawaida.',
	'study.instr.waist':
		'Tepu sawa kuzunguka kiuno cha asili (sehemu nyembamba kati ya mbavu na mfupa wa nyonga), isibane.',
	'study.instr.hip': 'Tepu sawa kuzunguka sehemu pana zaidi ya makalio, miguu pamoja.',
	'study.instr.sleeve':
		'Kutoka ncha ya bega kupitia kiwiko kilichopinda kidogo hadi mfupa wa kifundo.',
	'study.instr.outleg': 'Pembeni, kutoka kiuno cha asili moja kwa moja hadi sakafuni, bila viatu.',
	'study.instr.inleg':
		'Kutoka kwenye msamba moja kwa moja ndani ya mguu hadi sakafuni, bila viatu.',
	'study.instr.neck': 'Kuzunguka shingo chini kidogo ya kongomeo, kidole kimoja chini ya tepu.',
	'study.vault.title': 'Hifadhi ya picha za utafiti',
	'study.vault.disabled': 'Imezimwa hadi idhini ya maadili ipatikane.',
	'study.vault.disabledHint':
		'Kuhifadhi picha za utafiti kunahitaji idhini ya maandishi ya mmiliki na kamati ya maadili ya MKU. Hadi hapo hakuna picha inayoweza kuhifadhiwa.',
	'study.vault.explain':
		'Picha zinasimbwa kwenye simu hii na kupakuliwa kama faili moja kwa kuhamishwa kwa kebo. Hakuna kinachopakiwa mtandaoni.',
	'study.vault.consent': 'Idhini ya karatasi inajumuisha kuhifadhi picha',
	'study.vault.passphrase': 'Kaulisiri ya kipindi hiki',
	'study.vault.passphraseHint': 'Angalau herufi 12. Haihifadhiwi kamwe.',
	'study.vault.passphraseShort': 'Tumia angalau herufi 12.',
	'study.vault.save': 'Hifadhi picha zilizosimbwa',
	'study.cap.title': 'Upigaji picha wa utafiti',
	'study.cap.intro':
		'Upigaji picha unaoendeshwa na mtafiti kwa utafiti wa uthibitishaji. Mshiriki haoni skrini hii.',
	'study.cap.participant': 'Nambari ya mshiriki',
	'study.cap.participantUnknown': '{code} hajasajiliwa. Msajili mshiriki kwanza.',
	'study.cap.set': 'Nambari ya seti',
	'study.cap.mode': 'Hali ya upigaji',
	'study.cap.modeSelf': 'Peke yake (mshiriki pekee)',
	'study.cap.modeAssisted': 'Kwa msaada (mtafiti anabonyeza)',
	'study.cap.modeHint':
		'Seti 1 na 3 ni za kujipiga na seti 2 ni ya msaada kwa kawaida (Sehemu 3.6.2).',
	'study.cap.lighting': 'Mwanga',
	'study.cap.light.window': 'Dirisha',
	'study.cap.light.lamp': 'Taa',
	'study.cap.light.outdoor': 'Nje',
	'study.cap.distance': 'Umbali kutoka ukuta hadi simu',
	'study.cap.distanceHint': 'Mita, desimali moja, 1.5 hadi 3.5',
	'study.cap.distanceErr': 'Weka umbali kuanzia mita 1.5 hadi 3.5 wenye desimali moja tu.',
	'study.cap.fit': 'Ubana wa nguo (maoni ya mtafiti)',
	'study.cap.stature': 'Urefu kutoka kwa utepe',
	'study.cap.phone': 'Aina ya simu',
	'study.cap.phoneHint': 'Imejazwa kutoka kivinjari inapowezekana; kwa iPhone chagua aina.',
	'study.cap.lux': 'Kipimo cha lux',
	'study.cap.luxHint': 'Kutoka programu ya kupima mwanga, kama unayo.',
	'study.cap.paper': 'Idhini ya karatasi imethibitishwa kwa {code}',
	'study.cap.start': 'Anza upigaji',
	'study.cap.nextSet': 'Anza seti {set} kwa {code}',
	'study.cap.allSets': 'Seti zote tatu zimepigwa kwa {code}.',
	'study.cap.savedStudy': 'Seti ya utafiti {set} kwa {code} imehifadhiwa.'
};
