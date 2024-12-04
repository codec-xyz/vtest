import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';

export default defineConfig({
	build: {
		outDir: '.vite/preload',
		minify: 'esbuild',
		rollupOptions: {
			external: ['electron', ...builtinModules.map((m) => [m, `node:${m}`]).flat()],
			// Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
			// Also `build.rollupOptions.input` allows for multiple entry points.
			// https://rollupjs.org/configuration-options/#input
			input: {
				'preload': './src-renderer/preload.ts'
			},
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