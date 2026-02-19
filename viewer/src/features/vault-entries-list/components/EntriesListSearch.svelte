<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';

	import { entriesListStore } from '../stores/entries-list-state.svelte';

	let timer: number;

	const handleInput = (event: Event) => {
		const target = event.target as HTMLInputElement;
		const value = target.value;

		clearTimeout(timer);
		timer = setTimeout(() => {
			entriesListStore.search = value;
		}, 300);
	};
</script>

<Input
	placeholder="Search entries..."
	class="bg-background!"
	defaultValue={entriesListStore.search}
	oninput={handleInput}
/>
