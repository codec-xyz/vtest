// https://kit.svelte.dev/docs/single-page-apps#prerendering-individual-pages
// This page will be prerendered by adaptor-static at compile time (when
// prerender and ssr are set true). Detect prerender vs browser with...
// ```
// import { browser } from '$app/environment';
// if(browser) { ... }
// ```
export const prerender = true;
export const ssr = true;