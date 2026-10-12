import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { fastMock, login, loginEn, open, PASSWORD } from './helpers';

test.beforeEach(async ({ page }) => fastMock(page));

test.describe('Phase 5: sign in, registration, guards (Section 13.1, 7.2)', () => {
	test('tailor signs in and lands on the order queue', async ({ page }) => {
		await login(page, 'wanjiru@vt.test');
		await expect(page).toHaveURL(/\/t\/orders$/);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Orders|Oda/);
	});

	test('wrong password shows a generic message', async ({ page }) => {
		await open(page, '/login');
		await page.getByLabel('Email').fill('wanjiru@vt.test');
		await page.getByLabel('Password', { exact: true }).fill('not-the-password');
		await page.getByRole('button', { name: 'Sign in' }).click();
		await expect(page.getByText('The email or password is not right.')).toBeVisible();
	});

	test('pending tailor sees the waiting screen only', async ({ page }) => {
		await login(page, 'pending@vt.test');
		await expect(page).toHaveURL(/\/register\/pending$/);
		await expect(page.getByRole('heading', { name: 'Waiting for approval' })).toBeVisible();
		await page.goto('/t/orders');
		await expect(page).toHaveURL(/\/register\/pending$/);
	});

	test('disabled account gets a clear message', async ({ page }) => {
		await login(page, 'disabled@vt.test');
		await expect(page.getByText('This account is switched off.', { exact: false })).toBeVisible();
	});

	test('anonymous visit to the dashboard goes to login with next=', async ({ page }) => {
		await page.goto('/t/clients');
		await expect(page).toHaveURL(/\/login\?next=%2Ft%2Fclients/);
		await page.getByLabel('Email').fill('wanjiru@vt.test');
		await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
		await page.getByRole('button', { name: 'Sign in' }).click();
		await expect(page).toHaveURL(/\/t\/clients$/);
	});

	// Needs the admin routes (Phase 6).
	test.fixme('wrong role gets a 403 screen with a way home', async ({ page }) => {
		await loginEn(page, 'wanjiru@vt.test', /\/t\/orders$/);
		await page.goto('/admin/accounts');
		await expect(page.getByRole('heading', { name: 'Not allowed' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Go to the start' })).toBeVisible();
	});

	test('expired session sends the tailor back to sign in with a message', async ({ page }) => {
		await loginEn(page, 'wanjiru@vt.test', /\/t\/orders$/);
		// Simulate a token the server no longer accepts.
		await page.evaluate(() => {
			const s = JSON.parse(sessionStorage.getItem('vt.session')!);
			s.access_token = 'mock.revoked';
			sessionStorage.setItem('vt.session', JSON.stringify(s));
		});
		await page.goto('/t/clients');
		await expect(page.getByText('Your session ended. Please sign in again.')).toBeVisible();
		await expect(page).toHaveURL(/\/login\?next=/);
	});

	test('sign out clears the session', async ({ page }) => {
		await loginEn(page, 'wanjiru@vt.test', /\/t\/orders$/);
		await page.getByRole('button', { name: 'Account' }).click();
		await page.getByRole('button', { name: 'Sign out' }).click();
		await expect(page).toHaveURL(/\/login$/);
		expect(await page.evaluate(() => sessionStorage.getItem('vt.session'))).toBeNull();
		await page.goto('/t/orders');
		await expect(page).toHaveURL(/\/login/);
	});

	test('registration validates and ends on the pending screen', async ({ page }) => {
		await open(page, '/register');
		await page.getByRole('button', { name: 'Register', exact: true }).click();
		await expect(page.getByText('Enter an email address like name@example.com')).toBeVisible();
		await page.getByLabel('Email').fill('new.tailor@vt.test');
		await page.getByLabel('Password', { exact: true }).fill('Nairobi123');
		await page.getByLabel('Business name').fill('Zawadi Designs');
		await page.getByLabel('Phone').fill('0712 000 111');
		await page.getByRole('button', { name: 'Register', exact: true }).click();
		await expect(page.getByText('This password is too common.', { exact: false })).toBeVisible();
		await page.getByLabel('Password', { exact: true }).fill('mango juice at noon');
		await page.getByRole('button', { name: 'Register', exact: true }).click();
		await expect(page).toHaveURL(/\/register\/pending$/);
	});

	for (const lang of ['en', 'sw']) {
		test(`axe: login and register (${lang})`, async ({ page }) => {
			await page.addInitScript((l) => localStorage.setItem('vt.lang', l), lang);
			for (const path of ['/login', '/register', '/register/pending']) {
				await open(page, path);
				const r = await new AxeBuilder({ page })
					.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
					.analyze();
				const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
				expect(
					bad,
					`${path}: ${JSON.stringify(bad.map((v) => [v.id, v.nodes.map((n) => n.target)]))}`
				).toEqual([]);
			}
		});
	}
});
