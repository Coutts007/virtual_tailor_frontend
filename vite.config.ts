import { existsSync, readFileSync } from 'node:fs';
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

/** Privacy guard: the mock backend must never ship (Section 5). */
function noMockInBuild(): Plugin {
	return {
		name: 'vt-no-mock-in-build',
		apply: 'build',
		buildStart() {
			if (existsSync('static/mockServiceWorker.js'))
				this.error('static/mockServiceWorker.js exists and would ship to production. Delete it.');
		}
	};
}

function previewHeaders(): Record<string, string> {
	try {
		return JSON.parse(readFileSync('build/security-headers.json', 'utf8'));
	} catch {
		return {};
	}
}

export default defineConfig({
	plugins: [mswDevWorker(), noMockInBuild(), sveltekit()],
	server: { port: 5173 },
	// Production preview serves the same security headers the host must send (Section 19).
	preview: { headers: previewHeaders() },
	optimizeDeps: { include: ['dexie', 'msw/browser'] },
	test: {
		include: ['tests/unit/**/*.test.ts', 'src/**/*.test.ts'],
		environment: 'node',
		setupFiles: ['tests/unit/setup.ts'],
		coverage: {
			include: ['src/lib/measure/**'],
			// NFR-13: the measurement module stays ≥ 90% covered.
			thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 }
		}
	}
});
