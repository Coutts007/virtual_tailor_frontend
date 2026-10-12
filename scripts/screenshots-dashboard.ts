/**
 * Logged-in checkpoint screenshots (Section 22) for the dashboard surfaces:
 * each route in EN and SW at 360×800 and 1280×800.
 *
 * Usage (dev server on VT_PORT must be running):
 *   VT_PORT=5190 npx vite-node -c scripts/vite-node.config.mjs scripts/screenshots-dashboard.ts \
 *     <phase> <email|-> <route...>
 * Routes may use seed ids: {client:amina} {profile:amina-v2} {order:o1}.
 */
import { mkdirSync } from 'node:fs';
import { chromium, type Page } from '@playwright/test';
import { uid } from '../mocks/seed';

const [phase = 'adhoc', email = '-', ...routes] = process.argv.slice(2);
const base = `http://localhost:${process.env.VT_PORT ?? 5173}`;
const out = `docs/checkpoints/${phase}`;
mkdirSync(out, { recursive: true });

const expand = (r: string) =>
	r
		.replace(/\{client:([\w-]+)\}/g, (_m, l) => uid(`client-${l}`))
		.replace(/\{profile:([\w-]+)\}/g, (_m, l) => uid(`${l}-profile`))
		.replace(/\{order:([\w-]+)\}/g, (_m, l) => uid(`order-${l}`));
const nameOf = (r: string) =>
	r
		.replace(/^\//, '')
		.replace(/\{(\w+):([\w-]+)\}/g, '$1-$2')
		.replace(/[/?=&]/g, '_') || 'home';

async function ready(page: Page) {
	await page.locator('html[data-vt-ready="true"]').waitFor({ state: 'attached' });
	await page.waitForTimeout(400);
	await page
		.locator('[aria-busy="true"]')
		.first()
		.waitFor({ state: 'detached', timeout: 8000 })
		.catch(() => {});
}

const browser = await chromium.launch();
for (const [w, h] of [
	[360, 800],
	[1280, 800]
] as const) {
	for (const lang of ['en', 'sw']) {
		const ctx = await browser.newContext({
			viewport: { width: w, height: h },
			deviceScaleFactor: 1,
			timezoneId: 'Africa/Nairobi'
		});
		await ctx.addInitScript(() =>
			localStorage.setItem('vt.mock', JSON.stringify({ latency: false, failures: {} }))
		);
		const page = await ctx.newPage();
		if (email !== '-') {
			await page.goto(`${base}/login`);
			await ready(page);
			await page.getByLabel(/Email|Barua pepe/).fill(email);
			await page.locator('input[type="password"]').fill('vt-demo-2026');
			await page.locator('form button[type="submit"]').click();
			await page.waitForURL((u) => !u.pathname.startsWith('/login'));
		}
		if (email === '-') await page.goto(`${base}/login`);
		await page.evaluate((l) => localStorage.setItem('vt.lang', l), lang);
		for (const r of routes) {
			await page.goto(`${base}${expand(r)}`);
			await ready(page);
			await page.screenshot({ path: `${out}/${nameOf(r)}-${lang}-${w}x${h}.png`, fullPage: true });
		}
		await ctx.close();
	}
}
await browser.close();
console.log(`screenshots in ${out}`);
