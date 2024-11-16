import { defineConfig } from 'vite';
import { external } from './shared';

export default defineConfig({
	build: {
		outDir: '.vite/build/preload',
		minify: true,
		rollupOptions: {
			external,
			// Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
			input: './src/electron/preload.ts',
			output: {
				format: 'commonjs',
				// It should not be split chunks.
				inlineDynamicImports: true,
				entryFileNames: '[name].js',
				chunkFileNames: '[name].js',
				assetFileNames: '[name].[ext]',
			},
		},
	},
	resolve: {
		// Load the Node.js entry.
		mainFields: ['module', 'jsnext:main', 'jsnext'],
	},
	clearScreen: false,
});