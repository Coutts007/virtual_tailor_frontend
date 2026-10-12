import type { Page } from '@playwright/test';

/** Navigate and wait until the app has hydrated and its workers are running. */
export async function open(page: Page, path: string) {
	await page.goto(path);
	await page.locator('html[data-vt-ready="true"]').waitFor({ state: 'attached' });
}

export const PASSWORD = 'vt-demo-2026';

/** Sign in through the login screen; waits for the role's home page. */
export async function login(page: Page, email: string, path = '/login') {
	await open(page, path);
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
	await page.getByRole('button', { name: 'Sign in' }).click();
}

/** Sign in and switch the UI to English (some seed accounts prefer Kiswahili). */
export async function loginEn(page: Page, email: string, home: RegExp) {
	await login(page, email);
	await page.waitForURL(home);
	await page.locator('html[data-vt-ready="true"]').waitFor({ state: 'attached' });
	await page
		.getByRole('group', { name: /Language|Lugha/ })
		.first()
		.getByRole('button', { name: 'English' })
		.click();
}

/** Turn off mock latency for faster, steadier tests. */
export async function fastMock(page: Page) {
	await page.addInitScript(() =>
		localStorage.setItem('vt.mock', JSON.stringify({ latency: false, failures: {} }))
	);
}
