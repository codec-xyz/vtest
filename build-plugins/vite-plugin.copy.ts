import { type Plugin } from 'vite';
import path from 'path';
import { rm, cp, constants } from 'node:fs/promises';

/**
 * Copies on build. Works for files or folders.
 * 
 * If `destPathRelativeToBundle` is true `destPath` is resolved relative to the output bundle
 * otherwise `destPath` is resolved relative to the project root.
 */
export function copy(srcPath: string, destPath: string, destPathRelativeToBundle = true): Plugin {
	return {
		name: 'copy-files',
		async generateBundle(options, bundle) {
			if(options.dir === undefined) return;

			//https://rollupjs.org/plugin-development/#generatebundle
			for(const output of Object.values(bundle)) {
				if(output.type !== 'chunk') continue;

				try {
					const copyTo = destPathRelativeToBundle ? path.resolve(options.dir, destPath) : destPath;

					await rm(copyTo, { force: true, recursive: true });
					await cp(srcPath, copyTo, { mode: constants.COPYFILE_FICLONE, recursive: true });
				}
				catch(e) {
					console.error(e);
				}
			}
		},
	};
}