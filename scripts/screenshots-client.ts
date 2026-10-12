/**
 * Phase 2 checkpoint screenshots: runs the client flow on fake vision and captures each screen.
 * Usage: VT_PORT=5175 npx vite-node -c scripts/vite-node.config.mjs scripts/screenshots-client.ts <outDir> <en|sw> <width>
 */
import { chromium } from '@playwright/test';
const [out, lang = 'en', width = '360'] = process.argv.slice(2);
const b = await chromium.launch();
const ctx = await b.newContext({
	viewport: { width: Number(width), height: 800 },
	deviceScaleFactor: 1
});
await ctx.addInitScript((l) => ((window as unknown as { __L: string }).__L = l), lang);
await ctx.addInitScript(
	() => (
		localStorage.setItem(
			'vt.vision',
			JSON.stringify({ mode: 'fake', scenario: 'happy', timeScale: 0.25 })
		),
		localStorage.setItem('vt.lang', (window as unknown as { __L: string }).__L)
	)
);
const p = await ctx.newPage();
const errs: string[] = [];
p.on('pageerror', (e) => errs.push('pageerror ' + e.message));
p.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text()));
const shot = async (n: string) =>
	p.screenshot({ path: `${out}/${n}-${lang}-${width}x800.png`, fullPage: true });
const base = `http://localhost:${process.env.VT_PORT ?? 5175}`;
await p.goto(base + '/?code=QT1200');
await p.locator('html[data-vt-ready="true"]').waitFor({ state: 'attached' });
await shot('01-welcome');
await p.locator(`main button[lang=${lang}]`).click();
await p.waitForURL('**/start**');
await p
	.getByText(
		lang === 'en' ? 'Code from: Mama Wanjiru Tailors' : 'Nambari kutoka: Mama Wanjiru Tailors'
	)
	.waitFor();
await p.getByRole('radio', { name: lang === 'en' ? 'Female' : 'Mwanamke' }).check();
await p.locator('input[inputmode=decimal]').fill('168');
await shot('02-start');
await p.getByRole('button', { name: lang === 'en' ? 'Continue' : 'Endelea', exact: true }).click();
await p.waitForURL('**/consent');
for (const cb of await p.getByRole('checkbox').all()) await cb.check();
await shot('03-consent');
await p.getByRole('button', { name: lang === 'en' ? 'Open camera' : 'Fungua kamera' }).click();
await p.waitForURL('**/check');
await p.locator('.verdict').waitFor();
await shot('04-check');
await p.getByRole('button', { name: lang === 'en' ? 'Continue' : 'Endelea', exact: true }).click();
await p.waitForURL('**/sheet');
await p
	.getByRole('button', { name: lang === 'en' ? 'Yes, it is right' : 'Ndiyo, iko sawa' })
	.click();
await shot('05-sheet');
await p.getByRole('button', { name: lang === 'en' ? 'Continue' : 'Endelea', exact: true }).click();
await p.waitForURL('**/setup');
await p
	.getByRole('button', { name: lang === 'en' ? "I'm ready — start" : 'Niko tayari — anza' })
	.waitFor();
await p.waitForTimeout(1500);
await shot('06-setup');
await p
	.getByRole('button', { name: lang === 'en' ? "I'm ready — start" : 'Niko tayari — anza' })
	.click();
await p.waitForURL('**/capture/front');
await p.waitForTimeout(2600);
await shot('07-front-checking');
await p.waitForURL('**/capture/side', { timeout: 40000 });
await p.waitForTimeout(1800);
await shot('08-side');
await p.waitForURL('**/review', { timeout: 40000 });
await p.waitForTimeout(500);
await shot('09-review');
await p
	.getByRole('button', {
		name: lang === 'en' ? 'Save and send to tailor' : 'Hifadhi na utume kwa fundi'
	})
	.click();
await p.waitForTimeout(1500);
await p.waitForURL('**/saved**');
await p.waitForTimeout(2500);
await shot('10-saved');
console.log(errs.join('\n') || 'no errors');
await b.close();
