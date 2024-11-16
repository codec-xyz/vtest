import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		csp: {
			directives: {
				'script-src': ['self']
			},
		},
		paths: {
			relative: false,
		},
		alias: {
			$lib: path.resolve(__dirname, './src/lib')
		},
		adapter: adapter({
			// SPA (Single-page application)
			// https://kit.svelte.dev/docs/single-page-apps
			fallback: '200.html',

			pages: '.vite/renderer/main_window',
			assets: '.vite/renderer/main_window',
		})
	}
};

export default config;
