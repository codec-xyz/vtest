import type { UserConfig } from 'vite';
import { ElectronForgeVite, VitePlugin_ExposeRenderer } from './vite.base.config';

export default ElectronForgeVite.defineConfig<'renderer'>((env) => {
	const { root, mode } = env;

	return {
		// `vite.svelte.config.ts` needs to be a separate file because
		// sveltekit build requires having a `configFile` specified
		configFile: './vite/vite.svelte.config.ts',
		root,
		mode,
		// overridden by sveltekit
		// base: './',
		// build: {
		// 	outDir: `.vite/renderer/${name}`,
		// },
		plugins: [
			VitePlugin_ExposeRenderer(env.forgeConfigSelf.name ?? ''),
		],
		resolve: {
			preserveSymlinks: true,
		},
		clearScreen: false,
	} as UserConfig;
});