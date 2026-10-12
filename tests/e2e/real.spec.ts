import { expect, test, type Request } from '@playwright/test';
import { open } from './helpers';

/**
 * Real capture pipeline (Phase 3) with Chromium's fake camera. The clip shows a
 * wall and the measuring sheet but no person, so: camera opens, models load from
 * the self-hosted cache, OpenCV finds the sheet, MediaPipe finds no pose.
 * Real people are measured on phones (docs/device-test-log.md).
 */
test.setTimeout(180_000);
// Heavy (WASM inference on software WebGL): run one at a time.
test.describe.configure({ mode: 'serial' });

test('real pipeline: download, camera, workers, live checks, release, no uploads', async ({
	page,
	baseURL
}) => {
	const origin = new URL(baseURL!).origin;
	const bad: string[] = [];
	page.on('request', (r: Request) => {
		const u = new URL(r.url());
		if (u.protocol.startsWith('http') && u.origin !== origin) bad.push(`origin ${u.origin}`);
		const body = r.postDataBuffer();
		if (
			body &&
			(body.length > 200_000 ||
				/image\//.test(r.headers()['content-type'] ?? '') ||
				body.toString('utf8').includes('data:image'))
		)
			bad.push(`body ${r.url()}`);
	});
	await page.addInitScript(() => {
		// Test-only shim: Chromium's fake camera reports no facing mode; a phone's rear
		// camera reports 'environment'. The app's rear-camera check stays strict.
		const orig = MediaStreamTrack.prototype.getSettings;
		MediaStreamTrack.prototype.getSettings = function () {
			return { ...orig.call(this), facingMode: 'environment' };
		};
		localStorage.setItem(
			'vt.vision',
			JSON.stringify({ mode: 'real', scenario: 'happy', timeScale: 0.2 })
		);
		localStorage.setItem('vt.lang', 'en');
	});
	await open(page, '/start?code=QT1200');
	await page.getByRole('radio', { name: 'Female' }).check();
	await page.locator('input[inputmode=decimal]').fill('165');
	await page.getByRole('button', { name: 'Continue', exact: true }).click();
	await page.waitForURL('**/consent');
	for (const cb of await page.getByRole('checkbox').all()) await cb.check();
	await page.getByRole('button', { name: 'Open camera' }).click();
	await page.waitForURL('**/check');
	await expect(page.getByText(/Will download about \d+ MB/)).toBeVisible({ timeout: 15_000 });
	await page.getByRole('button', { name: 'Continue', exact: true }).click();
	await page.getByRole('button', { name: 'Yes, it is right' }).click();
	await page.getByRole('button', { name: 'Continue', exact: true }).click();
	await page.waitForURL('**/setup');

	// Download only after the tap, with progress (UX principle 10).
	await expect(page.getByText(/download about \d+ MB once/)).toBeVisible();
	await page.getByRole('button', { name: 'Download now' }).click();
	await expect(page.getByText('Done. You can now measure without internet.')).toBeVisible({
		timeout: 90_000
	});
	await page.getByRole('button', { name: 'Allow camera' }).click();
	await expect(page.getByText('Camera allowed')).toBeVisible({ timeout: 15_000 });
	const start = page.getByRole('button', { name: "I'm ready — start" });
	await expect(start).toBeEnabled({ timeout: 10_000 }); // no motion sensor → level check skipped
	await start.click();
	await page.waitForURL('**/capture/front');

	// Live checks from the real workers: the sheet is found, no person is.
	const checks = page.getByRole('list', { name: 'Capture checks' });
	await expect(checks.getByRole('listitem').filter({ hasText: 'Sheet found' })).toContainText(
		'OK',
		{ timeout: 90_000 }
	);
	await expect(
		checks.getByRole('listitem').filter({ hasText: 'Whole body in frame' })
	).toContainText('Fix');
	await expect(page.locator('p.instruction')).toHaveText('Step into the outline');

	await page.screenshot({ path: 'docs/checkpoints/phase-3/real-capture-front-en-360x800.png' });

	// Leave capture: every frame bitmap is released (privacy invariant 2).
	await page.getByRole('button', { name: 'Stop measuring' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Stop' }).click();
	await page.waitForURL(/\/$/);
	expect(
		await page.evaluate(() =>
			(window as unknown as { __vt: { liveBitmaps(): number } }).__vt.liveBitmaps()
		)
	).toBe(0);
	expect(bad).toEqual([]);
});

test('marker worker finds the printed sheet at 150 mm scale (OpenCV.js ArUco)', async ({
	page
}) => {
	await open(page, '/');
	const r = await page.evaluate(async () => {
		const img = new Image();
		img.src = '/marker/vt-measuring-sheet-preview.svg';
		await img.decode();
		const c = new OffscreenCanvas(840, 1188);
		c.getContext('2d')!.drawImage(img, 0, 0, 840, 1188);
		const bitmap = await createImageBitmap(c);
		const w = new Worker('/workers/marker.worker.js');
		const call = (msg: object, transfer: Transferable[] = []) =>
			new Promise<{ ok: boolean; value: { found: boolean; side_px: number; ratio: number } }>(
				(res) => {
					w.onmessage = (e) => res(e.data);
					w.postMessage(msg, transfer);
				}
			);
		await call({ id: 1, op: 'init' });
		const out = await call({ id: 2, op: 'marker', bitmap }, [bitmap]);
		w.terminate();
		return out.value;
	});
	expect(r.found).toBe(true);
	// 840 px across 210 mm = 4 px/mm → 150 mm ≈ 600 px.
	expect(r.side_px).toBeGreaterThan(590);
	expect(r.side_px).toBeLessThan(610);
	expect(r.ratio).toBeLessThan(1.03);
});
