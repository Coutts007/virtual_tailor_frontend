import { defineConfig, devices } from '@playwright/test';

/**
 * Production-build checks (Section 21): serves build/ like a static host would
 * (scripts/serve-build.mjs) with the security headers from build/_headers.
 * Run `npm run build` first. No mock backend exists in this build.
 */
const PORT = Number(process.env.VT_PROD_PORT ?? 4180);

export default defineConfig({
	testDir: 'tests/prod',
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI
		? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report-prod' }]]
		: 'list',
	use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
	webServer: {
		command: `node scripts/serve-build.mjs ${PORT}`,
		url: `http://localhost:${PORT}`,
		reuseExistingServer: false
	},
	projects: [
		{ name: 'prod-phone', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 800 } } }
	]
});
