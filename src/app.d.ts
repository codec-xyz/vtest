/// <reference types="svelte" />
/// <reference types="@sveltejs/kit" />
/// <reference types="vite/client" />

declare global {
	interface Window {
		// Lets typescript know about exposed preload functions
		toggleDevTools: typeof import('./preload.ts').toggleDevTools;
		setTitleBarColors: typeof import('./preload.ts').setTitleBarColors;
	}

	// See https://kit.svelte.dev/docs/types#app
	// for information about these interfaces
	namespace App {
		interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};