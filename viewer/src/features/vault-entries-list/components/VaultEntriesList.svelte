<script lang="ts">
	import dayjs from 'dayjs';

	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';

	import { vault } from '$lib/stores/vault.svelte';
	import { getDeterministicEmoji } from '../utils.js';
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-8 text-center">🔑</Table.Head>
			<Table.Head>Name</Table.Head>
			<Table.Head class="text-end">Updated At</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#if vault.isUnlocked && vault.data}
			{#each vault.data.entries as entry (entry.id)}
				{@const emoji = getDeterministicEmoji(entry.name)}

				<Table.Row>
					<Table.Cell>
						<div class="grid h-8 w-8 place-items-center rounded-full bg-input text-lg">
							{emoji}
						</div>
					</Table.Cell>
					<Table.Cell>
						<Button variant="link" class="px-0">
							{entry.name}
						</Button>
					</Table.Cell>
					<Table.Cell class="text-end">
						{dayjs(entry.updatedAt).format('DD/MM/YYYY')}
					</Table.Cell>
				</Table.Row>
			{/each}
		{:else}
			<Table.Row>
				<Table.Cell colspan={3} class="text-center">Vault is locked or empty.</Table.Cell>
			</Table.Row>
		{/if}
	</Table.Body>
</Table.Root>
