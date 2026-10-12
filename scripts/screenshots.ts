/**
 * Checkpoint screenshots (Section 22): each route in EN and SW at 360×800 and
 * 1280×800. Usage: npx vite-node -c scripts/vite-node.config.mjs scripts/screenshots.ts <phase> <route...>
 * Needs `npm run dev` running.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const [phase = 'adhoc', ...routes] = process.argv.slice(2);
const out = `docs/checkpoints/${phase}`;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const [w, h] of [
	[360, 800],
	[1280, 800]
] as const) {
	for (const lang of ['en', 'sw']) {
		const ctx = await browser.newContext({
			viewport: { width: w, height: h },
			deviceScaleFactor: 1
		});
		await ctx.addInitScript((l) => localStorage.setItem('vt.lang', l), lang);
		const page = await ctx.newPage();
		for (const route of routes.length ? routes : ['/']) {
			await page.goto(`http://localhost:${process.env.VT_PORT ?? 5173}${route}`);
			await page.locator('html[data-vt-ready="true"]').waitFor({ state: 'attached' });
			const name = route === '/' ? 'welcome' : route.replace(/^\//, '').replace(/[/?=&]/g, '_');
			await page.screenshot({ path: `${out}/${name}-${lang}-${w}x${h}.png`, fullPage: true });
		}
		await ctx.close();
	}
}
await browser.close();
console.log(`screenshots in ${out}`);
