import { readFileSync } from 'node:fs';
import { sveltekit } from '@sveltejs/kit/vite';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * Serve MSW's worker script from the dev server only, so production builds
 * never ship the mock backend (Section 5).
 */
function mswDevWorker(): Plugin {
	return {
		name: 'vt-msw-dev-worker',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use('/mockServiceWorker.js', (_req, res) => {
				res.setHeader('Content-Type', 'application/javascript');
				res.setHeader('Service-Worker-Allowed', '/');
				res.end(readFileSync('mocks/public/mockServiceWorker.js'));
			});
		}
	};
}

export default defineConfig({
	plugins: [mswDevWorker(), sveltekit()],
	server: { port: 5173 },
	optimizeDeps: { include: ['dexie', 'msw/browser'] },
	test: {
		include: ['tests/unit/**/*.test.ts', 'src/**/*.test.ts'],
		environment: 'node',
		setupFiles: ['tests/unit/setup.ts'],
		coverage: { include: ['src/lib/measure/**'] }
	}
});
