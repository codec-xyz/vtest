import { PluginBase } from '@electron-forge/plugin-base';
import type { ForgeMultiHookMap, StartResult, StartOptions } from '@electron-forge/shared-types';
import { PRESET_TIMER } from 'listr2';
import vite from 'vite';
import type { RollupWatcher } from 'rollup';

export enum OnRebuildDo {
	Nothing = 'Nothing', RestartApp = 'RestartApp', RestartRenderers = 'RestartRenderers'
}

export type Config = {
	/**
	 * Vite config files whose targets need to be built to a file during dev mode.
	 * During dev mode these will be built and rebuilt every time a change occurs.
	 * 
	 * During dev mode this plugin will add the renderer names and dev server urls
	 * to the vite defines of these configs. (See renderers.names of this config to see more)
	 */
	builds: {
		configFile: string,
		onRebuild: OnRebuildDo,
	}[],

	/**
	 * Vite config files of renderers. Will start as a regular dev server during dev.
	 */
	renderers: {
		configFile: string,
		/**
		 * Used as the key to an object containing the Vite dev server urls for all renderers.
		 * If not in dev mode then this is an empty object. The value may look something like this...
		 * ```
		 * {
		 * 	['main_window']: 'http://localhost:5173/'
		 * }
		 * ```
		 */
		name: string,
	}[],
};

/**
 * Electron forge plugin adding vite functionality
 * https://www.electronforge.io/advanced/extending-electron-forge/writing-plugins
 */
export class ElectronForgeVitePlugin extends PluginBase<Config> {
	name = 'electron-forge-vite-plugin';

	instanceRunning = false;
	servers: vite.ViteDevServer[] = [];
	watchers: RollupWatcher[] = [];

	constructor(config: Config) {
		super(config);
		this.startLogic = this.startLogic.bind(this);
	}

	getHooks = (): ForgeMultiHookMap => ({
		/**
		 * "called before Forge runs Electron Packager in the package step"
		 * https://www.electronforge.io/config/hooks#prepackage
		 */
		prePackage: async (_config, platform, version) => {
			await Promise.all([
				...this.config.builds.map(info => vite.build({ configFile: info.configFile })),
				...this.config.renderers.map(info => vite.build({ configFile: info.configFile })),
			]);
		},

		/**
		 * "called after Forge's start command launches the app in dev mode"
		 * the child process is the electron window
		 * https://www.electronforge.io/config/hooks#poststart
		 */
		postStart: async (_config, child) => {
			child.on('exit', () => {
				// stops the dev mode process when the window is closed
				// child.restarted is true when the electron process is restarted
				// using `process.stdin.emit('data', 'rs');`
				if (!child.restarted) process.exit();
			});
		},
	});

	async viteDevWatcherAndBuilder(info: Config['builds'][number], devServerUrls: Record<string, string>): Promise<RollupWatcher> {
		// Await first build before returning to avoid trying to run a file before it exists.
		return await new Promise(async (res, _) => {
			const rollupWatcher = await vite.build({
				configFile: info.configFile,
				build: { watch: {} },
				plugins: [{
					name: 'electron-forge-vite-plugin:build-done',
					closeBundle: () => {
						if(info.onRebuild === OnRebuildDo.RestartApp) {
							// Main process hot restart.
							// https://github.com/electron/forge/blob/v7.2.0/packages/api/core/src/api/start.ts#L216-L223
							process.stdin.emit('data', 'rs');
						}
						else if(info.onRebuild === OnRebuildDo.RestartRenderers) {
							for(const server of this.servers) {
								server.ws.send({ type: 'full-reload' });
							}
						}

						res(rollupWatcher);
					},
				}],
				define: { VITE_DEV_SERVER_URLS: JSON.stringify(devServerUrls) },
			}) as RollupWatcher;
		});
	}

	async startLogic(_startOpts: StartOptions): Promise<StartResult> {
		// Guard to stop stop multiple vite dev serves from starting.
		// `startLogic` is called when running `electron-forge start`
		// and then every time the electron process is restarted which
		// happens to hot reloading the main electron process.
		if(this.instanceRunning) return false;
		this.instanceRunning = true;

		process.on('exit', (_code) => {
			for(const server of this.servers) server.close();
			for(const watcher of this.watchers) watcher.close();
		});

		const devServerUrls: Record<string, string> = {};

		return {
			tasks: [{
				title: 'Starting renderer dev servers (config.renderers)',
				task: () => Promise.all(this.config.renderers.map(async info => {
					const viteDevServer = await vite.createServer({ configFile: info.configFile });
					await viteDevServer.listen();
					viteDevServer.printUrls();
					
					const address = viteDevServer.httpServer?.address();
					if(address !== undefined && address !== null && typeof address !== 'string') {
						devServerUrls[info.name] = `http://localhost:${address.port}`;
					}

					this.servers.push(viteDevServer);
				})),
				rendererOptions: { persistentOutput: true, timer: { ...PRESET_TIMER } },
			}, {
				title: 'Starting main/preload process watchers and builders (config.builds)',
				task: () => Promise.all(this.config.builds.map(async info => {
					const watcher = await this.viteDevWatcherAndBuilder(info, devServerUrls);
					this.watchers.push(watcher);
				})),
				rendererOptions: { persistentOutput: true, timer: { ...PRESET_TIMER } },
			}],
			result: false,
		}
	};
}