import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { open } from './helpers';

test.describe('Phase 1: component gallery (/dev/ui)', () => {
	test('CodeInput forces upper case and the AB1234 mask', async ({ page }) => {
		await open(page, '/dev/ui');
		const input = page.getByLabel('Client code (from your tailor)');
		await input.fill('');
		await input.pressSequentially('k1e2048xyz');
		await expect(input).toHaveValue('KE2048');
	});

	test('Dialog traps focus, closes on Escape and returns focus to the opener', async ({ page }) => {
		await open(page, '/dev/ui');
		const opener = page.getByRole('button', { name: 'Open dialog' });
		await opener.click();
		const dialog = page.getByRole('dialog', { name: 'Delete these measurements from this phone?' });
		await expect(dialog).toBeVisible();
		for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
		expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
		await page.keyboard.press('Escape');
		await expect(dialog).toBeHidden();
		await expect(opener).toBeFocused();
	});

	test('flags are icon + word, never colour alone', async ({ page }) => {
		await open(page, '/dev/ui');
		for (const word of ['Good', 'Check', 'Not measured']) {
			const badge = page.getByText(word, { exact: true }).filter({ visible: true }).first();
			await expect(badge).toBeVisible();
			// The word sits next to an icon inside the badge.
			await expect(badge.locator('xpath=..').locator('svg')).toHaveCount(1);
		}
	});

	test('silhouette has eight labels that open details', async ({ page }) => {
		await open(page, '/dev/ui');
		const diagram = page.getByRole('img', { name: 'Measurement diagram' }).locator('..');
		await expect(diagram.getByRole('button')).toHaveCount(8);
	});

	test('switching to Kiswahili keeps form state', async ({ page }) => {
		await open(page, '/dev/ui');
		const input = page.getByLabel('Client code (from your tailor)');
		await input.fill('');
		await input.pressSequentially('AB12');
		await page
			.getByRole('group', { name: 'Language' })
			.first()
			.getByRole('button', { name: 'Kiswahili' })
			.click();
		await expect(page.getByLabel('Nambari ya mteja (kutoka kwa fundi wako)')).toHaveValue('AB12');
		await expect(page.getByText('Haijapimwa').first()).toBeVisible();
	});

	for (const lang of ['en', 'sw']) {
		test(`no serious/critical axe violations on /dev/ui (${lang})`, async ({ page }) => {
			await page.addInitScript((l) => localStorage.setItem('vt.lang', l), lang);
			await open(page, '/dev/ui');
			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
				.analyze();
			const bad = results.violations.filter(
				(v) => v.impact === 'serious' || v.impact === 'critical'
			);
			expect(
				bad,
				JSON.stringify(
					bad.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
					null,
					1
				)
			).toEqual([]);
		});
	}
});

test.describe('Phase 1: mock backend from the browser', () => {
	test('login, client list and forced failure via the dev panel', async ({ page }) => {
		await open(page, '/dev/mock');
		const r = await page.evaluate(async () => {
			const login = await (
				await fetch('/api/v1/auth/login', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: 'wanjiru@vt.test', password: 'vt-demo-2026' })
				})
			).json();
			const clients = await (
				await fetch('/api/v1/clients', {
					headers: { Authorization: `Bearer ${login.access_token}` }
				})
			).json();
			return { role: login.user.role, total: clients.total };
		});
		expect(r).toEqual({ role: 'tailor', total: 8 });

		await page.getByLabel('Failure for GET /settings/public').selectOption('503');
		const status = await page.evaluate(async () => (await fetch('/api/v1/settings/public')).status);
		expect(status).toBe(503);
		await page.getByRole('button', { name: 'Clear failures' }).click();
		expect(await page.evaluate(async () => (await fetch('/api/v1/settings/public')).status)).toBe(
			200
		);
	});
});
