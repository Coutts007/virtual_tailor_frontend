import { expect, test, type Request } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { open } from './helpers';
import { finishCapture, runToReview, T, useFakeVision } from './clientHelpers';

test.describe.configure({ mode: 'parallel' });
// The client app is a phone flow; the desktop project would only repeat it.
test.skip(({ isMobile }) => !isMobile, 'phone project only');
test.use({ viewport: { width: 360, height: 800 } });

test.describe('Phase 2: client flow with fake vision', () => {
	test('full flow in English: code verified, eight measurements, saved and synced', async ({
		page
	}) => {
		await runToReview(page);
		await finishCapture(page);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your measurements');
		const list = page
			.getByRole('region', { name: 'All measurements' })
			.or(
				page.locator('section', { has: page.getByRole('heading', { name: 'All measurements' }) })
			);
		await expect(list.getByRole('listitem')).toHaveCount(8);
		await expect(page.getByText(/Height you entered: 168\.0 cm/)).toBeVisible();
		await page.getByRole('button', { name: T.en.save }).click();
		await page.waitForURL('**/saved**');
		await expect(page.getByRole('status').getByText('Saved and sent to your tailor')).toBeVisible({
			timeout: 15_000
		});
		await expect(page.getByText(/Your code: QT1200/)).toBeVisible();
	});

	test('full flow in Kiswahili', async ({ page }) => {
		await runToReview(page, { lang: 'sw' });
		await finishCapture(page);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vipimo vyako');
		await expect(page.getByText('Kiuno').first()).toBeVisible();
		await page.getByRole('button', { name: T.sw.save }).click();
		await expect(
			page.getByRole('status').getByText('Imehifadhiwa na kutumwa kwa fundi wako')
		).toBeVisible({ timeout: 15_000 });
	});

	test('consent is required before the camera; "I do not agree" exits and clears details', async ({
		page
	}) => {
		await useFakeVision(page);
		await open(page, '/start?code=QT1200');
		await page.getByRole('radio', { name: 'Male', exact: true }).check();
		await page.locator('input[inputmode=decimal]').fill('175');
		await page.getByRole('button', { name: 'Continue', exact: true }).click();
		await page.waitForURL('**/consent');
		await expect(page.getByRole('button', { name: 'Open camera' })).toBeDisabled();
		await expect(page.getByText('Tick all three boxes to continue.')).toBeVisible();
		await expect(page.getByText('Consent text version 1.0, English')).toBeVisible();
		await page.getByRole('link', { name: 'I do not agree' }).click();
		await page.waitForURL('**/declined');
		await page.getByRole('button', { name: 'Clear the details I entered' }).click();
		await expect(page.getByText('Your details have been cleared from this phone.')).toBeVisible();
	});

	test('details form: code mask, height range and feet suggestion (Table 5.2)', async ({
		page
	}) => {
		await useFakeVision(page);
		await open(page, '/start');
		await page.getByLabel('Client code (from your tailor)').pressSequentially('zz99');
		await page.locator('input[inputmode=decimal]').fill('5.7');
		await expect(page.getByText('Did you mean 5 ft 7 in? That is 170 cm.')).toBeVisible();
		await page.getByRole('button', { name: 'Use 170 cm' }).click();
		await expect(page.locator('input[inputmode=decimal]')).toHaveValue('170');
		await page.getByRole('button', { name: 'Continue', exact: true }).click();
		await expect(
			page.getByText('Enter the 6-character code from your tailor, for example AB1234')
		).toBeVisible();
	});

	test('each correction appears in priority order, then recovers', async ({ page }) => {
		test.setTimeout(90_000);
		await runToReview(page, { scenario: 'every-check', timeScale: 1, mode: 'assisted' });
		const instruction = page.locator('p.instruction');
		for (const msg of [
			'Not level — straighten the phone',
			'Step into the outline',
			'Your head is cut off — step back',
			'Too close — step back one step',
			'Too far — step forward one step',
			'Turn to face the phone',
			'Move your arm away from your body'
		])
			await expect(instruction).toHaveText(msg, { timeout: 15_000 });
		// Shutter stays disabled until every check is green (FR-04).
		await expect(page.getByRole('button', { name: 'Take photos' })).toBeDisabled();
	});

	test('scale disagreement over 4% asks for a retake of the weaker view', async ({ page }) => {
		await runToReview(page, { scenario: 'scale-disagree' });
		await finishCapture(page);
		await expect(
			page.getByText(/Please retake the front photo — the sheet and your height did not agree/)
		).toBeVisible();
		await page.getByRole('button', { name: 'Retake front' }).click();
		await page.waitForURL('**/capture/front');
		await page.waitForURL('**/review', { timeout: 45_000 });
		await expect(page.getByText(/did not agree/)).toHaveCount(0);
	});

	test('feet together: inside leg is "Not measured" with a reason (C4)', async ({ page }) => {
		await runToReview(page, { scenario: 'inleg-fail' });
		await finishCapture(page);
		const row = page.getByRole('button', { name: /Inside leg/ }).last();
		await expect(row).toContainText('—');
		await expect(row).toContainText('Not measured');
		await expect(page.getByText(/We could not find the gap between your legs/)).toBeVisible();
	});

	test('a bad burst says "Please hold still and try again" and recovers', async ({ page }) => {
		await runToReview(page, { scenario: 'bad-burst' });
		await expect(page.locator('p.instruction')).toHaveText('Please hold still and try again', {
			timeout: 30_000
		});
		await finishCapture(page);
	});

	test('save while the send fails stays on the phone, then sends when back online (NFR-03, NFR-08)', async ({
		page
	}) => {
		// The dev server serves route code on demand, so true offline navigation is covered by the
		// production-build test (Phase 7). Here the mock makes every send fail instead.
		await page.addInitScript(() =>
			localStorage.setItem(
				'vt.mock',
				JSON.stringify({ latency: false, failures: { 'POST /profiles': 503 } })
			)
		);
		await runToReview(page);
		await finishCapture(page);
		await page.getByRole('button', { name: T.en.save }).click();
		await page.waitForURL('**/saved**');
		await expect(
			page.getByText('Saved on this phone. It will send by itself when you are online.')
		).toBeVisible();
		await page.reload();
		await expect(
			page.getByText('Saved on this phone. It will send by itself when you are online.')
		).toBeVisible();
		await page.evaluate(() =>
			localStorage.setItem('vt.mock', JSON.stringify({ latency: false, failures: {} }))
		);
		await page.evaluate(() => dispatchEvent(new Event('online')));
		await expect(page.getByRole('status').getByText('Saved and sent to your tailor')).toBeVisible({
			timeout: 15_000
		});
	});

	test('unknown code accepted offline, rejected at sync, fixed with "Change code" (decision 2)', async ({
		page,
		context
	}) => {
		await useFakeVision(page, 'perfect', 0.15);
		await open(page, '/start');
		await context.setOffline(true);
		await page.evaluate(() => dispatchEvent(new Event('offline')));
		await page.getByLabel('Client code (from your tailor)').pressSequentially('ZZ9999');
		await page.locator('input[inputmode=decimal]').click();
		await expect(page.getByText('We will check this code when you are online.')).toBeVisible();
		await context.setOffline(false);
		await page.evaluate(() => dispatchEvent(new Event('online')));
		await page.locator('input[inputmode=decimal]').fill('160');
		await page.getByRole('radio', { name: 'Female' }).check();
		await page.getByRole('button', { name: 'Continue', exact: true }).click();
		await page.waitForURL('**/consent');
		for (const cb of await page.getByRole('checkbox').all()) await cb.check();
		await page.getByRole('button', { name: 'Open camera' }).click();
		await page.getByRole('button', { name: 'Continue', exact: true }).click();
		await page.getByRole('button', { name: 'Yes, it is right' }).click();
		await page.getByRole('button', { name: 'Continue', exact: true }).click();
		await page.getByRole('button', { name: "I'm ready — start" }).click();
		await finishCapture(page);
		await page.getByRole('button', { name: T.en.save }).click();
		await expect(
			page.getByText("Your tailor's code could not be found. Check the code with your tailor.")
		).toBeVisible({ timeout: 15_000 });
		await page.getByRole('button', { name: 'Change code' }).click();
		await page
			.getByRole('dialog')
			.getByLabel('Client code (from your tailor)')
			.pressSequentially('QT1200');
		await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
		await expect(page.getByRole('status').getByText('Saved and sent to your tailor')).toBeVisible({
			timeout: 15_000
		});
	});

	test('My measurements: survives reload, then "Delete my data" with double confirm', async ({
		page
	}) => {
		await runToReview(page);
		await finishCapture(page);
		await page.getByRole('button', { name: T.en.save }).click();
		await page.waitForURL('**/saved**');
		await open(page, '/me');
		await expect(page.getByRole('link', { name: /QT1200/ })).toHaveCount(1);
		await page.reload();
		await page.getByRole('link', { name: /QT1200/ }).click();
		await page.getByRole('button', { name: 'Delete my data' }).click();
		await page.getByRole('dialog').getByRole('button', { name: 'Yes, delete' }).click();
		await page.getByRole('dialog').getByRole('button', { name: 'Delete for good' }).click();
		await page.waitForURL('**/me');
		await expect(page.getByText('No measurements saved on this phone.')).toBeVisible();
	});

	test('privacy: no image, binary or large body leaves the phone; only app + API origins (NFR-10)', async ({
		page,
		baseURL
	}) => {
		const bad: string[] = [];
		const origin = new URL(baseURL!).origin;
		page.on('request', (r: Request) => {
			const url = new URL(r.url());
			if (url.protocol.startsWith('http') && url.origin !== origin)
				bad.push(`origin ${url.origin}`);
			const body = r.postDataBuffer();
			if (!body) return;
			const ct = r.headers()['content-type'] ?? '';
			const text = body.toString('utf8');
			if (/image\/|octet-stream|multipart/i.test(ct)) bad.push(`content-type ${ct}`);
			if (text.includes('data:image')) bad.push('data:image');
			if (body.length > 200_000) bad.push(`large body ${body.length}`);
			if (ct.includes('json')) JSON.parse(text);
		});
		await runToReview(page);
		await finishCapture(page);
		await page.getByRole('button', { name: T.en.save }).click();
		await expect(page.getByRole('status').getByText('Saved and sent to your tailor')).toBeVisible({
			timeout: 15_000
		});
		expect(bad).toEqual([]);
	});

	test('privacy: captured buffers are released once the review ends (invariant 2)', async ({
		page
	}) => {
		await runToReview(page);
		await finishCapture(page);
		await page.getByRole('button', { name: T.en.save }).click();
		await page.waitForURL('**/saved**');
		expect(
			await page.evaluate(() =>
				(window as unknown as { __vt: { liveCaptureBuffers(): number } }).__vt.liveCaptureBuffers()
			)
		).toBe(0);
	});

	test('nothing image-like is stored in IndexedDB after a save', async ({ page }) => {
		await runToReview(page);
		await finishCapture(page);
		await page.getByRole('button', { name: T.en.save }).click();
		await page.waitForURL('**/saved**');
		const dump = await page.evaluate(
			() =>
				new Promise<string>((resolve) => {
					const req = indexedDB.open('virtual-tailor');
					req.onsuccess = () => {
						const db = req.result;
						const tx = db.transaction(['profiles', 'settings', 'pending_sync']);
						const out: unknown[] = [];
						let left = 3;
						for (const s of ['profiles', 'settings', 'pending_sync']) {
							const g = tx.objectStore(s).getAll();
							g.onsuccess = () => {
								out.push(g.result);
								if (--left === 0) resolve(JSON.stringify(out));
							};
						}
					};
				})
		);
		expect(dump).not.toContain('data:image');
		expect(dump.length).toBeLessThan(200_000);
	});
});

test.describe('Phase 2: accessibility of client routes', () => {
	for (const lang of ['en', 'sw'] as const) {
		test(`axe on every client route (${lang})`, async ({ page }) => {
			test.setTimeout(90_000);
			await useFakeVision(page, 'perfect', 0.15, lang);
			const scan = async (label: string) => {
				const r = await new AxeBuilder({ page })
					.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
					.analyze();
				const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
				expect(
					bad,
					`${label}: ${JSON.stringify(bad.map((v) => ({ id: v.id, n: v.nodes.map((x) => x.target) })))}`
				).toEqual([]);
				await expect(page.locator('h1'), label).toHaveCount(1);
			};
			for (const path of ['/', '/start', '/declined', '/help', '/privacy', '/me']) {
				await open(page, path);
				await scan(path);
			}
			await runToReview(page, { lang });
			await page.waitForTimeout(800);
			await scan('/capture/front');
			await finishCapture(page);
			await scan('/review');
		});
	}
});
