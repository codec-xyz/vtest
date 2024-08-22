import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
const config = {
	packagerConfig: {
		asar: true,
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
		new VitePlugin({
			// `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
			// If you are familiar with Vite configuration, it will look really familiar.
			build: [{
					// `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
					entry: './src/main.ts',
					config: './vite/vite.main.config.ts',
				}, {
					entry: './src/preload.ts',
					config: './vite/vite.preload.config.ts',
				},
			],
			renderer: [{
					name: 'main_window',
					config: './vite/vite.renderer.config.ts',
				},
			],
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
