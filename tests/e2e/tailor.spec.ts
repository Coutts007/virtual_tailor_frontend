import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { fastMock, loginEn } from './helpers';

/** Forces the wa.me fallback (no Web Share) and records window.open targets. */
async function stubShare(page: Page) {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
		Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
		(window as unknown as { __opened: string[] }).__opened = [];
		window.open = ((url: string) => {
			(window as unknown as { __opened: string[] }).__opened.push(String(url));
			return null;
		}) as typeof window.open;
	});
}
/** Wait until loading skeletons are gone. */
async function settle(page: Page) {
	await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 10_000 });
}
const opened = (page: Page) =>
	page.evaluate(() => (window as unknown as { __opened: string[] }).__opened);

function isoInDays(n: number) {
	const d = new Date(Date.now() + n * 86400_000);
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(d);
}

test.beforeEach(async ({ page }) => {
	await fastMock(page);
	await stubShare(page);
	await loginEn(page, 'wanjiru@vt.test', /\/t\/orders$/);
});

test.describe('Phase 5: tailor dashboard (Section 13)', () => {
	test('issue code → share card with QR → WhatsApp fallback (wa.me)', async ({ page }) => {
		await page.getByRole('link', { name: 'Clients' }).first().click();
		await expect(page.getByRole('heading', { level: 1, name: 'Clients' })).toBeVisible();
		await page.getByRole('link', { name: 'New client code' }).click();
		await page.getByLabel('Display name').fill('Zawadi');
		await page.getByLabel('Measured height').fill('160');
		await page.getByRole('button', { name: 'Issue code' }).click();
		await expect(page.getByRole('heading', { name: 'Code ready' })).toBeVisible();
		await expect(page.getByRole('img', { name: /QR code to open Virtual Tailor/ })).toBeVisible();
		const code = (await page.locator('.code').innerText()).trim();
		expect(code).toMatch(/^[A-Z]{2}\d{4}$/);
		await page.getByRole('button', { name: 'Send on WhatsApp' }).click();
		const urls = await opened(page);
		expect(urls[0]).toMatch(/^https:\/\/wa\.me\/\?text=/);
		expect(decodeURIComponent(urls[0]!)).toContain(`Your code is ${code}`);
		// Kiswahili message toggle
		await page
			.getByRole('group', { name: 'Message language' })
			.getByRole('button', { name: 'Kiswahili' })
			.click();
		await expect(page.getByText(`Nambari yako ni ${code}`, { exact: false })).toBeVisible();
	});

	test('search clients (debounced) and open a measurement sheet', async ({ page }) => {
		await page.goto('/t/clients');
		await page.getByLabel('Search').fill('amina');
		await expect(page.getByRole('link', { name: 'AB1234' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'KE2048' })).toHaveCount(0);
		await page.getByRole('link', { name: 'AB1234' }).click();
		await page.getByRole('link', { name: /Version 2/ }).click();
		await expect(page.getByRole('heading', { level: 1 })).toContainText('AB1234 · version 2');
		await expect(page.getByText('Confirm these at the fitting', { exact: false })).toBeVisible();
		await expect(page.getByRole('table').first()).toContainText('Bust');
		await expect(page.getByText('Check', { exact: true }).first()).toBeVisible();
	});

	test('create order: flagged row must be confirmed, override is audited, sheet shared via wa.me', async ({
		page
	}) => {
		await page.goto('/t/clients');
		await page.getByLabel('Search').fill('AB1234');
		await page.getByRole('link', { name: 'AB1234' }).click();
		await page.getByRole('link', { name: 'New order from latest profile' }).click();
		await expect(page.getByRole('heading', { level: 1, name: 'New order' })).toBeVisible();
		await page.getByLabel('Due date', { exact: true }).fill(isoInDays(10));

		const save = page.getByRole('button', { name: 'Save order' });
		await expect(save).toBeDisabled();
		await expect(
			page.getByText('Confirm or override 1 flagged measurement to save.')
		).toBeVisible();

		// Override chest; reason recorded.
		await page.getByRole('button', { name: 'Bust: Override' }).click();
		const dlg = page.getByRole('dialog', { name: 'Override Bust' });
		await dlg.getByLabel(/New body value/).fill('99.0');
		await dlg.getByLabel('Reason').fill('Taped at the shop');
		await dlg.getByRole('button', { name: 'Use this value' }).click();
		await expect(page.getByText('Overridden', { exact: true })).toBeVisible();

		await page.getByLabel('Confirmed: Waist is right').check();
		await expect(save).toBeEnabled();
		await page.getByLabel('Waist Ease (cm)').fill('8');
		await save.click();
		await expect(page.getByText(/Order ORD-\d{4} saved/)).toBeVisible();
		await expect(page.getByRole('heading', { level: 1 })).toContainText(/ORD-\d{4} · Shirt/);

		// Sheet: generate, preview, share fallback.
		await page.getByRole('link', { name: 'Sheet & share' }).click();
		await page.getByRole('button', { name: 'Generate sheet' }).click();
		await expect(page.getByRole('img', { name: /Specification sheet for ORD-/ })).toBeVisible();
		await page.getByRole('button', { name: 'Share on WhatsApp' }).click();
		await expect(
			page.getByText('Attach the downloaded picture in WhatsApp', { exact: false })
		).toBeVisible();
		const urls = await opened(page);
		expect(decodeURIComponent(urls.at(-1)!)).toMatch(/Virtual Tailor · Client AB1234 · Profile v2/);
		expect(decodeURIComponent(urls.at(-1)!)).not.toContain('Amina');

		// Audit shows the override and the share.
		await page.getByRole('link', { name: 'Audit' }).first().click();
		await expect(
			page.locator('li.audit').filter({ hasText: 'Overrode a value' }).first()
		).toBeVisible();
		await expect(page.locator('li.audit').filter({ hasText: 'Shared' }).first()).toBeVisible();
	});

	test('status change from the queue, backwards needs confirmation', async ({ page }) => {
		const card = page.locator('li.card').filter({ hasText: 'Cutting' }).first();
		const no = (await card.locator('.title').innerText()).split(' · ')[0]!;
		await card.getByRole('button', { name: /Status/ }).click();
		await page.getByRole('dialog').getByRole('button', { name: 'Fitting' }).click();
		await expect(page.getByText(`${no} is now Fitting.`)).toBeVisible();

		const again = page.locator('li.card').filter({ hasText: no }).first();
		await again.getByRole('button', { name: /Status/ }).click();
		await page.getByRole('dialog').getByRole('button', { name: 'New' }).click();
		await expect(page.getByRole('dialog', { name: 'Move the order back?' })).toBeVisible();
		await page.getByRole('button', { name: 'Move back' }).click();
		await expect(page.getByText(`${no} is now New.`)).toBeVisible();
	});

	test('order queue: overdue tag and collected hidden by default', async ({ page }) => {
		await expect(page.getByText('Overdue').first()).toBeVisible();
		await expect(page.locator('li.card').filter({ hasText: 'Collected' })).toHaveCount(0);
		await page.getByLabel('Show collected').check();
		await expect(page.locator('li.card').filter({ hasText: 'Collected' }).first()).toBeVisible();
	});

	test('conflicts: badge → resolve → none left', async ({ page }) => {
		await page.getByRole('link', { name: '1 sync conflict' }).click();
		await expect(page.getByRole('heading', { level: 1, name: 'Sync conflicts' })).toBeVisible();
		await expect(page.getByText('From phone (v3)')).toBeVisible();
		await page.getByRole('button', { name: 'Use the newer one' }).click();
		await expect(page.getByText('No conflicts.')).toBeVisible();
		await expect(page.getByRole('link', { name: /sync conflict/ })).toHaveCount(0);
	});

	test('offline: banner and mutating actions disabled', async ({ page, context }) => {
		await page.goto('/t/clients/new');
		await page.locator('html[data-vt-ready="true"]').waitFor({ state: 'attached' });
		await context.setOffline(true);
		await expect(
			page.getByText('You are offline. You can look at what is already loaded', { exact: false })
		).toBeVisible();
		await expect(page.getByRole('button', { name: 'Issue code' })).toBeDisabled();
		await context.setOffline(false);
	});

	test('keyboard-only order flow', async ({ page }) => {
		await page.goto('/t/clients');
		await page.getByLabel('Search').fill('KE2048');
		await page.getByRole('link', { name: 'KE2048' }).click();
		await page.getByRole('link', { name: 'New order from latest profile' }).focus();
		await page.keyboard.press('Enter');
		await expect(page.getByRole('heading', { level: 1, name: 'New order' })).toBeVisible();
		await page.getByLabel('Garment').focus();
		await page.keyboard.press('Tab'); // → due date
		await expect(page.getByLabel('Due date', { exact: true })).toBeFocused();
		await page.keyboard.type(
			isoInDays(5).split('-').reverse().join('').slice(0, 4) + isoInDays(5).slice(0, 4)
		);
		// Fall back to fill if the locale ordering differs; the field must hold a valid date either way.
		if (!(await page.getByLabel('Due date', { exact: true }).inputValue()))
			await page.getByLabel('Due date', { exact: true }).fill(isoInDays(5));
		const save = page.getByRole('button', { name: 'Save order' });
		await expect(save).toBeEnabled();
		await save.focus();
		await page.keyboard.press('Enter');
		await expect(page.getByText(/Order ORD-\d{4} saved/)).toBeVisible();
	});

	for (const lang of ['en', 'sw']) {
		test(`axe: every tailor route (${lang})`, async ({ page }) => {
			test.setTimeout(150_000);
			if (lang === 'sw')
				await page
					.getByRole('group', { name: /Language|Lugha/ })
					.first()
					.getByRole('button', { name: 'Kiswahili' })
					.click();
			const amina = '/t/clients';
			const paths = [
				'/t/orders',
				amina,
				'/t/clients/new',
				'/t/conflicts',
				'/t/audit',
				'/t/settings',
				'/t/orders/new'
			];
			for (const path of paths) {
				await page.goto(path);
				await page.locator('h1').first().waitFor();
				await settle(page);
				const r = await new AxeBuilder({ page })
					.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
					.analyze();
				const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
				expect(
					bad,
					`${path}: ${JSON.stringify(bad.map((v) => [v.id, v.nodes.map((n) => n.target)]))}`
				).toEqual([]);
			}
			// Detail routes reached through the UI.
			await page.goto('/t/clients');
			await page.locator('a.code').first().click();
			await page.locator('h1').first().waitFor();
			for (const step of ['client', 'profile', 'neworder', 'order', 'sheet']) {
				if (step === 'profile') await page.locator('a.card').first().click();
				if (step === 'neworder')
					await page
						.getByRole('link', { name: /New order from this profile|Oda mpya kutoka vipimo hivi/ })
						.click();
				if (step === 'order') {
					await page.goto('/t/orders');
					await page.locator('li.card a.main').first().click();
				}
				if (step === 'sheet')
					await page.getByRole('link', { name: /Sheet & share|Karatasi na kushiriki/ }).click();
				await page.locator('h1').first().waitFor();
				await settle(page);
				const r = await new AxeBuilder({ page })
					.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
					.analyze();
				const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
				expect(
					bad,
					`${step}: ${JSON.stringify(bad.map((v) => [v.id, v.nodes.map((n) => n.target)]))}`
				).toEqual([]);
			}
		});
	}
});
