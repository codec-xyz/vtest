import type { Config } from 'tailwindcss';

const config: Config = {
	content: ['./src-renderer/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {},
	},
	plugins: [],
}

export default config;
