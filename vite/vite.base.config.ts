import { builtinModules } from 'node:module';
import type { AddressInfo } from 'node:net';
import type { ConfigEnv as ViteConfigEnv, Plugin, UserConfig, ViteDevServer } from 'vite';
import { VitePluginConfig as ElectronForgeVitePluginConfig } from '@electron-forge/plugin-vite/src/Config';
import pkg from '../package.json';

export const builtins = ['electron', ...builtinModules.map((m) => [m, `node:${m}`]).flat()];

export const external = [...builtins, ...Object.keys('dependencies' in pkg ? (pkg.dependencies as Record<string, unknown>) : {})];

export namespace ElectronForgeVite {
	export interface ConfigEnv<K extends keyof ElectronForgeVitePluginConfig> extends ViteConfigEnv {
		root: string;
		forgeConfig: ElectronForgeVitePluginConfig;
		forgeConfigSelf: ElectronForgeVitePluginConfig[K][number];
	}
	
	type UserConfigFnObject<K extends keyof ElectronForgeVitePluginConfig> = (env: ConfigEnv<K>) => UserConfig;
	type UserConfigFnPromise<K extends keyof ElectronForgeVitePluginConfig> = (env: ConfigEnv<K>) => Promise<UserConfig>;
	type UserConfigFn<K extends keyof ElectronForgeVitePluginConfig> = (env: ConfigEnv<K>) => UserConfig | Promise<UserConfig>;
	type UserConfigExport<K extends keyof ElectronForgeVitePluginConfig> = UserConfig | Promise<UserConfig> | UserConfigFnObject<K> | UserConfigFnPromise<K> | UserConfigFn<K>;
	/**
	 * Type helper to make it easier to use vite.config.ts
	 * accepts a direct {@link UserConfig} object, or a function that returns it.
	 * The function receives a {@link ConfigEnv} object.
	 */
	export function defineConfig<K extends keyof ElectronForgeVitePluginConfig>(config: UserConfig): UserConfig
	export function defineConfig<K extends keyof ElectronForgeVitePluginConfig>(config: Promise<UserConfig>): Promise<UserConfig>
	export function defineConfig<K extends keyof ElectronForgeVitePluginConfig>(config: UserConfigFnObject<K>): UserConfigFnObject<K>
	export function defineConfig<K extends keyof ElectronForgeVitePluginConfig>(config: UserConfigExport<K>): UserConfigExport<K> {
		return config
	};
}

/**
 * Returns an object containing the Vite dev server urls for all renderers. If not dev mode returns
 * an empty object. This can be passed to Vite in `config.define` and then accessed inside `main.js`
 * to set the correct dev server url. The output may look something like this...
 * ```
 * {
 * 	['main_window']: 'http://localhost:5173/'
 * }
 * ```
 */
export function getViteDevServerUrls(env: ElectronForgeVite.ConfigEnv<'build'>): typeof VITE_DEV_SERVER_URLS {
	if(env.command !== 'serve') return {};

	const devServerUrls: Record<string, string> = {};
	for(const renderer of env.forgeConfig.renderer) {
		const name = renderer.name ?? '';
		const url = process.env[`VITE_DEV_SERVER_URL_${name.toUpperCase()}`];
		devServerUrls[name] = url ?? '';
	}

	return devServerUrls;
}

export const viteDevServers: Record<string, ViteDevServer> = {};

/**
 * Vite plugin
 * - Exposes the renderer dev server url in dev mode. Use with `getViteDevServerUrls` to access the exposed
 * dev server urls.
 * - Adds server to global `viteDevServers` in order to be reloaded along with the preload script.
 */
export function VitePlugin_ExposeRenderer(name: string): Plugin {
	const VITE_DEV_SERVER_URL = `VITE_DEV_SERVER_URL_${name.toUpperCase()}`

	return {
		name: '@electron-forge/plugin-vite:expose-renderer',
		configureServer(server) {
			// Expose server for preload scripts hot reload.
			viteDevServers[name] = server;

			server.httpServer?.once('listening', () => {
				const addressInfo = server.httpServer!.address() as AddressInfo;
				// Expose env constant for main process use.
				process.env[VITE_DEV_SERVER_URL] = `http://localhost:${addressInfo?.port}`;
			});
		},
	};
}

/**
 * Vite plugin - restarts electron whenever this Vite bundle is generated. Use this for your main Electron Node process
 * aka `main.js` for live reloading in dev mode.
 */
export function VitePlugin_RestartElectron(): Plugin {
	return {
		name: 'restart-electron',
		closeBundle() {
			// Main process hot restart.
			// https://github.com/electron/forge/blob/v7.2.0/packages/api/core/src/api/start.ts#L216-L223
			process.stdin.emit('data', 'rs');
		},
	};
}

/**
 * Vite plugin - reloads all renderers whenever this Vite bundle is generated. Use this for your preload
 * for live reloading in dev mode.
 */
export function VitePlugin_ReloadRenderers(): Plugin {
	return {
		name: 'reload-all-renderers',
		closeBundle() {
			for (const server of Object.values(viteDevServers)) {
				// Preload scripts hot reload.
				server.ws.send({ type: 'full-reload' });
			}
		},
	};
}