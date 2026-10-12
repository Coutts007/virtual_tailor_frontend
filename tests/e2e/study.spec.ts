import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { fastMock, loginEn } from './helpers';

test.beforeEach(async ({ page }) => fastMock(page));

test.describe('Phase 6: study tape entry (Section 15.2, FR-23)', () => {
	test('measurer enters a reading blind to system values; it locks', async ({ page }) => {
		const requests: string[] = [];
		page.on('request', (r) => requests.push(new URL(r.url()).pathname));
		await loginEn(page, 'measurer-a@vt.test', /\/study\/reference$/);
		await expect(page.getByText('Measurer A')).toBeVisible();
		// Nothing on screen looks like a measurement before the measurer types.
		expect(await page.locator('main').innerText()).not.toMatch(/\d{2,3}\.\d\s?cm/);

		await page.getByLabel('Participant code').fill('p003');
		await expect(page.getByLabel('Participant code')).toHaveValue('P003');
		await page.getByLabel('1. Height').fill('163.4');
		await page.getByLabel('4. Waist').fill('12.0');
		await page.getByRole('button', { name: 'How to measure Waist' }).click();
		await expect(page.getByText('natural waist', { exact: false })).toBeVisible();
		await page.getByRole('button', { name: 'Save and lock reading' }).click();
		const dlg = page.getByRole('dialog', { name: 'Please check before saving' });
		await expect(dlg.getByText('You entered 12.0 cm for waist. Is that correct?')).toBeVisible();
		await expect(dlg.getByText('7 measurements are empty.')).toBeVisible();
		await dlg.getByRole('button', { name: 'Go back' }).click();
		await page.getByLabel('4. Waist').fill('81.2');
		await page.getByRole('button', { name: 'Save and lock reading' }).click();
		await page.getByRole('dialog').getByRole('button', { name: 'Yes, save' }).click();
		await expect(
			page.getByRole('heading', { name: 'Saved P003, reading 1, measurer A' })
		).toBeVisible();

		// Same reading again is locked.
		await page.getByRole('button', { name: 'Enter next reading' }).click();
		await page.getByRole('radio', { name: 'Reading 1' }).check();
		await page.getByLabel('Participant code').fill('P003');
		await page.getByLabel('4. Waist').fill('81.3');
		await page.getByRole('button', { name: 'Save and lock reading' }).click();
		await page.getByRole('dialog').getByRole('button', { name: 'Yes, save' }).click();
		await expect(
			page.getByText('This reading is already saved and locked.', { exact: false })
		).toBeVisible();

		// The screen never asked the server for system values.
		expect(
			requests.filter((p) => /\/api\/v1\/(profiles|clients|orders|study\/export)/.test(p))
		).toEqual([]);
	});

	test('reading 2 before reading 1 is accepted and flagged', async ({ page }) => {
		await loginEn(page, 'measurer-b@vt.test', /\/study\/reference$/);
		await page.getByLabel('Participant code').fill('P004');
		await page.getByRole('radio', { name: 'Reading 2' }).check();
		for (const [label, v] of <[string, string][]>[
			['1. Height', '176.0'],
			['2. Shoulder width', '43.1'],
			['3. Chest', '98.0'],
			['4. Waist', '84.0'],
			['5. Hip', '101.0'],
			['6. Sleeve length', '62.0'],
			['7. Outside leg', '106.0'],
			['8. Inside leg', '80.0'],
			['9. Neck', '38.0']
		]) {
			await page.getByLabel(label).fill(v);
		}
		await page.getByRole('button', { name: 'Save and lock reading' }).click();
		await expect(
			page.getByText('Reading 2 was entered before reading 1. This is recorded.')
		).toBeVisible();
	});

	test('server unreachable: reading is queued on the device and sent later', async ({ page }) => {
		await loginEn(page, 'measurer-a@vt.test', /\/study\/reference$/);
		await page.evaluate(() =>
			localStorage.setItem(
				'vt.mock',
				JSON.stringify({ latency: false, failures: { 'POST /study/reference-readings': 503 } })
			)
		);
		await page.getByLabel('Participant code').fill('P005');
		for (const [label, v] of <[string, string][]>[
			['1. Height', '160.0'],
			['2. Shoulder width', '38.0'],
			['3. Chest', '92.0'],
			['4. Waist', '76.0'],
			['5. Hip', '99.0'],
			['6. Sleeve length', '57.0'],
			['7. Outside leg', '98.0'],
			['8. Inside leg', '74.0'],
			['9. Neck', '34.0']
		]) {
			await page.getByLabel(label).fill(v);
		}
		await page.getByRole('button', { name: 'Save and lock reading' }).click();
		await expect(page.getByText('Saved on this device.', { exact: false })).toBeVisible();
		await expect(page.getByText('1 reading waiting to send.')).toBeVisible();
		await page.evaluate(() =>
			localStorage.setItem('vt.mock', JSON.stringify({ latency: false, failures: {} }))
		);
		await page.getByRole('button', { name: 'Send now' }).click();
		await expect(page.getByText('Sent 1 queued readings', { exact: false })).toBeVisible();
		await expect(page.getByText('waiting to send')).toHaveCount(0);
	});

	test('a tailor cannot open tape entry (403)', async ({ page }) => {
		await loginEn(page, 'otieno@vt.test', /\/t\/orders$/);
		await page.goto('/study/reference');
		await expect(page.getByRole('heading', { name: 'Not allowed' })).toBeVisible();
	});

	test('study routes return 404 when study mode is off', async ({ page }) => {
		await loginEn(page, 'admin@vt.test', /\/admin\/accounts$/);
		await page.goto('/admin/settings');
		await page.getByRole('button', { name: 'Turn study mode off' }).click();
		await page.getByRole('dialog').getByRole('button', { name: 'Turn study mode off' }).click();
		await expect(page.getByText('Study mode is off', { exact: true })).toBeVisible();
		await page.getByRole('button', { name: 'Account' }).click();
		await page.getByRole('button', { name: 'Sign out' }).click();
		await page.waitForURL(/\/login$/);
		await page.getByLabel('Email').fill('measurer-a@vt.test');
		await page.getByLabel('Password', { exact: true }).fill('vt-demo-2026');
		await page.getByRole('button', { name: 'Sign in' }).click();
		await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
	});

	for (const lang of ['en', 'sw']) {
		test(`axe: tape entry (${lang})`, async ({ page }) => {
			await loginEn(page, 'measurer-a@vt.test', /\/study\/reference$/);
			if (lang === 'sw')
				await page
					.getByRole('group', { name: /Language|Lugha/ })
					.first()
					.getByRole('button', { name: 'Kiswahili' })
					.click();
			const r = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
				.analyze();
			const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
			expect(bad, JSON.stringify(bad.map((v) => [v.id, v.nodes.map((n) => n.target)]))).toEqual([]);
		});
	}
});
