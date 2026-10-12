/**
 * Validation study strings (English source). Keys must be unique across all message
 * modules; tests/unit/i18n.test.ts checks parity and duplicates.
 */
export const en = {
	'study.off': 'Study mode is off.',
	'study.ref.locked':
		'This reading is already saved and locked. Ask the administrator to correct it.',
	'study.ref.title': 'Tape readings',
	'study.ref.header': 'Measurer {code}',
	'study.ref.intro':
		"Enter your own tape readings. You will not see the app's values or another measurer's readings.",
	'study.ref.offline':
		'You are offline. Readings are kept on this device and sent when you reconnect.',
	'study.ref.participant': 'Participant code',
	'study.ref.participantHint': 'For example P001',
	'study.ref.participantInvalid': 'Use P and three digits, for example P001.',
	'study.ref.participantUnknown': '{code} is not enrolled. Check the code.',
	'study.ref.readingNo': 'Reading',
	'study.ref.reading': 'Reading {n}',
	'study.ref.sites': 'Measurements in centimetres (0.1 cm)',
	'study.ref.howTo': 'How to measure {site}',
	'study.ref.precision': 'Use at most one decimal, for example 86.5',
	'study.ref.noneEntered': 'Enter at least one measurement.',
	'study.ref.submit': 'Save and lock reading',
	'study.ref.lockedNote': 'Saved readings are locked. Only the administrator can correct them.',
	'study.ref.confirmTitle': 'Please check before saving',
	'study.ref.implausible': 'You entered {value} for {site}. Is that correct?',
	'study.ref.empty':
		'{count, plural, one {# measurement is empty.} other {# measurements are empty.}}',
	'study.ref.goBack': 'Go back',
	'study.ref.confirmSubmit': 'Yes, save',
	'study.ref.saved': 'Saved {participant}, reading {reading}, measurer {measurer}',
	'study.ref.queued': 'Saved on this device. It will send by itself when you are online.',
	'study.ref.outOfOrder': 'Reading 2 was entered before reading 1. This is recorded.',
	'study.ref.next': 'Enter next reading',
	'study.ref.pending':
		'{count, plural, one {# reading waiting to send.} other {# readings waiting to send.}}',
	'study.ref.sendNow': 'Send now',
	'study.ref.flushed': 'Sent {sent} queued readings; {locked} were already locked.',
	'study.instr.stature':
		'Barefoot, heels together against the wall, head level. Lower the headboard to the top of the head; read at eye level.',
	'study.instr.shoulder':
		'Across the back from the tip of one shoulder bone (acromion) to the other, following the curve.',
	'study.instr.chest':
		'Tape level around the fullest part of the chest (bust), under the arms, at normal breathing out.',
	'study.instr.waist':
		'Tape level around the natural waist (narrowest part between ribs and hip bone), not pulled tight.',
	'study.instr.hip': 'Tape level around the widest part of the buttocks, feet together.',
	'study.instr.sleeve': 'From the shoulder tip over the slightly bent elbow to the wrist bone.',
	'study.instr.outleg': 'At the side, from the natural waist straight down to the floor, barefoot.',
	'study.instr.inleg':
		'From the crotch straight down the inside of the leg to the floor, barefoot.',
	'study.instr.neck': "Around the neck just below the Adam's apple, one finger under the tape.",
	'study.vault.title': 'Study image vault',
	'study.vault.disabled': 'Disabled pending ethics approval.',
	'study.vault.disabledHint':
		'Saving study photos needs written approval from the owner and the MKU ethics committee. Until then no photo can be kept.',
	'study.vault.explain':
		'Photos are encrypted on this phone and downloaded as one file for transfer by cable. Nothing is uploaded.',
	'study.vault.consent': 'Paper consent includes keeping photos',
	'study.vault.passphrase': 'Passphrase for this session',
	'study.vault.passphraseHint': 'At least 12 characters. It is never stored.',
	'study.vault.passphraseShort': 'Use at least 12 characters.',
	'study.vault.save': 'Save encrypted photos',
	'study.cap.title': 'Study capture',
	'study.cap.intro':
		'Researcher-run capture for the validation study. The participant does not see this screen.',
	'study.cap.participant': 'Participant code',
	'study.cap.participantUnknown': '{code} is not enrolled. Enrol the participant first.',
	'study.cap.set': 'Set number',
	'study.cap.mode': 'Capture mode',
	'study.cap.modeSelf': 'Self (participant alone)',
	'study.cap.modeAssisted': 'Assisted (researcher presses)',
	'study.cap.modeHint':
		'Sets 1 and 3 are self-capture and set 2 is assisted by default (Section 3.6.2).',
	'study.cap.lighting': 'Lighting',
	'study.cap.light.window': 'Window',
	'study.cap.light.lamp': 'Lamp',
	'study.cap.light.outdoor': 'Outdoor',
	'study.cap.distance': 'Distance wall to phone',
	'study.cap.distanceHint': 'Metres, one decimal, 1.5 to 3.5',
	'study.cap.distanceErr': 'Enter a distance from 1.5 to 3.5 m with at most one decimal.',
	'study.cap.fit': 'Clothing fit (researcher judgement)',
	'study.cap.stature': 'Stature from the tape',
	'study.cap.phone': 'Phone model',
	'study.cap.phoneHint': 'Filled in from the browser where possible; on iPhone pick the model.',
	'study.cap.lux': 'Lux reading',
	'study.cap.luxHint': 'From a phone light-meter app, if you have one.',
	'study.cap.paper': 'Paper consent confirmed for {code}',
	'study.cap.start': 'Start capture',
	'study.cap.nextSet': 'Start set {set} for {code}',
	'study.cap.allSets': 'All three sets are captured for {code}.',
	'study.cap.savedStudy': 'Study set {set} for {code} saved.'
} as const;
