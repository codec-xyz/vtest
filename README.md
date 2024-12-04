# ***V***ite + ***T***ypescript + ***E***lectron Forge + ***S***velteKit + ***T***ailwind CSS

Template project with ***V***ite, ***T***ypescript, ***E***lectron Forge, ***S***velteKit, ***T***ailwind CSS

> [!Note]
>
> This template contains numerous comments with explanations and links throughout the source code.

![](readme001.png)

```
git clone https://github.com/codec-xyz/vtest MyAwesomeApp

cd MyAwesomeApp

npm install

npm run start
```

> [!Note]
>
> Typescript will complain in the editor when you first clone the template. When you first run `npm run start` a `.svelte-kit` folder will be generated and the errors and warnings should go away.

---

This template project consists of two parts...
- Example main, preload, and renderer code
- A build system

# Example code

The example code is the part that will be bundled with the electron application. It has 3 parts...

- Main Electron Node process - Located in [src-main](./src-main/)
- Preload - See [Using Preload Scripts](https://www.electronjs.org/docs/latest/tutorial/tutorial-preload) - Located in [src-renderer](./src-renderer/) purely preferentially but done so since it will execute in the same context as the renderer
- Renderer aka SvelteKit - Located in [src-renderer](./src-renderer/)

## SvelteKit building and adaptor-static

SvelteKit build outputs code to render your files on a server. These will be located in `.svelte-kit/output/` and during `npm run start` a dev server runs to serve files using this code. During `npm run package` [adaptor-static](https://kit.svelte.dev/docs/adapter-static) will then run this same code to make the browser html/css/js files and save them at `.vite/renderer/main_window/` as specified in [`svelte.config.js`](svelte.config.js).

I recommend you do not use SvelteKit's prerendering for your Electron apps. SvelteKit prerendering will slightly speed up the first load (when you open a window). However when navigating, SvelteKit will load Javascript and render pages even if they have been prerendered. Unlike web use cases Electron apps are likely to see almost none of the prerender benefits. Not using the prerendering will slightly simplify development. If you do however want prerendering here is how to do it...

<details>
These two options placed in `+layout.ts` or `+page.ts` files tell adapter-static how to render the files...

```
export const prerender = false;
export const ssr = false;
```

> [!Note]
>
> For adaptor-static keep the values the same, so either both true or both false.

- `prerender` - weather or not adapter-static will output an html file for this page
- `ssr` - weather or no adapter-static will prerender the page aka: false = blank page (and browser js to render the page)

Values of `prerender = false` and `ssr = false` means no html file is output for the this page. It will work as an [SPA (Single Page Application)](https://kit.svelte.dev/docs/single-page-apps) where this or any other page that are not present will use the fallback page `200.html` which is specified to adapter-static in `svelte.config.js`.

Values of `prerender = true` and `ssr = true` will prerender the page at build time and output an html file. One that is not blank. Reactivity, event handlers, and all other svelte features will still work. However this is prerendered during build time meaning no Electron feature and some other features will not be present. For example, state cannot be dependent on preferred color theme or window size. Use this to detect browser vs prerender...
```
import { browser } from '$app/environment';
if(browser) { ... }
```
</details>

## Typescript

Make sure to put `lang='ts'` in the Svelte files to use Typescript...
```svelte
<script lang="ts">
	// ...
</script>
```

## Serving files

The Vite SvelteKit dev server serves a fallback html file for all urls that do no point to a file. This is replicated in the built version of the app by registering an `app://` schema and handling resolving urls manual. This uses Electrons `protocol.handle` and `protocol.registerSchemesAsPrivileged`. The window url is set to the dev server in dev mode or `app://-/` when built. The Electron `protocol.handle` simply takes a callback that is invoked to handle every request to the specified schema however it wants. The code is located in [`src-main/main.ts`](./src-main/main.ts). For more see [Electron protocol api](https://www.electronjs.org/docs/latest/api/protocol).

# The build system

The build system looks like this...

- [`forge.config.ts`](./forge.config.ts) - [Electron forge](https://www.electronforge.io/)
	- [`./build-plugins/forge-plugin.vite.ts`](./build-plugins/forge-plugin.vite.ts) - An Electron Forge plugin that builds the project during `start` and `package` using Vite. See [Forge Plugin - Vite](#forge-plugin---vite).
		- [`vite.main.config.ts`](./vite.main.config.ts)
			- optional [`./build-plugins/vite-plugin.nativeNodeFile.ts`](./build-plugins/vite-plugin.nativeNodeFile.ts) - If your app needs native `.node` files bundled. See [Native node addons](#native-node-addons).
		- [`vite.preload.config.ts`](./vite.preload.config.ts)
		- [`vite.renderer.config.ts`](./vite.renderer.config.ts) - Svelte/Svelte Kit is implemented as a Vite plugin which is passed here
			- [`svelte.config.js`](./svelte.config.js)
			- [`postcss.config.js`](./postcss.config.js) - Tailwind CSS dependency
				- [`tailwind.config.ts`](./tailwind.config.ts)

## Forge Plugin - Vite

Located in [`./build-plugins/forge-plugin.vite.ts`](./build-plugins/forge-plugin.vite.ts). Its config can be found in [`forge.config.ts`](./forge.config.ts).

> [!NOTE]
> This template does NOT use the official [`@electron-forge/plugin-vite`](https://www.npmjs.com/package/@electron-forge/plugin-vite) for a few reasons...
>
> - It hides away configuration
> - Its functionality cannot be extended
> - And I would say its better to own this part of the build process in case you need to change it

### `npm run start`

Runs the app in dev mode with hot reloading.

[`build-plugins/forge-plugin.vite.ts`](./build-plugins/forge-plugin.vite.ts) does the following...

- Starts all vite renderer servers in dev mode - in this template just the one [`vite.renderer.config.ts`](./vite.renderer.config.ts) which has a Svelte Kit plugin
- Once the servers start and return their urls...
- Then starts all vite builds with watch enabled - in this template [`vite.main.config.ts`](./vite.main.config.ts) and [`vite.preload.config.ts`](./vite.preload.config.ts)
	- Passes the renderer urls to the builds using a [Vite define](https://vite.dev/config/shared-options.html#define)
- Then allows the electron app to open
- Vite renderer servers handle hot reloading normally - the plugin does not need to do anything
- When a vite build sees changes and rebuilds this plugin can as specified in its config...
	- Restarting the Electron process
	- Or tell all renderers to do a full reload

### `npm run package`

Packages the "application into a platform-specific executable bundle"[<sup>ref</sup>](https://www.electronforge.io/cli).

First Electron Forge copies the entire project to a temporary folder.

Then [`build-plugins/forge-plugin.vite.ts`](./build-plugins/forge-plugin.vite.ts) does the following...

- Calls `@electron/rebuild` - builds native node addons for Electron - Note: In this template there are no native node addons. See [Native node addons](#native-node-addons).
- Runs Vite build for all renderers and builds - Note: this is done in a separate process because Vite only release config files once the process exits
- Deletes all files except for `.vite` folder and `package.json` - Note: `package.json` is needed for its `main` and `type` fields
- Prints fancy ascii art that it is done


> [!NOTE]
>
> [`./build-plugins/forge-plugin.vite.ts`](./build-plugins/forge-plugin.vite.ts) calls `@electron/rebuild` itself to be able to run Vite and delete all uneccesay files after the rebuild. Electron Forge does NOT give plugins a hook to run after rebuild and before files are packaged in the output folder.


## Native node addons

Native node addons allow native code to be imported directly into node. These need to be compiled against Electron to be used. The `@electron/rebuild` that comes with Electron Forge does this. The included [`build-plugins/vite-plugin.nativeNodeFiles.ts`](./build-plugins/vite-plugin.nativeNodeFiles.ts) is a Vite plugin that will bundle the `.node` files into the build.

Packages need custom handling to make this work and all work differently and do their own special things. Good luck trying to make them work. Likely you will need to modify [`./build-plugins/forge-plugin.vite.ts`](./build-plugins/forge-plugin.vite.ts).

### Example - Your own C++ node addon

Run `npm i -D node-gyp node-addon-api`.

<details>
<summary>Add a <code>binding.gyp</code> file in root...</summary>

```
{
	"targets": [{
		"target_name": "native",
		"sources": [ "src-native/index.cpp" ],
		"include_dirs": ["<!@(node -p \"require('node-addon-api').include\")"],
		"dependencies": ["<!(node -p \"require('node-addon-api').gyp\")"],
		"cflags!": [ "-fno-exceptions" ],
		"cflags_cc!": [ "-fno-exceptions" ],
		"xcode_settings": {
		"GCC_ENABLE_CPP_EXCEPTIONS": "YES",
		"CLANG_CXX_LIBRARY": "libc++",
			"MACOSX_DEPLOYMENT_TARGET": "10.7"
		},
		"msvs_settings": {
			"VCCLCompilerTool": { "ExceptionHandling": 1 },
		},
		"conditions": [
			["OS=='mac'", {
				"defines": [ "MAC_OS" ],
				"cflags+": ["-fvisibility=hidden"],
				"xcode_settings": {
					"GCC_SYMBOLS_PRIVATE_EXTERN": "YES", # -fvisibility=hidden
				}
			}],
			["OS=='win'", {
				"defines": [ "WINDOWS_OS" ]
			}]
		]
	}]
}
```

</details>

<details>
<summary>Add a <code>src-native/index.cpp</code> file...</summary>

```cpp
#define NODE_API_NO_EXTERNAL_BUFFERS_ALLOWED 

#include <napi.h>
#include <iostream>

Napi::Value helloWorld(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();
	
	std::cout << "C++: Hello" << std::endl;

	return Napi::String::New(env, "World");
}

Napi::Object init(Napi::Env env, Napi::Object exports) {
	exports.Set(Napi::String::New(env, "helloWorld"), Napi::Function::New(env, helloWorld));
	return exports;
}

NODE_API_MODULE(addon, init);
```

</details>

<details>
<summary>Add a <code>src-native/native.d.ts</code> file...</summary>

```typescript
declare const native: {
	helloWorld: () => string,
};

export default native;
```

</details>

<details>
<summary>Add this to your <a href='./vite.main.config.ts'><code>vite.main.config.ts</code></a> file...</summary>

```typescript
//...
import { nativeNodeFile } from './build-plugins/vite-plugin.nativeNodeFile';

export default defineConfig({
	//...
	plugins: [
		nativeNodeFile([{
			// Location of the type definition file. Whenever this is imported this plugin
			// will replace the import with an import of the `.node` file.
			import: './src-native/native',
			// Source location of the built `.node` file.
			built: './build/Release/native.node',
			// Location to put the `.node` file relative to output bundle.
			includePath: '../bin/native.node'
		}]),
	],
	//...
});
```

</details>

<details>
<summary>Now in your <a href='./src-main/main.ts'><code>src-main/main.ts</code></a> file add...</summary>

```typescript
import native from '../src-native/native';
console.log('Javascript:', native.helloWorld());
```

</details>

The native code will NOT be compiled after the first time so...
- You can uncomment `force: true,` in [`forge.config.ts`](./forge.config.ts) to make sure your code gets compiled every time you `start` or `package`.
- And/or you can add `"rebuild": "electron-rebuild -f -w native --disable-pre-gyp-copy"` command to your [`package.json`](./package.json).
	- Note: `native` is the name of the module given in [`binding.gyp`](./binding.gyp).

## Electron Forge CLI commands

The Electron Forge CLI commands in `package.json` run the cli command script file with tsx to fix the Electron Forge CLI's typescript support for the config file. This is a known issue [#3671](https://github.com/electron/forge/issues/3671). Note: You can specify any cli options the usually way.

# License

Code/assets in this template come from...
- Electron Forge's [Vite Typescript template](https://github.com/electron/forge/tree/main/packages/template/vite-typescript) licensed under [MIT](https://github.com/electron/forge/blob/main/LICENSE).
- SvelteKit's [create-svelte template](https://github.com/sveltejs/kit/tree/main/packages/create-svelte) licensed under [MIT](https://github.com/sveltejs/kit/blob/main/LICENSE)
- Logos from https://svgl.app/

And everything else done by <span property="cc:attributionName">me (codec)</span> is marked with <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">CC0 1.0<img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt=""><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/zero.svg" alt=""></a>