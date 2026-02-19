<script lang="ts">
	import router from 'page';
	import dayjs from 'dayjs';

	import { Button } from '$lib/components/ui/button/index.js';
	import { Highlighter } from '$lib/components/ui/highlighter/index.js';
	import * as Table from '$lib/components/ui/table/index.js';

	import { vault } from '$lib/stores/vault.svelte';
	import { entriesListStore } from '../stores/entries-list-state.svelte.js';
	import { getDeterministicEmoji } from '../utils.js';

	const filteredEntries = $derived.by(() => {
		if (!vault.isUnlocked || !vault.data) return [];

		const search = entriesListStore.search.toLowerCase();
		return vault.data.entries.filter((entry) => entry.name.toLowerCase().includes(search));
	});

	const handleEntryClick = (entryId: string) => {
		router.show(`/${entryId}`);
	};
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-12 text-center">🔑</Table.Head>
			<Table.Head>Name</Table.Head>
			<Table.Head class="text-end">Updated At</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each filteredEntries as entry (entry.id)}
			{@const emoji = getDeterministicEmoji(entry.name)}
			{@const updatedAt = dayjs(entry.updatedAt).format('DD/MM/YYYY')}

			<Table.Row>
				<Table.Cell>
					<div class="grid h-8 w-8 place-items-center rounded-full bg-input text-lg">
						{emoji}
					</div>
				</Table.Cell>
				<Table.Cell>
					<Button variant="link" class="px-0" onclick={() => handleEntryClick(entry.id)}>
						<Highlighter text={entry.name} search={entriesListStore.search} />
					</Button>
				</Table.Cell>
				<Table.Cell class="text-end">
					{updatedAt}
				</Table.Cell>
			</Table.Row>
		{/each}
		{#if filteredEntries.length === 0}
			<Table.Row class="h-14">
				<Table.Cell colspan={3} class="text-center">
					{entriesListStore.search ? 'No entries found.' : 'Vault is locked.'}
				</Table.Cell>
			</Table.Row>
		{/if}
	</Table.Body>
</Table.Root>
