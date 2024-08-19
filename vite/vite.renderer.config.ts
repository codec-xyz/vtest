import type { ConfigEnv, UserConfig } from 'vite';
import { defineConfig } from 'vite';
import { pluginExposeRenderer } from './vite.base.config';

//https://vitejs.dev/config
export default defineConfig(async (env) => {
	const forgeEnv = env as ConfigEnv<'renderer'>;
	const { root, mode, forgeConfigSelf } = forgeEnv;
	const name = forgeConfigSelf.name ?? '';

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
			pluginExposeRenderer(name),
		],
		resolve: {
			preserveSymlinks: true,
		},
		clearScreen: false,
	} as UserConfig;
});