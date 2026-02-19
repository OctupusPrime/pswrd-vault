<script lang="ts">
	interface Props {
		text: string;
		search?: string;
	}

	let { text = '', search = '' }: Props = $props();

	let parts = $derived.by(() => {
		if (!search) return [{ text, highlight: false }];

		// Escape special regex characters
		const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const regex = new RegExp(`(${escapedSearch})`, 'gi');

		// Split by regex, filter out empty strings
		const parts = text.split(regex).filter((part) => part);

		return parts.map((part) => {
			return {
				text: part,
				highlight: part.toLowerCase() === search.toLowerCase()
			};
		});
	});
</script>

<span>
	{#each parts as { text, highlight }}
		{#if highlight}
			<mark class="rounded-sm bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-100">{text}</mark>
		{:else}
			{text}
		{/if}
	{/each}
</span>
