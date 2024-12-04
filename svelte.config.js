import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs#compile-time-svelte-preprocess
	// for more information about preprocessors
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

		files: {
			assets: 'static',
			lib: "src-renderer/lib",
			params: "src-renderer/params",
			routes: "src-renderer/routes",
			serviceWorker: "src-renderer/service-worker",
			appTemplate: "src-renderer/app.html",
			errorTemplate: "src-renderer/error.html",
		},

		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter({
			// SPA (Single-page application)
			// https://kit.svelte.dev/docs/single-page-apps
			fallback: '200.html',

			pages: '.vite/main_window',
			assets: '.vite/main_window',
		})
	}
};

export default config;
