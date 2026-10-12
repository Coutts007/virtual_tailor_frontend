import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { fastMock, loginEn } from './helpers';

test.beforeEach(async ({ page }) => {
	await fastMock(page);
	await loginEn(page, 'admin@vt.test', /\/admin\/accounts$/);
});

async function axe(page: Page, label: string) {
	await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 10_000 });
	const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
	const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
	expect(
		bad,
		`${label}: ${JSON.stringify(bad.map((v) => [v.id, v.nodes.map((n) => n.target)]))}`
	).toEqual([]);
}

test.describe('Phase 6: administrator (Section 14)', () => {
	test('approve a pending tailor', async ({ page }) => {
		await expect(page.getByRole('tab', { name: /Pending/ })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		await page.getByRole('button', { name: 'Approve pending@vt.test' }).click();
		await expect(page.getByText('pending@vt.test approved.')).toBeVisible();
		await page.getByRole('tab', { name: /Active/ }).click();
		await expect(page.getByRole('tabpanel')).toContainText('pending@vt.test');
	});

	test('reject needs a reason; rejected shows under Disabled', async ({ page }) => {
		await page.getByRole('button', { name: 'Reject pending@vt.test' }).click();
		const dlg = page.getByRole('dialog', { name: 'Reject pending@vt.test?' });
		await dlg.getByRole('button', { name: 'Reject' }).click();
		await expect(dlg.getByText('This is required')).toBeVisible();
		await dlg.getByLabel(/Reason/).fill('Not a tailoring business');
		await dlg.getByRole('button', { name: 'Reject' }).click();
		await page.getByRole('tab', { name: /Disabled/ }).click();
		await expect(page.getByRole('tabpanel')).toContainText('Not a tailoring business');
	});

	test('bulk approve via selection', async ({ page }) => {
		await page.getByLabel('Select pending@vt.test').check();
		await page.getByRole('button', { name: 'Approve 1 selected' }).click();
		await expect(page.getByText('1 account approved.')).toBeVisible();
	});

	test('audit: filter and export CSV (download is logged)', async ({ page }) => {
		await page.getByRole('link', { name: 'Audit' }).first().click();
		await expect(page.getByRole('heading', { level: 1, name: 'Audit log' })).toBeVisible();
		await page.getByLabel('Action').selectOption('login');
		await expect(page.getByRole('table')).toContainText('Signed in');
		const [download] = await Promise.all([
			page.waitForEvent('download'),
			page.getByRole('button', { name: 'Export CSV' }).click()
		]);
		expect(download.suggestedFilename()).toMatch(/^vt-audit-\d{4}-\d{2}-\d{2}\.csv$/);
		const body = readFileSync((await download.path())!, 'utf8');
		expect(body.split('\n')[0]).toBe(
			'log_id,occurred_at,user_email,role,action,entity_type,entity_id,summary'
		);
		await page.getByLabel('Action').selectOption('export');
		await expect(page.getByRole('table')).toContainText('Audit CSV');
	});

	test('settings: retention, study mode off hides the Study section', async ({ page }) => {
		await page.getByRole('link', { name: 'Settings' }).first().click();
		await expect(page.getByText('Consent version served: 1.0')).toBeVisible();
		await page.getByLabel('Keep client measurements for').fill('36');
		await page.getByRole('button', { name: 'Save', exact: true }).click();
		await expect(page.getByText('Settings saved.', { exact: false })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Study' }).first()).toBeVisible();
		await page.getByRole('button', { name: 'Turn study mode off' }).click();
		await page.getByRole('dialog').getByRole('button', { name: 'Turn study mode off' }).click();
		await expect(page.getByText('Study mode is off', { exact: true })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Study' })).toHaveCount(0);
		await page.goto('/admin/study/participants');
		await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
	});

	test('deletion requests are listed', async ({ page }) => {
		await page.goto('/admin/settings');
		await expect(page.getByRole('table')).toContainText('Withdraw consent');
		await expect(page.getByRole('table')).toContainText('GK7788');
	});

	test('study: enrol next participant, create measurer, download both exports', async ({
		page
	}) => {
		await page.getByRole('link', { name: 'Study' }).first().click();
		await expect(page.getByRole('heading', { level: 1, name: 'Study participants' })).toBeVisible();
		await expect(page.getByLabel('Participant code')).toHaveValue('P006');
		await page.getByText('Female', { exact: true }).click();
		await page.getByRole('button', { name: 'Enrol', exact: true }).click();
		await expect(page.getByText(/P006 enrolled with client code SP\d{4}/)).toBeVisible();
		await expect(page.getByText('Capture sets: 3 of 3')).toBeVisible();

		await page.getByRole('link', { name: 'Measurers' }).click();
		await page.getByLabel('Email').fill('measurer-c@vt.test');
		await page.getByLabel('Starting password').fill('long enough pass');
		await page.getByLabel('Measurer code').fill('c');
		await page.getByRole('button', { name: 'Create measurer account' }).click();
		await expect(page.getByText('Measurer C created.')).toBeVisible();
		await expect(page.locator('.info').getByText('measurer-c@vt.test')).toBeVisible();

		await page.getByRole('link', { name: 'Exports' }).click();
		await expect(page.getByText('Disabled pending ethics approval.')).toBeVisible();
		for (const [button, header] of [
			['Download capture records (CSV)', 'participant_code,set_no,captured_at'],
			['Download reference readings (CSV)', 'participant_code,site_code,measurer_code']
		] as const) {
			const [dl] = await Promise.all([
				page.waitForEvent('download'),
				page.getByRole('button', { name: button }).click()
			]);
			expect(readFileSync((await dl.path())!, 'utf8').startsWith(header)).toBe(true);
		}
		await expect(page.getByText(/Downloaded \d+ rows?\./)).toBeVisible();
	});

	for (const lang of ['en', 'sw']) {
		test(`axe: admin routes (${lang})`, async ({ page }) => {
			test.setTimeout(120_000);
			if (lang === 'sw')
				await page
					.getByRole('group', { name: /Language|Lugha/ })
					.first()
					.getByRole('button', { name: 'Kiswahili' })
					.click();
			for (const path of [
				'/admin/accounts',
				'/admin/audit',
				'/admin/settings',
				'/admin/study/participants',
				'/admin/study/measurers',
				'/admin/study/export'
			]) {
				await page.goto(path);
				await page.locator('h1').first().waitFor();
				await axe(page, path);
			}
		});
	}
});
