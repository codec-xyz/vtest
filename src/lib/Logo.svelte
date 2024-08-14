<script lang='ts'>
	export let url: string;
	export let logoSrc: string;
	export let alt = '';
	export let hover = false;
	let clazz: string = '';
	export {clazz as class};
</script>

<a href={url} target="_blank" rel="noreferrer" class={clazz} on:mouseenter={() => hover = true} on:mouseleave={() => hover = false}>
	<img src={logoSrc} class='w-24 h-24' alt={alt} />
</a>