export {}; // Make this a module

declare global {
	// Global defines that are being passed by Vite. Check `vite/vite.*.config.ts` in `config.define`.

	/**
	 * An object containing the Vite dev server urls for all renderers. If not in dev mode
	 * then this is an empty object. The value may look something like this...
	 * ```
	 * {
	 * 	['main_window']: 'http://localhost:5173/'
	 * }
	 * ```
	 */
	const VITE_DEV_SERVER_URLS: Record<string, string>;
}