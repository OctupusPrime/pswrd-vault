<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';

	import * as InputGroup from '$lib/components/ui/input-group/index.js';

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

<div class="rounded-md bg-background">
	<InputGroup.Root>
		<InputGroup.Input
			placeholder="Search entries..."
			defaultValue={entriesListStore.search}
			oninput={handleInput}
		/>
		<InputGroup.Addon>
			<SearchIcon />
		</InputGroup.Addon>
	</InputGroup.Root>
</div>
