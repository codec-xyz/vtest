import { writable } from 'svelte/store'

const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
export const preferredTheme = writable(prefersDarkMode.matches ? 'dark' : 'light');
prefersDarkMode.addEventListener('change', e => preferredTheme.set(e.matches ? 'dark' : 'light'));