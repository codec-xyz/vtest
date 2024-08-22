import { external, VitePlugin_ReloadRenderers, ElectronForgeVite } from './vite.base.config';

export default ElectronForgeVite.defineConfig<'build'>((env) => {
	const { root, mode, command } = env;

	return {
		root,
		mode,
		build: {
			outDir: '.vite/build/preload',

			watch: command === 'serve' ? {} : null,
			minify: command === 'build',

			rollupOptions: {
				external,
				// Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
				input: env.forgeConfigSelf.entry!,
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
		plugins: [VitePlugin_ReloadRenderers()],
		clearScreen: false,
	};
});