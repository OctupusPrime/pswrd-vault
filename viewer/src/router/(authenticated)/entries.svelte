<script lang="ts">
	import { onMount, tick } from 'svelte';

	import { Header } from '$features/navigation';
	import { EntriesListSearch, VaultEntriesList } from '$features/vault-entries-list';

	import { pageScroll } from '$lib/stores/page-scroll.svelte';

	onMount(async () => {
		await tick();
		pageScroll.restore('entries');
	});
</script>

<div class="sticky top-0 z-20">
	<Header title="pswrd-vault" />
</div>

<main class="mx-auto mb-11 w-full max-w-md px-4 py-2">
	<VaultEntriesList />
</main>

<aside class="fixed inset-x-0 bottom-0 z-10 bg-linear-to-t from-background/80 to-transparent">
	<div class="mx-auto w-full max-w-md px-6 pb-2">
		<EntriesListSearch />
	</div>
</aside>
