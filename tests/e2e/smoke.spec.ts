import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { open } from './helpers';

test.describe('Phase 0 smoke', () => {
	test('welcome renders in English with one h1', async ({ page }) => {
		await open(page, '/');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Virtual Tailor');
		await expect(page.locator('h1')).toHaveCount(1);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	});

	test('language toggle switches instantly and persists', async ({ page }) => {
		await open(page, '/');
		await page
			.getByRole('group', { name: 'Language' })
			.getByRole('button', { name: 'Kiswahili' })
			.click();
		await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
		await expect(
			page.getByText('Pata vipimo vyako vya ushonaji kwa simu yako.', { exact: false })
		).toBeVisible();
		await page.reload();
		await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
	});

	test('unknown route shows the 404 screen with a way home', async ({ page }) => {
		await open(page, '/no-such-page');
		await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Go to the start' })).toBeVisible();
	});

	test('MSW mock backend answers /api/v1/settings/public', async ({ page }) => {
		await open(page, '/');
		const body = await page.evaluate(async () => (await fetch('/api/v1/settings/public')).json());
		expect(body).toMatchObject({ consent_version: '1.0', study_mode: true });
	});

	test('offline banner appears when the network drops', async ({ page, context }) => {
		await open(page, '/');
		await context.setOffline(true);
		await expect(page.getByText('You are offline.', { exact: false })).toBeVisible();
		await context.setOffline(false);
	});

	test('no serious or critical axe violations on welcome (EN and SW)', async ({ page }) => {
		await open(page, '/');
		for (const lang of ['English', 'Kiswahili']) {
			await page
				.getByRole('group', { name: /Language|Lugha/ })
				.getByRole('button', { name: lang })
				.click();
			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
				.analyze();
			const bad = results.violations.filter(
				(v) => v.impact === 'serious' || v.impact === 'critical'
			);
			expect(bad, JSON.stringify(bad.map((v) => v.id))).toEqual([]);
		}
	});
});
