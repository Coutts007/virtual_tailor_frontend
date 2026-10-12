import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { fastMock, loginEn } from './helpers';
import { finishCapture, useFakeVision } from './clientHelpers';

test.use({ viewport: { width: 360, height: 800 } });
test.skip(({ isMobile }) => !isMobile, 'phone project only');

test('study capture (15.1): covariates, paper consent, study block saved, next-set shortcut', async ({
	page
}) => {
	await fastMock(page);
	await useFakeVision(page, 'perfect', 0.15);
	await loginEn(page, 'admin@vt.test', /\/admin\/accounts/);
	await page.goto('/study/capture?participant=P004');
	await expect(page.getByRole('heading', { level: 1, name: 'Study capture' })).toBeVisible();
	const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
	expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
		[]
	);

	await page.getByRole('button', { name: 'Start capture' }).click();
	await expect(page.getByText('Height must be between 120 and 220 cm')).toBeVisible();
	await page.getByLabel('Stature from the tape').fill('172');
	await page.getByRole('radio', { name: 'Lamp' }).check();
	await page.getByLabel('Lux reading').fill('210');
	await page.getByRole('checkbox', { name: 'Paper consent confirmed for P004' }).check();
	await page.getByRole('button', { name: 'Start capture' }).click();

	await page.waitForURL('**/setup');
	await page.getByRole('button', { name: "I'm ready — start" }).click();
	await page.waitForURL('**/capture/front');
	await finishCapture(page);
	await page.getByRole('button', { name: 'Save and send to tailor' }).click();
	await expect(page.getByText('Study set 1 for P004 saved.')).toBeVisible({ timeout: 15_000 });
	await expect(page.getByRole('link', { name: 'Start set 2 for P004' })).toHaveAttribute(
		'href',
		'/study/capture?participant=P004&set=2'
	);

	// The synced profile carries the study block and the paper consent version (C6).
	await expect(page.getByRole('status').getByText('Saved and sent to your tailor')).toBeVisible({
		timeout: 15_000
	});
	const saved = await page.evaluate(
		() =>
			new Promise<{ study: unknown; consent: string }>((resolve) => {
				const req = indexedDB.open('virtual-tailor');
				req.onsuccess = () => {
					const g = req.result.transaction('profiles').objectStore('profiles').getAll();
					g.onsuccess = () => {
						const p = g.result.at(-1);
						resolve({ study: p.session.study, consent: p.consent.consent_version });
					};
				};
			})
	);
	expect(saved.consent).toBe('study-paper-1.0');
	expect(saved.study).toMatchObject({
		participant_code: 'P004',
		set_no: 1,
		lighting: 'lamp',
		distance_m: 2.3,
		clothing_fit_observed: 'fitted',
		lux: 210
	});
});

test('study capture is admin-only: a measurer gets 403', async ({ page }) => {
	await fastMock(page);
	await loginEn(page, 'measurer-a@vt.test', /\/study\/reference/);
	await page.goto('/study/capture');
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Not allowed|403/);
});
