/// <reference types="svelte" />
/// <reference types="vite/client" />

import { toggleDevTools, setTitleBarColors } from './preload.ts';

declare global {
	interface Window {
		toggleDevTools: typeof toggleDevTools;
		setTitleBarColors: typeof setTitleBarColors;
	}
}