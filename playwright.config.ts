import { defineConfig, devices } from '@playwright/test';

/**
 * E2E runs against the Vite dev server in mock mode (MSW). Later phases add the
 * fake-camera Chromium project and a WebKit project (Section 21.1).
 */
export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: 'http://localhost:5173',
		trace: 'retain-on-failure',
		locale: 'en-KE',
		timezoneId: 'Africa/Nairobi'
	},
	webServer: {
		command: 'npm run dev -- --strictPort',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		env: { VITE_API_MODE: 'mock' }
	},
	projects: [
		{ name: 'phone', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 800 } } },
		{
			name: 'desktop',
			use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } }
		}
	]
});
