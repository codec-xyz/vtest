<script lang="ts">
	let count: number = 0
	const increment = () => {
		count += 1
	}
</script>

<button on:click={increment} class='bg-neutral-300 dark:bg-neutral-900 px-4 py-2 rounded-md border border-transparent transition hover:border-sky-500 dark:hover:border-sky-800'>
	and a counter: {count}
</button>
