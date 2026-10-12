import type { Page } from '@playwright/test';

/** Navigate and wait until the app has hydrated and its workers are running. */
export async function open(page: Page, path: string) {
	await page.goto(path);
	await page.locator('html[data-vt-ready="true"]').waitFor({ state: 'attached' });
}
