<script lang="ts">
	import Devtools from './lib/Devtools.svelte'
	import electronLogo from '/electron.svg'
	import svelteLogo from '/svelte.svg'
	import typescriptLogo from '/typescript.svg'
	import viteLogo from '/vite.svg'
	import tailwindcssLogo from '/tailwindcss.svg'
	import Logo from './lib/Logo.svelte'
	import Counter from './lib/Counter.svelte'
    import { preferredTheme } from './lib/preferredTheme';

	let viteHover = false;
	let typescriptHover = false;
	let electronForgeHover = false;
	let svelteHover = false;
	let tailwindcssHover = false;

	preferredTheme.subscribe(theme => {
		if(theme === 'dark') window.setTitleBarColors('#374151', '#f8fafc');
		else window.setTitleBarColors('#e5e7eb', '#020617');
	});
</script>

<div id='titlebar' class='shrink-0 bg-gradient-to-r from-gray-100 to-gray-200 flex text-slate-950 dark:from-[#273141] dark:to-gray-700 dark:text-slate-50'>
	<div class='px-4 select-none grow text-xs flex items-center' style='-webkit-app-region: drag;'>{document.title}</div>
	{#if import.meta.env.DEV}
		<Devtools/>
	{/if}
</div>
<div class='overflow-auto h-full bg-gradient-to-br from-white to-zinc-50 text-slate-950 dark:from-zinc-800 dark:to-zinc-900 dark:text-slate-50'>
	<div class='max-w-7xl mx-auto px-16 py-24'>
		<div class='flex gap-16 flex-wrap justify-center'>
			<Logo logoSrc={viteLogo}		alt='Vite Logo'				bind:hover={viteHover}			url='https://vitejs.dev'
				class='shrink-0 transition hover:drop-shadow-[0_0_2em_#646cffaa]'></Logo>
			<Logo logoSrc={typescriptLogo}	alt='Typescript Logo'		bind:hover={typescriptHover}	url='https://www.typescriptlang.org'
				class='shrink-0 transition hover:drop-shadow-[0_0_2em_#3178c6aa]'></Logo>
			<Logo logoSrc={electronLogo}	alt='Electron Forge Logo'	bind:hover={electronForgeHover}	url='https://www.electronforge.io/'
				class='shrink-0 transition hover:drop-shadow-[0_0_2em_#2f3242aa]'></Logo>
			<Logo logoSrc={svelteLogo}		alt='Svelte Logo'			bind:hover={svelteHover}		url='https://svelte.dev'
				class='shrink-0 transition hover:drop-shadow-[0_0_2em_#ff3e00aa]'></Logo>
			<Logo logoSrc={tailwindcssLogo} alt='Tailwind CSS Logo'		bind:hover={tailwindcssHover}	url='https://tailwindcss.com/'
				class='shrink-0 transition hover:drop-shadow-[0_0_2em_#19b5baaa]'></Logo>
		</div>
		<p class='mt-16 text-gray-600 dark:text-gray-400 text-center'>
			Click on the logos to learn more
		</p>
		<h1 class='text-center text-5xl leading-tight'>
			<span class:text-indigo-500={viteHover}>Vite</span> +
			<span class:text-blue-500={typescriptHover}>Typescript</span> +
			<span class:text-slate-500={electronForgeHover}>Electron Forge</span> +
			<span class:text-orange-500={svelteHover}>Svelte</span> +
			<span class:text-sky-500={tailwindcssHover}>Tailwind CSS</span>
		</h1>
		<div class='m-auto w-fit mt-16'>
			<Counter />
		</div>
	</div>
</div>

<style>
	#titlebar {
		margin-right: env(titlebar-area-x);
		width: env(titlebar-area-width);
		height: env(titlebar-area-height);
	}
</style>
