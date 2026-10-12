import { defineConfig, devices } from '@playwright/test';

/**
 * E2E runs against the Vite dev server in mock mode (MSW). Later phases add the
 * fake-camera Chromium project and a WebKit project (Section 21.1).
 */
/** Port is configurable so parallel worktrees and a running dev server do not collide. */
const PORT = Number(process.env.VT_PORT ?? 5173);

export default defineConfig({
	globalSetup: './tests/e2e/global-setup.ts',
	testDir: 'tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: `http://localhost:${PORT}`,
		trace: 'retain-on-failure',
		locale: 'en-KE',
		timezoneId: 'Africa/Nairobi'
	},
	webServer: {
		command: `npm run dev -- --port ${PORT} --strictPort`,
		url: `http://localhost:${PORT}`,
		reuseExistingServer: !process.env.CI && !process.env.VT_PORT,
		env: { VITE_API_MODE: 'mock' }
	},
	projects: [
		{
			// Real pipeline (Section 21.1): Chromium fake camera fed a Y4M clip with the marker.
			name: 'real-camera',
			testMatch: /real\.spec\.ts/,
			use: {
				...devices['Pixel 7'],
				viewport: { width: 360, height: 800 },
				permissions: ['camera'],
				launchOptions: {
					args: [
						'--use-fake-ui-for-media-stream',
						'--use-fake-device-for-media-stream',
						'--use-file-for-fake-video-capture=test-results/fixtures/marker-1080x1920.y4m',
						'--enable-unsafe-swiftshader'
					]
				}
			}
		},
		{
			name: 'phone',
			testIgnore: /real\.spec\.ts/,
			use: { ...devices['Pixel 7'], viewport: { width: 360, height: 800 } }
		},
		{
			name: 'desktop',
			testIgnore: /real\.spec\.ts/,
			use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } }
		}
	]
});
