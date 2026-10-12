import { expect, type Page } from '@playwright/test';
import { open } from './helpers';

export interface FlowOpts {
	code?: string;
	lang?: 'en' | 'sw';
	scenario?: string;
	timeScale?: number;
	sex?: 'Female' | 'Male' | 'Mwanamke' | 'Mwanamume';
	mode?: 'self' | 'assisted';
}

export const T = {
	en: {
		cont: 'Continue',
		camera: 'Open camera',
		yes: 'Yes, it is right',
		start: "I'm ready — start",
		save: 'Save and send to tailor'
	},
	sw: {
		cont: 'Endelea',
		camera: 'Fungua kamera',
		yes: 'Ndiyo, iko sawa',
		start: 'Niko tayari — anza',
		save: 'Hifadhi na utume kwa fundi'
	}
};

export async function useFakeVision(
	page: Page,
	scenario = 'perfect',
	timeScale = 0.15,
	lang: 'en' | 'sw' = 'en'
) {
	await page.addInitScript(
		([s, ts, l]) => {
			localStorage.setItem(
				'vt.vision',
				JSON.stringify({ mode: 'fake', scenario: s, timeScale: ts })
			);
			localStorage.setItem('vt.lang', l as string);
		},
		[scenario, timeScale, lang] as const
	);
}

/** Welcome → details → consent → check → sheet → setup → front → side → review. */
export async function runToReview(page: Page, o: FlowOpts = {}) {
	const lang = o.lang ?? 'en';
	const L = T[lang];
	const code = o.code ?? 'QT1200';
	await useFakeVision(page, o.scenario ?? 'perfect', o.timeScale ?? 0.15, lang);
	await open(page, `/start?code=${code}`);
	await page.getByRole('radio', { name: o.sex ?? (lang === 'en' ? 'Female' : 'Mwanamke') }).check();
	await page
		.getByRole('spinbutton')
		.or(page.locator('input[inputmode=decimal]'))
		.first()
		.fill('168');
	await page.getByRole('button', { name: L.cont, exact: true }).click();
	await page.waitForURL('**/consent');
	for (const cb of await page.getByRole('checkbox').all()) await cb.check();
	await page.getByRole('button', { name: L.camera }).click();
	await page.waitForURL(/\/(check|sheet|setup)$/);
	if (page.url().endsWith('/check')) {
		await page.getByRole('button', { name: L.cont, exact: true }).click();
		await page.waitForURL(/\/(sheet|setup)$/);
	}
	if (page.url().endsWith('/sheet')) {
		await page.getByRole('button', { name: L.yes }).click();
		await page.getByRole('button', { name: L.cont, exact: true }).click();
		await page.waitForURL('**/setup');
	}
	if (o.mode === 'assisted')
		await page
			.getByRole('radio', {
				name: lang === 'en' ? 'Someone is helping me' : 'Kuna mtu ananisaidia'
			})
			.check();
	const start = page.getByRole('button', { name: L.start });
	await expect(start).toBeEnabled({ timeout: 5000 });
	await start.click();
	await page.waitForURL('**/capture/front');
}

export async function finishCapture(page: Page) {
	await page.waitForURL('**/capture/side', { timeout: 45_000 });
	await page.waitForURL('**/review', { timeout: 45_000 });
}
