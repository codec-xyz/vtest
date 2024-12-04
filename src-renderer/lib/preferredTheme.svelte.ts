const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
export let preferredTheme = $state({ theme: prefersDarkMode.matches ? 'dark' : 'light' });
prefersDarkMode.addEventListener('change', e => preferredTheme.theme = (e.matches ? 'dark' : 'light'));