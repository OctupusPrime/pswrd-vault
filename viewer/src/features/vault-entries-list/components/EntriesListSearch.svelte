<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';

	import * as InputGroup from '$lib/components/ui/input-group/index.js';

	import { entriesListStore } from '../stores/entries-list-state.svelte';

	let timer: number;
	let searchQuery = $state(entriesListStore.search);

	const handleInput = (event: Event) => {
		const target = event.target as HTMLInputElement;
		const value = target.value;
		searchQuery = value;

		clearTimeout(timer);
		timer = setTimeout(() => {
			entriesListStore.search = value;
		}, 300);
	};

	const handleClear = () => {
		entriesListStore.clearFilters();
		searchQuery = '';
	};
</script>

<div class="rounded-md bg-background">
	<InputGroup.Root>
		<InputGroup.Input placeholder="Search entries..." value={searchQuery} oninput={handleInput} />
		<InputGroup.Addon>
			<SearchIcon />
		</InputGroup.Addon>
		{#if searchQuery}
			<InputGroup.Addon align="inline-end">
				<InputGroup.Button aria-label="Clear search" onclick={handleClear} size="icon-xs">
					<XIcon />
				</InputGroup.Button>
			</InputGroup.Addon>
		{/if}
	</InputGroup.Root>
</div>
