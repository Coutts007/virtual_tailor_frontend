import { expect, test } from '@playwright/test';
import { fastMock, loginEn } from './helpers';

/** WCAG 1.4.4: dashboard text zoomed to 200% loses nothing (Section 17). */
test.use({ viewport: { width: 1280, height: 800 } });
test.skip(({ isMobile }) => isMobile, 'desktop project only');

for (const path of ['/t/orders', '/t/clients', '/t/settings']) {
	test(`200% text zoom on ${path}: no horizontal overflow`, async ({ page }) => {
		await fastMock(page);
		await loginEn(page, 'wanjiru@vt.test', /\/t\/orders/);
		await page.goto(path);
		await page.locator('h1').waitFor();
		await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
		await page.waitForTimeout(300);
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth - document.documentElement.clientWidth
		);
		expect(overflow).toBeLessThanOrEqual(1);
		await expect(page.locator('h1')).toBeVisible();
	});
}
