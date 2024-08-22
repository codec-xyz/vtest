// SPA (Single-page application) https://kit.svelte.dev/docs/single-page-apps
// Adapter-static will not prerender any pages (when prerender and ssr set to false).
// When specified in `svelte.config.js` under `config.adapter.fallback` a fallback file
// will still be output by adapter-static.
export const prerender = false;
export const ssr = false;