<script lang="ts">
	import { Header } from '$features/navigation';

	interface Props {
		queryParams: {
			entryId: string;
		};
	}

	let { queryParams }: Props = $props();
</script>

<div class="sticky top-0 z-20">
	<Header title="pswrd-vault" previousPageUrl="/" />
</div>

<p>{JSON.stringify(queryParams)}</p>
