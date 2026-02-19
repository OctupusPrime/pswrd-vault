<script lang="ts">
	import { Header } from '$features/navigation';
	import { EntriesListSearch, VaultEntriesList } from '$features/vault-entries-list';
</script>

<Header title="pswrd-vault" classes={{ root: 'sticky top-0 z-20' }} />

<main class="mx-auto mb-14 w-full max-w-md px-4 pt-4 pb-3">
	<VaultEntriesList />
</main>

<aside class="fixed inset-x-0 bottom-0 z-10 bg-linear-to-t from-background/80 to-transparent">
	<div class="mx-auto w-full max-w-md px-6 pb-4">
		<EntriesListSearch />
	</div>
</aside>
