/**
 * The illustrated protocol card (Appendix B) shown on /help, per language.
 * Each step has an illustration key drawn by ProtocolArt.svelte.
 */
import type { Lang } from '../t.svelte';

export type ArtKey = 'clothes' | 'sheet' | 'chair' | 'distance' | 'front' | 'side' | 'red';
export interface ProtocolSection {
	heading: string;
	art: ArtKey;
	steps: string[];
}

export const PROTOCOL: Record<
	Lang,
	{ title: string; sections: ProtocolSection[]; reviewed: boolean }
> = {
	en: {
		title: 'How to measure',
		reviewed: true,
		sections: [
			{
				heading: 'Before you start',
				art: 'clothes',
				steps: [
					'Wear fitted clothes: a T-shirt and leggings or fitted trousers.',
					'Take off your shoes. Tie back long hair.',
					'Find a plain wall with space in front of it: about three big steps.',
					'Have your measuring sheet ready. Keep it flat.'
				]
			},
			{
				heading: 'Set up the phone',
				art: 'chair',
				steps: [
					'Stand the phone upright on a chair seat, leaning on the backrest.',
					'The back camera faces the wall. The phone is about as high as your belly button.',
					'Lean the phone until the bubble is in the middle and the tick turns green.'
				]
			},
			{
				heading: 'Front view',
				art: 'front',
				steps: [
					'Stand against the wall, facing the phone, about three big steps away.',
					'Hold the sheet flat on your chest, black square facing the phone.',
					'Keep your arms a little away from your body. Feet a little apart.',
					'When the screen turns green, hold still for the countdown.'
				]
			},
			{
				heading: 'Side view',
				art: 'side',
				steps: [
					'Turn to your right so your right shoulder faces the phone.',
					'Hold the sheet flat on your right hip.',
					'Let your arms hang a little forward.',
					'Hold still for the countdown.'
				]
			},
			{
				heading: 'If a check stays red',
				art: 'red',
				steps: [
					'Do what the big words say, one thing at a time.',
					'Too dark: turn on a light or face a window. Too bright: move away from the window behind you.',
					'Sheet not found: hold it flat and keep your fingers off the black square.',
					'Still stuck? Ask someone to help, or ask your tailor to measure you with a tape.'
				]
			}
		]
	},
	sw: {
		title: 'Jinsi ya kupima',
		reviewed: false,
		sections: [
			{
				heading: 'Kabla ya kuanza',
				art: 'clothes',
				steps: [
					'Vaa nguo zinazobana: fulana na leggings au suruali inayobana.',
					'Vua viatu. Funga nywele ndefu nyuma.',
					'Tafuta ukuta mtupu wenye nafasi mbele yake: hatua tatu kubwa hivi.',
					'Kuwa na karatasi yako ya kupimia tayari. Iweke sawasawa bila kukunja.'
				]
			},
			{
				heading: 'Weka simu',
				art: 'chair',
				steps: [
					'Simamisha simu wima juu ya kiti, ikiegemea mgongo wa kiti.',
					'Kamera ya nyuma inatazama ukuta. Simu iko juu kiasi cha kitovu chako.',
					'Inamisha simu hadi kiputo kiwe katikati na alama ya tiki iwe kijani.'
				]
			},
			{
				heading: 'Picha ya mbele',
				art: 'front',
				steps: [
					'Simama karibu na ukuta, ukitazama simu, hatua tatu kubwa hivi.',
					'Shika karatasi sawasawa kifuani, mraba mweusi ukitazama simu.',
					'Weka mikono mbali kidogo na mwili. Achanisha miguu kidogo.',
					'Skrini ikiwa kijani, tulia wakati wa kuhesabu.'
				]
			},
			{
				heading: 'Picha ya upande',
				art: 'side',
				steps: [
					'Geuka kulia ili bega lako la kulia litazame simu.',
					'Shika karatasi sawasawa kwenye nyonga ya kulia.',
					"Acha mikono ining'inie mbele kidogo.",
					'Tulia wakati wa kuhesabu.'
				]
			},
			{
				heading: 'Ukaguzi ukibaki mwekundu',
				art: 'red',
				steps: [
					'Fanya maneno makubwa yanavyosema, jambo moja kwa wakati.',
					'Giza mno: washa taa au tazama dirisha. Mwanga mwingi: ondoka mbele ya dirisha lililo nyuma yako.',
					'Karatasi haionekani: ishike sawasawa na usiguse mraba mweusi.',
					'Bado umekwama? Omba mtu akusaidie, au mwombe fundi wako akupime kwa utepe.'
				]
			}
		]
	}
};
