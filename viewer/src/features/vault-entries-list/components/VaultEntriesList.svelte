<script lang="ts">
	import router from 'page';
	import dayjs from 'dayjs';

	import { Button } from '$lib/components/ui/button/index.js';
	import { Highlighter } from '$lib/components/ui/highlighter/index.js';
	import * as Table from '$lib/components/ui/table/index.js';

	import { vault } from '$lib/stores/vault.svelte';
	import { entriesListStore } from '../stores/entries-list-state.svelte.js';

	const filteredEntries = $derived.by(() => {
		if (!vault.isUnlocked || !vault.data) return [];

		const search = entriesListStore.search.toLowerCase();
		const results = vault.data.entries.filter((entry) => entry.name.toLowerCase().includes(search));

		const sortBy = entriesListStore.sortBy;
		const sortOrder = entriesListStore.sortOrder;

		return results.sort((a, b) => {
			let compareValue = 0;

			if (sortBy === 'name') {
				compareValue = a.name.localeCompare(b.name);
			} else if (sortBy === 'created-at') {
				compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			} else if (sortBy === 'updated-at') {
				compareValue = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
			}

			return sortOrder === 'asc' ? compareValue : -compareValue;
		});
	});

	const handleEntryClick = (entryId: string) => {
		router.show(`/${entryId}`);
	};
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>Name</Table.Head>
			<Table.Head class="w-24 text-end">Updated At</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each filteredEntries as entry (entry.id)}
			<Table.Row>
				<Table.Cell>
					<Button variant="link" class="px-0" onclick={() => handleEntryClick(entry.id)}>
						<Highlighter text={entry.name} search={entriesListStore.search} />
					</Button>
				</Table.Cell>
				<Table.Cell class="text-end">
					{dayjs(entry.updatedAt).format('DD/MM/YYYY')}
				</Table.Cell>
			</Table.Row>
		{/each}
		{#if filteredEntries.length === 0}
			<Table.Row class="h-14">
				<Table.Cell colspan={3} class="text-center">
					{#if entriesListStore.search}
						No entries found
					{:else if !vault.isUnlocked}
						Vault is locked.
					{:else}
						No entries available
					{/if}
				</Table.Cell>
			</Table.Row>
		{/if}
	</Table.Body>
</Table.Root>
