import { browser } from '$app/environment';
import { writable, type Writable } from 'svelte/store'

const prefersDarkMode = browser ? window.matchMedia('(prefers-color-scheme: dark)') : undefined;
export const preferredTheme: Writable<string> = writable(prefersDarkMode && prefersDarkMode.matches ? 'dark' : 'light');
if(prefersDarkMode) prefersDarkMode.addEventListener('change', e => preferredTheme.set(e.matches ? 'dark' : 'light'));