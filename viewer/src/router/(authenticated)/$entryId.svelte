<script lang="ts">
	import { Header } from '$features/navigation';
	import { ViewEntryItem } from '$features/view-entry-item';

	import { vault } from '$lib/stores/vault.svelte';

	interface Props {
		queryParams: {
			entryId: string;
		};
	}

	let { queryParams }: Props = $props();

	const entryName = $derived.by(() => {
		if (!vault.isUnlocked || !vault.data) return '';
		const entry = vault.data.entries.find((e) => e.id === queryParams.entryId);
		return entry ? entry.name : '';
	});
</script>

<div class="sticky top-0 z-20">
	<Header title={entryName} previousPageUrl="/" />
</div>

<main class="mx-auto w-full max-w-md px-4 py-2">
	<ViewEntryItem entryId={queryParams.entryId} />
</main>
