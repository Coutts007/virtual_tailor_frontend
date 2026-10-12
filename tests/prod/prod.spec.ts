import { expect, test, type Page } from '@playwright/test';

/** Collects CSP violations reported by the page. */
async function watchCsp(page: Page) {
	const violations: string[] = [];
	await page.exposeFunction('__cspViolation', (v: string) => violations.push(v));
	await page.addInitScript(() =>
		document.addEventListener('securitypolicyviolation', (e) =>
			(window as unknown as { __cspViolation(v: string): void }).__cspViolation(
				`${e.violatedDirective} ${e.blockedURI}`
			)
		)
	);
	page.on(
		'console',
		(m) => /Content Security Policy|Refused to/.test(m.text()) && violations.push(m.text())
	);
	return violations;
}

async function swReady(page: Page) {
	await page.waitForFunction(
		async () => !!(await navigator.serviceWorker.getRegistration())?.active,
		null,
		{ timeout: 30_000 }
	);
	await page.reload();
	await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30_000 });
}

test('security headers are served and the app runs under the CSP', async ({ page }) => {
	const violations = await watchCsp(page);
	const res = await page.goto('/');
	const h = res!.headers();
	expect(h['content-security-policy']).toContain("script-src 'self' 'wasm-unsafe-eval' 'sha256-");
	expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
	expect(h['strict-transport-security']).toContain('max-age=');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Virtual Tailor');
	for (const path of ['/start', '/help', '/privacy', '/login', '/me']) {
		await page.goto(path);
		await expect(page.locator('h1')).toHaveCount(1);
	}
	expect(violations).toEqual([]);
});

test('offline after first load: the shell, help and privacy still open (FR-01, NFR-03)', async ({
	page,
	context
}) => {
	await page.goto('/');
	await swReady(page);
	await context.setOffline(true);
	await page.reload();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Virtual Tailor');
	await page.goto('/help');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('How to measure');
	await page.goto('/privacy');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy and your rights');
	await context.setOffline(false);
});

test('service worker never caches /api/ and does not precache the vision assets (2.1.4, UX 10)', async ({
	page
}) => {
	await page.goto('/');
	await swReady(page);
	await page.evaluate(() => fetch('/api/v1/settings/public').catch(() => null));
	const cached = await page.evaluate(async () => {
		const out: string[] = [];
		for (const name of await caches.keys())
			for (const r of await (await caches.open(name)).keys())
				out.push(`${name} ${new URL(r.url).pathname}`);
		return out;
	});
	expect(cached.length).toBeGreaterThan(10);
	expect(cached.filter((c) => c.includes('/api/'))).toEqual([]);
	expect(cached.filter((c) => /\/(models|wasm|opencv)\//.test(c))).toEqual([]);
	expect(cached.filter((c) => c.includes('mockServiceWorker'))).toEqual([]);
});

test('vision workers load self-hosted assets under the CSP', async ({ page }) => {
	const violations = await watchCsp(page);
	await page.goto('/');
	const r = await page.evaluate(async () => {
		const run = (url: string, msg: object, transfer: Transferable[] = []) =>
			new Promise<{ ok: boolean; value?: unknown; error?: string }>((res) => {
				const w = new Worker(url);
				w.onmessage = (e) => {
					res(e.data);
					w.terminate();
				};
				w.onerror = (e) => res({ ok: false, error: e.message });
				w.postMessage(msg, transfer);
			});
		const img = new Image();
		img.src = '/marker/vt-measuring-sheet-preview.svg';
		await img.decode();
		const c = new OffscreenCanvas(840, 1188);
		c.getContext('2d')!.drawImage(img, 0, 0, 840, 1188);
		const bitmap = await createImageBitmap(c);
		const marker = await run('/workers/marker.worker.js', { id: 1, op: 'marker', bitmap }, [
			bitmap
		]);
		const pose = await run('/workers/pose.worker.js', { id: 1, op: 'init', variant: 'lite' });
		return { marker, pose };
	});
	expect(r.marker.ok, JSON.stringify(r.marker)).toBe(true);
	expect((r.marker.value as { found: boolean }).found).toBe(true);
	expect(r.pose.ok, JSON.stringify(r.pose)).toBe(true);
	expect(violations).toEqual([]);
});

test('development tools and the mock backend are not in the production build', async ({
	page,
	request
}) => {
	await page.goto('/dev/ui');
	await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
	const msw = await request.get('/mockServiceWorker.js');
	expect(msw.headers()['content-type'] ?? '').not.toContain('javascript');
});
