import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * Content-Security-Policy (Section 19). SvelteKit adds the SHA-256 of its one
 * inline bootstrap script to script-src (hash mode); scripts/security-headers.mjs
 * copies the final policy into build/_headers for the host, with frame-ancestors.
 */
const apiBase = process.env.VITE_API_BASE_URL ?? '/api/v1';
const apiOrigin = /^https?:\/\//.test(apiBase) ? [new URL(apiBase).origin] : [];

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// SPA mode: no server-side rendering in production (Section 5).
		adapter: adapter({ fallback: 'index.html', strict: true }),
		alias: {
			$mocks: 'mocks'
		},
		csp: {
			mode: 'hash',
			directives: {
				'default-src': ['self'],
				'script-src': ['self', 'wasm-unsafe-eval'],
				'worker-src': ['self', 'blob:'],
				'connect-src': ['self', ...apiOrigin],
				'img-src': ['self', 'blob:', 'data:'],
				'media-src': ['self', 'blob:'],
				'style-src': ['self', 'unsafe-inline'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'object-src': ['none']
			}
		},
		serviceWorker: {
			// Registered manually in src/lib/sw/register.ts so that MSW can own the
			// worker scope in mock mode during development.
			register: false
		}
	},
	compilerOptions: {
		runes: true
	}
};

export default config;
