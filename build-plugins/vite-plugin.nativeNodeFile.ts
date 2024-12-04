import { type Plugin } from 'vite';
import path from 'path';
import { cp, constants } from 'node:fs/promises';

export type Config = {
	/**
	 * Import path the code uses to import this native node addon dependency.
	 * 
	 * Imports of this path will be replaced with a require to the bundled `.node` file.
	 * This allows using a TypeScript declaration file as the import for a native node addon dependency.
	 */
	import?: string,

	/**
	 * Path to the built node file. Ex: `./build/Release/native.node`.
	 */
	built: string,

	/**
	 * Path for the .node file. Ex: `thisThing.node`.
	 * 
	 * If not defined the `.node` file is placed at the root with the same name as the built `.node` file.
	 */
	includePath?: string,

	/**
	 * When false: only includes this native dependency if it is imported.
	 * Default: `false`
	 */
	alwaysInclude?: boolean,
}[];

//https://prosopo.io/articles/vite-node-files/
/**
 * Note: outputs ESM.
 */
export function nativeNodeFile(config: Config, root: string = process.cwd()): Plugin {
	const natives = config.map(native => {
		const importFullPath = native.import === undefined
			? undefined
			: path.resolve(root, native.import);

		const nodeFileFullPath = path.resolve(root, native.built);

		const requirePath = native.includePath === undefined
			? `./${path.basename(nodeFileFullPath)}`
			: native.includePath;

		return {
			config: native,
			used: false,
			importFullPath,
			nodeFileFullPath,
			requirePath,
		}
	});

	const nativeByImport = new Map(natives.map(native => [native.importFullPath, native]));
	const nativeByNodeFile = new Map(natives.map(native => [native.nodeFileFullPath, native]));

	return {
		name: 'native-node-files',
		buildStart(options) {
			// console.log('---vite.buildStart---', options);

			for(const native of natives) {
				native.used = false;
			}
		},
		async resolveId(source, importer, options) {
			// console.log('---vite.resolveId---', source, importer, options);
			// sample output - source: `../src-native/native`, importer: `C:/ProjectPath/src-main/main.ts`, options: `{ attributes: {}, custom: {}, isEntry: false }`

			if(importer === undefined) return null;

			const importFullPath = path.resolve(path.dirname(importer), source);

			const native = nativeByImport.get(importFullPath);
			if(native === undefined) return null;
			native.used = true;

			return native.nodeFileFullPath;
		},
		load(id) {
			// console.log('---vite.load---', id);

			const native = nativeByNodeFile.get(id);

			if(native !== undefined) return `
				import { createRequire } from 'module';
				const customRequire = createRequire(import.meta.url);
				const content = customRequire(${JSON.stringify(native.requirePath)});
				export default content;
				`;

			return null;
		},
		async generateBundle(options, bundle) {
			// console.log('---vite.generateBundle---', options, bundle);

			if(options.dir === undefined) return;

			//https://rollupjs.org/plugin-development/#generatebundle
			for(const output of Object.values(bundle)) {
				if(output.type !== 'chunk') continue;

				for(const native of natives) {
					const include = native.used || native.config.alwaysInclude === true;
					if(!include) continue;

					const copyTo = path.resolve(options.dir, native.requirePath);

					try {
						await cp(native.nodeFileFullPath, copyTo, { mode: constants.COPYFILE_FICLONE });
					}
					catch(e) {
						console.error(e);
					}
				}
			}
		},
	}
};