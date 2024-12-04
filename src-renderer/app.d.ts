/// <reference types="svelte" />
/// <reference types="@sveltejs/kit" />
/// <reference types="vite/client" />

import type { ExposeInRendererTypes } from './preload.ts';

declare global {
	// Lets typescript know about exposed preload functions
	interface Window extends ExposeInRendererTypes {}

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