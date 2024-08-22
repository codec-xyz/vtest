import { external, ElectronForgeVite, getViteDevServerUrls, VitePlugin_RestartElectron } from './vite.base.config';

export default ElectronForgeVite.defineConfig<'build'>((env) => {
	const { root, mode, command } = env;

	return {
		root,
		mode,
		build: {
			outDir: '.vite/build/main',

			watch: command === 'serve' ? {} : null,
			minify: command === 'build',

			lib: {
				entry: env.forgeConfigSelf.entry!,
				fileName: () => '[name].js',
				formats: ['es'],
			},

			rollupOptions: {
				external,
			},
		},
		plugins: [VitePlugin_RestartElectron()],
		define: {
			VITE_DEV_SERVER_URLS: JSON.stringify(getViteDevServerUrls(env)),
		},
		resolve: {
			// Load the Node.js entry.
			mainFields: ['module', 'jsnext:main', 'jsnext'],
		},
		clearScreen: false,
	};
});