import type { ConsentDoc } from './index';

/** Kiswahili draft — reviewed: false until a native speaker approves (decision 10). */
export const sw: ConsentDoc = {
	title: 'Virtual Tailor: maelezo na idhini',
	reviewed: false,
	summary: [
		'Virtual Tailor inatumia kamera ya simu yako kupata vipimo vinane vya mwili kwa ajili ya fundi wako.',
		'Picha zinatumika kwenye simu hii tu na zinafutwa mara baada ya vipimo kupatikana. Hakuna picha inayotumwa wala kuhifadhiwa.',
		'Ni nambari za vipimo, nambari yako ya mteja na urefu wako tu ndivyo vinavyokwenda kwa fundi wako.'
	],
	sections: [
		{
			heading: 'Kinachotokea',
			paragraphs: [
				'Unasimama hatua tatu kubwa kutoka kwa simu yako. Simu inapiga picha ya mbele na ya upande. Kwenye simu hii, programu inapata umbo lako na karatasi ya kupimia, na kukokotoa vipimo vyako.',
				'Utaona vipimo kabla kitu chochote hakijatumwa. Unaweza kupiga picha tena au kufuta kila kitu.'
			]
		},
		{
			heading: 'Tunachohifadhi na anayekiona',
			paragraphs: [
				'Fundi wako anaona vipimo vyako, tarehe, nambari yako ya mteja na urefu wako. Fundi wako haoni picha yoyote.',
				'Hatuulizi jina lako, nambari ya simu, nambari ya kitambulisho wala uzito. Fundi wako anaweza kuandika jina fupi ambalo ni yeye tu analoliona.'
			]
		},
		{
			heading: 'Tunavihifadhi kwa muda gani',
			paragraphs: [
				'Fundi wako anahifadhi vipimo vyako hadi utakapoomba vifutwe, au hadi muda wa kuhifadhi uliowekwa na huduma utakapoisha (miezi 24 baada ya oda yako ya mwisho) [CONFIRM].'
			]
		},
		{
			heading: 'Haki zako (Sheria ya Ulinzi wa Data, 2019)',
			paragraphs: [
				'Chini ya vifungu 26 na 32 vya Sheria ya Ulinzi wa Data ya Kenya, 2019, una haki ya:'
			],
			list: [
				'kuambiwa jinsi data yako inavyotumika',
				'kuona data iliyohifadhiwa kukuhusu',
				'kusahihisha data isiyo sahihi',
				'kufutiwa data yako',
				'kuondoa idhini yako wakati wowote, bila kutoa sababu',
				'kupinga matumizi ya data yako'
			]
		},
		{
			heading: 'Kufuta data yako au kuondoa idhini',
			paragraphs: [
				'Fungua "Vipimo vyangu" kwenye menyu kisha uchague "Futa data yangu" au "Ondoa idhini". Vipimo vinafutwa kwenye simu hii mara moja, na ombi la kufuta linatumwa kwa mfumo wa fundi wako.',
				'Kukataa au kuondoa idhini hakubadilishi jinsi fundi wako anavyokuhudumia. Unaweza kupimwa kwa utepe kwenye karakana wakati wowote.'
			]
		},
		{
			heading: 'Maswali na malalamiko',
			paragraphs: [
				'Msimamizi wa data: mradi wa Virtual Tailor, Chuo Kikuu cha Mount Kenya [CONFIRM barua pepe na simu].',
				'Kama huridhiki na jinsi data yako inavyoshughulikiwa, unaweza kulalamika kwa Ofisi ya Kamishna wa Ulinzi wa Data (ODPC), www.odpc.go.ke [CONFIRM].'
			]
		}
	],
	storedTable: {
		onPhone: [
			'Nambari yako ya mteja, urefu na majibu uliyotoa',
			'Vipimo ulivyohifadhi, hadi uvifute',
			'Picha: kwa sekunde chache tu wakati wa kupima, kisha zinafutwa'
		],
		sentToTailor: [
			'Nambari yako ya mteja na urefu',
			'Vipimo vinane, kila kimoja na maelezo "Sawa", "Kagua" au "Haijapimwa"',
			'Tarehe, toleo la idhini na aina ya simu',
			'Kamwe si picha'
		]
	}
};
