import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// SPA mode: no server-side rendering in production (Section 5).
		adapter: adapter({ fallback: 'index.html', strict: true }),
		alias: {
			$mocks: 'mocks'
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
