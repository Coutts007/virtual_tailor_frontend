import type { ConsentDoc } from './index';

export const en: ConsentDoc = {
	title: 'Virtual Tailor: information and consent',
	reviewed: true,
	summary: [
		'Virtual Tailor uses your phone camera to work out eight body measurements for your tailor.',
		'The photos are used only on this phone and are deleted straight after the measurements are worked out. No photo is sent or saved.',
		'Only the measurement numbers, your client code and your height go to your tailor.'
	],
	sections: [
		{
			heading: 'What happens',
			paragraphs: [
				'You stand about three big steps from your phone. The phone takes a picture from the front and from the side. On this phone, the app finds your outline and the measuring sheet, and works out your measurements.',
				'You will see the measurements before anything is sent. You can retake a photo or delete everything.'
			]
		},
		{
			heading: 'What we keep and who sees it',
			paragraphs: [
				'Your tailor sees your measurements, the date, your client code and your height. Your tailor does not see any photo.',
				'We never ask for your name, phone number, ID number or weight. Your tailor may write a short name for you that only they can see.'
			]
		},
		{
			heading: 'How long we keep it',
			paragraphs: [
				'Your tailor keeps your measurements until you ask for them to be deleted, or until the retention period set by the service ends (24 months after your last order) [CONFIRM].'
			]
		},
		{
			heading: 'Your rights (Data Protection Act, 2019)',
			paragraphs: [
				'Under sections 26 and 32 of the Kenya Data Protection Act, 2019, you have the right to:'
			],
			list: [
				'be told how your data is used',
				'see the data held about you',
				'correct wrong data',
				'have your data deleted',
				'withdraw your consent at any time, without giving a reason',
				'object to the use of your data'
			]
		},
		{
			heading: 'Deleting your data or withdrawing consent',
			paragraphs: [
				'Open "My measurements" in the menu and choose "Delete my data" or "Withdraw consent". The measurements are deleted from this phone at once, and a deletion request is sent to your tailor\'s system.',
				'Saying no or withdrawing does not change how your tailor serves you. You can always be measured with a tape at the workshop.'
			]
		},
		{
			heading: 'Questions and complaints',
			paragraphs: [
				'Data controller: Virtual Tailor project, Mount Kenya University [CONFIRM contact email and phone].',
				'If you are not happy with how your data is handled, you can complain to the Office of the Data Protection Commissioner (ODPC), www.odpc.go.ke [CONFIRM].'
			]
		}
	],
	storedTable: {
		onPhone: [
			'Your client code, height and the answers you gave',
			'Your saved measurements, until you delete them',
			'Photos: only for a few seconds while measuring, then deleted'
		],
		sentToTailor: [
			'Your client code and height',
			'Eight measurements, each with a "Good", "Check" or "Not measured" note',
			'Date, consent version and phone type',
			'Never photos'
		]
	}
};
