<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import ArrowDownUpIcon from '@lucide/svelte/icons/arrow-down-up';

	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

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

	const handleClearSearch = () => {
		entriesListStore.resetSearch();
		searchQuery = '';
	};

	let sortDialogOpen = $state(false);

	let sortQuery = $state(entriesListStore.sortBy);
	let sortOrderQuery = $state(entriesListStore.sortOrder);

	const handleResetSorting = () => {
		entriesListStore.resetSorting();
		sortQuery = entriesListStore.sortBy;
		sortOrderQuery = entriesListStore.sortOrder;
		sortDialogOpen = false;
	};

	const handleApplySorting = () => {
		entriesListStore.sortBy = sortQuery;
		entriesListStore.sortOrder = sortOrderQuery;
		sortDialogOpen = false;
	};
</script>

<div class="flex items-center gap-2">
	<div class="flex-1 rounded-md bg-background">
		<InputGroup.Root>
			<InputGroup.Input placeholder="Search entries..." value={searchQuery} oninput={handleInput} />
			<InputGroup.Addon>
				<SearchIcon />
			</InputGroup.Addon>
			{#if searchQuery}
				<InputGroup.Addon align="inline-end">
					<InputGroup.Button aria-label="Clear search" onclick={handleClearSearch} size="icon-xs">
						<XIcon />
					</InputGroup.Button>
				</InputGroup.Addon>
			{/if}
		</InputGroup.Root>
	</div>
	<Popover.Root bind:open={sortDialogOpen}>
		<Popover.Trigger class={buttonVariants({ variant: 'outline', size: 'icon' })}>
			<ArrowDownUpIcon />
		</Popover.Trigger>
		<Popover.Content sideOffset={8} class="mr-4 w-44 space-y-4 p-3 sm:mr-0">
			<RadioGroup.Root bind:value={sortQuery}>
				<Label>Sort by</Label>
				<div class="flex items-center space-x-2">
					<RadioGroup.Item value="name" id="r2" />
					<Label for="r2">Name</Label>
				</div>
				<div class="flex items-center space-x-2">
					<RadioGroup.Item value="created-at" id="r1" />
					<Label for="r1">Created At</Label>
				</div>
				<div class="flex items-center space-x-2">
					<RadioGroup.Item value="updated-at" id="r3" />
					<Label for="r3">Updated At</Label>
				</div>
			</RadioGroup.Root>
			<RadioGroup.Root bind:value={sortOrderQuery}>
				<Label>Sort direction</Label>
				<div class="flex items-center space-x-2">
					<RadioGroup.Item value="asc" id="r4" />
					<Label for="r4">Ascending</Label>
				</div>
				<div class="flex items-center space-x-2">
					<RadioGroup.Item value="desc" id="r5" />
					<Label for="r5">Descending</Label>
				</div>
			</RadioGroup.Root>
			<div class="flex w-full gap-3">
				<Button variant="outline" size="sm" class="flex-1" onclick={handleResetSorting}
					>Reset</Button
				>
				<Button variant="default" size="sm" class="flex-1" onclick={handleApplySorting}
					>Apply</Button
				>
			</div>
		</Popover.Content>
	</Popover.Root>
</div>
