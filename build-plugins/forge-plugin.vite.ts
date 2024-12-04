import { PluginBase } from '@electron-forge/plugin-base';
import type { ForgeMultiHookMap, StartResult, StartOptions, ResolvedForgeConfig } from '@electron-forge/shared-types';
import { PRESET_TIMER } from 'listr2';
import * as vite from 'vite';
import type { RollupWatcher } from 'rollup';
import path from 'path';
import { rebuild } from '@electron/rebuild';
import { readdir, readFile, writeFile, rm, cp } from 'node:fs/promises';
import { spawn, SpawnOptionsWithoutStdio } from "child_process";

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
		 * The object may look something like this if you set the name to `'main_window'`...
		 * ```
		 * {
		 * 	['main_window']: 'http://localhost:5173/'
		 * }
		 * ```
		 */
		name: string,
	}[],
};

function objectKeepOnly(obj: { [key: string]: any }, keys: string[]): { [key: string]: any } {
	const out: { [key: string]: any } = {};

	for(const key of keys) {
		if(!(key in obj)) continue;
		out[key] = obj[key];
	}

	return out;
}

async function viteRun(args: string[], options?: SpawnOptionsWithoutStdio) {
	const vitePath = path.join(process.cwd(), './node_modules/.bin/vite');
	const viteProcess = spawn(vitePath, args, options);

	await new Promise<void>(resolve => {
		viteProcess.on('close', resolve);
	});
}


async function deleteFolderContents_exclude(folderPath: string, exclude: string[]) {
	const items = await readdir(folderPath);
	await Promise.all(items.map(async item => {
		if(exclude.includes(item)) return;
		await rm(path.join(folderPath, item), { recursive: true });
	}));
}

async function packageAfterCopy(forgeConfig: ResolvedForgeConfig, config: Config, buildPath: string, electronVersion: string, platform: string, arch: string) {
	await rm(path.join(buildPath, './.vite'), { force: true, recursive: true });

	await rebuild({
		...forgeConfig.rebuildConfig,
		buildPath, electronVersion, arch,
	});

	await Promise.all(
		[...config.builds, ...config.renderers].map(info => viteRun([
			'build',
			'-c',
			path.join(buildPath, info.configFile),
		], { cwd: buildPath, shell: true })),
	)

	await deleteFolderContents_exclude(buildPath, ['package.json', '.vite']);

	const packagePath = path.join(buildPath, 'package.json');
	const packageJson = JSON.parse((await readFile(packagePath)).toString());
	const cleanPackageJson = objectKeepOnly(packageJson, [
		"name", "productName", "version", "description", "main", "type", "author", "license",
	]);
	await writeFile(packagePath, JSON.stringify(cleanPackageJson, undefined, '\t'));

	// https://patorjk.com/software/taag/#p=display&h=0&f=Stop&t=Electron%20Forge%0APackage%20Complete
	console.log('@###+!+:     _______  _                                              _______                                           ');
	console.log('@@#++!::.   (_______)| |               _                            (_______)                                          ');
	console.log('@###!!+:     _____   | |  ____   ____ | |_    ____   ___   ____      _____   ___    ____   ____   ____                 ');
	console.log('@@#++!::    |  ___)  | | / _  ) / ___)|  _)  / ___) / _ \\ |  _ \\    |  ___) / _ \\  / ___) / _  | / _  )                ');
	console.log('@###+:+:.   | |_____ | |( (/ / ( (___ | |__ | |    | |_| || | | |   | |    | |_| || |    ( ( | |( (/ /                 ');
	console.log('@@#+++::.   |_______)|_| \\____) \\____) \\___)|_|     \\___/ |_| |_|   |_|     \\___/ |_|     \\_|| | \\____)                ');
	console.log('@@##+!+:                                                                                 (_____|                       ');
	console.log('@##+++:.     ______                _                               ______                       _                     ');
	console.log('@##+::+:.   (_____ \\              | |                             / _____)                     | |        _           ');
	console.log('@@##+!::     _____) ) ____   ____ | |  _   ____   ____   ____    | /        ___   ____   ____  | |  ____ | |_    ____ ');
	console.log('@###+!+:.   |  ____/ / _  | / ___)| | / ) / _  | / _  | / _  )   | |       / _ \\ |    \\ |  _ \\ | | / _  )|  _)  / _  )');
	console.log('@@#++:::    | |     ( ( | |( (___ | |< ( ( ( | |( ( | |( (/ /    | \\_____ | |_| || | | || | | || |( (/ / | |__ ( (/ / ');
	console.log('@###:++:.   |_|      \\_||_| \\____)|_| \\_) \\_||_| \\_|| | \\____)    \\______) \\___/ |_|_|_|| ||_/ |_| \\____) \\___) \\____)');
	console.log('@##++!::.                                       (_____|                                 |_|                          ');
}

async function viteDevBuilder(info: Config['builds'][number], rendererServers: { name: string, server: vite.ViteDevServer, url: string, }[]): Promise<RollupWatcher> {
	const rendererServerUrls: Record<string, string> = {};
	for(const server of rendererServers) rendererServerUrls[server.name] = server.url;

	// Await first build before returning to avoid trying to run a file before it exists.
	return new Promise(async (resolve, _) => {
		const rollupWatcher = await vite.build({
			configFile: info.configFile,
			build: { watch: {} },
			plugins: [{
				name: 'forge-plugin-vite:build-done',
				closeBundle: () => {
					if(info.onRebuild === OnRebuildDo.RestartApp) {
						// Main process hot restart.
						// https://github.com/electron/forge/blob/v7.2.0/packages/api/core/src/api/start.ts#L216-L223
						process.stdin.emit('data', 'rs');
					}
					else if(info.onRebuild === OnRebuildDo.RestartRenderers) {
						for(const server of rendererServers) {
							server.server.ws.send({ type: 'full-reload' });
						}
					}

					resolve(rollupWatcher);
				},
			}],
			define: { VITE_DEV_SERVER_URLS: JSON.stringify(rendererServerUrls) },
		}) as RollupWatcher;
	});
}

async function viteDevRendererServer(info: Config['renderers'][number]): Promise<{ name: string, server: vite.ViteDevServer, url: string }> {
	const server = await vite.createServer({ configFile: info.configFile });
	await server.listen();
	server.printUrls();

	const address = server.httpServer?.address();
	let url = '';
	if(typeof address === 'object' && address !== null) url = `http://localhost:${address.port}`;
	else if(typeof address === 'string') url = address;

	return { name: info.name, server, url };
}

/**
 * Electron forge plugin adding vite functionality
 * https://www.electronforge.io/advanced/extending-electron-forge/writing-plugins
 */
export class ForgePlugin_Vite extends PluginBase<Config> {
	name = 'electron-forge-vite-plugin';

	constructor(config: Config) {
		super(config);
		this.startLogic = this.startLogic.bind(this);
	}

	getHooks = (): ForgeMultiHookMap => ({
		packageAfterCopy: async (forgeConfig, buildPath, electronVersion, platform, arch) =>
			packageAfterCopy(forgeConfig, this.config, buildPath, electronVersion, platform, arch),

		/**
		 * "called after Forge's start command launches the app in dev mode"
		 * the child process is the electron window
		 * https://www.electronforge.io/config/hooks#poststart
		 */
		postStart: async (config, child) => {
			child.on('exit', () => {
				// stops the dev mode process when the window is closed
				// child.restarted is true when the electron process is restarted
				// using `process.stdin.emit('data', 'rs');`
				if (!child.restarted) process.exit();
			});
		},
	});

	instanceRunning = false;

	async startLogic(_startOpts: StartOptions): Promise<StartResult> {
		// Guard to stop stop multiple vite dev serves from starting.
		// `startLogic` is called when running `electron-forge start`
		// and then every time the electron process is restarted which
		// happens to hot reload the main electron process.
		if(this.instanceRunning) return false;
		this.instanceRunning = true;

		rm(path.resolve('./.vite'), { force: true, recursive: true });

		const rendererServers: { name: string, server: vite.ViteDevServer, url: string, }[] = [];
		const buildWatchers: RollupWatcher[] = [];

		process.on('exit', (_code) => {
			for(const server of rendererServers) server.server.close();
			for(const watcher of buildWatchers) watcher.close();
		});

		return {
			tasks: [{
				title: 'Starting renderer dev servers (config.renderers)',
				task: async() => {
					rendererServers.push(...await Promise.all(
						this.config.renderers.map(info => viteDevRendererServer(info))
					));
				},
				rendererOptions: { persistentOutput: true, timer: { ...PRESET_TIMER } },
			}, {
				title: 'Starting main/preload process watchers and builders (config.builds)',
				task: async() => {
					buildWatchers.push(...await Promise.all(
						this.config.builds.map(info => viteDevBuilder(info, rendererServers))
					));
				},
				rendererOptions: { persistentOutput: true, timer: { ...PRESET_TIMER } },
			}],
			result: false,
		}
	};
}