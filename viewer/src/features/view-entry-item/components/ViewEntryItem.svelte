<script lang="ts">
	import { toast } from 'svelte-sonner';
	import dayjs from 'dayjs';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';

	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';

	import { vault } from '$lib/stores/vault.svelte';

	interface Props {
		entryId: string;
	}

	let { entryId }: Props = $props();

	const entryItem = $derived.by(() => {
		if (!vault.isUnlocked || !vault.data) return null;
		return vault.data.entries.find((entry) => entry.id === entryId) || null;
	});

	let revealedItem = $state<{ itemId: string; value: string } | null>(null);

	const toggleRevealItem = async (itemId: string) => {
		if (!entryItem) return;

		if (revealedItem && revealedItem.itemId === itemId) {
			revealedItem = null;
			return;
		}

		try {
			const revealResult = await vault.revealItem(entryItem.id, itemId);

			revealedItem = {
				itemId,
				value: revealResult
			};
		} catch (error) {
			toast.error('Failed to reveal item. Please try again.');
		}
	};

	const handleCopyItem = async (itemId: string) => {
		if (!entryItem) return;

		try {
			const valueToCopy = await vault.revealItem(entryItem.id, itemId);
			await navigator.clipboard.writeText(valueToCopy);
			toast.success('Item copied to clipboard!');
		} catch (error) {
			toast.error('Failed to copy item. Please try again.');
		}
	};
</script>

{#if entryItem}
	<div class="space-y-2">
		{#each entryItem.items as item (item.id)}
			{@const isRevealed = revealedItem && revealedItem.itemId === item.id}

			{#if item.type === 'secret'}
				<div class="">
					<div class="flex items-center gap-2">
						<h3 class="font-medium tracking-tight">
							{item.name}
						</h3>
						<Button
							variant="outline"
							size="icon-sm"
							class="ml-auto"
							onclick={() => toggleRevealItem(item.id)}
						>
							{#if isRevealed}
								<EyeIcon />
							{:else}
								<EyeOffIcon />
							{/if}
						</Button>
						<Button variant="outline" size="icon-sm" onclick={() => handleCopyItem(item.id)}>
							<CopyIcon />
						</Button>
					</div>
					{#if isRevealed}
						<p class="text-sm leading-7 break-all whitespace-pre-wrap">{revealedItem?.value}</p>
					{:else}
						<p class="text-sm leading-7 break-all whitespace-pre-wrap">••••••••</p>
					{/if}
				</div>
			{:else}
				<div class="">
					<div class="flex items-center justify-between gap-2">
						<h3 class="font-medium tracking-tight">
							{item.name}
						</h3>
						<Button variant="outline" size="icon-sm" onclick={() => handleCopyItem(item.id)}>
							<CopyIcon />
						</Button>
					</div>
					<p class="text-sm leading-7 break-all whitespace-pre-wrap">{item.value}</p>
				</div>
			{/if}
		{/each}
		{#if entryItem.items.length === 0}
			<p class="py-3 text-center text-muted-foreground">No items in this entry.</p>
		{/if}

		<Separator />

		<div class="flex justify-between text-sm text-muted-foreground">
			<span>Updated At:</span>
			<span>{dayjs(entryItem.updatedAt).format('DD/MM/YYYY HH:mm ')}</span>
		</div>
		<div class="flex justify-between text-sm text-muted-foreground">
			<span>Created At:</span>
			<span>{dayjs(entryItem.createdAt).format('DD/MM/YYYY HH:mm ')}</span>
		</div>
	</div>
{:else}
	<p class="py-3 text-center text-muted-foreground">
		{#if !vault.isUnlocked}
			Vault is locked.
		{:else}
			Entry not found.
		{/if}
	</p>
{/if}
