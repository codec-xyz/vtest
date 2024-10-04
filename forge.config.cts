import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { ElectronForgeVitePlugin, OnRebuildDo } from './electronForgeVitePlugin.cts';
import { type ForgeConfig } from '@electron-forge/shared-types';

const config: ForgeConfig = {
	// https://electron.github.io/packager/main/interfaces/Options.html
	packagerConfig: {
		asar: true,
		ignore: (file: string) => {
			if(file === '') return false;
			if(file.startsWith('/package.json')) return false;
			if(file.startsWith('/node_modules/.bin')) return true;
			if(file.startsWith('/node_modules/.vite')) return true;
			if(file.startsWith('/node_modules')) return false;
			if(file.startsWith('/.vite')) return false;

			return true;
		},
		// "Walks the node_modules dependency tree to remove all of the packages specified in the devDependencies
		// section of package.json from the outputted Electron app. Defaults to true."
		prune: true,
		icon: './static/icon',
	},
	rebuildConfig: {},
	makers: [
		new MakerSquirrel({
			// A URL to an ICO file to use as the application icon (displayed in Control Panel > Programs and Features).
			//iconUrl: 'https://url/to/icon.ico',
			// The ICO file to use as the icon for the generated Setup.exe
			setupIcon: './static/icon.ico'
      }),
	  new MakerZIP({}, ['darwin']),
	  new MakerRpm({}),
	  new MakerDeb({
			options: {
				// Path to a single image that will act as icon for the application
				icon: './static/icon.png',
			}
		}),
	],
	plugins: [
		new ElectronForgeVitePlugin({
			builds: [{
				configFile: './vite/vite.main.config.ts',
				onRebuild: OnRebuildDo.RestartApp,
			},{
				configFile: './vite/vite.preload.config.ts',
				onRebuild: OnRebuildDo.RestartRenderers,
			}],
			renderers: [{
				configFile: './vite/vite.renderer.config.ts',
				name: 'main_window',
			}],
		}),
		// Fuses are used to enable/disable various Electron functionality
		// at package time, before code signing the application
		new FusesPlugin({
			version: FuseVersion.V1,
			[FuseV1Options.RunAsNode]: false,
			[FuseV1Options.EnableCookieEncryption]: true,
			[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
			[FuseV1Options.EnableNodeCliInspectArguments]: false,
			[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
			[FuseV1Options.OnlyLoadAppFromAsar]: true,
		}),
	],
};

export default config;
