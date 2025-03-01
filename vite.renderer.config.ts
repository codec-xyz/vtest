import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

//https://vitejs.dev/config
export default defineConfig({
	server: {
		fs: {
			allow: [ './src-renderer' ],
		}
	},
	plugins: [
		tailwindcss(),
		sveltekit(),
	],
	clearScreen: false,
});