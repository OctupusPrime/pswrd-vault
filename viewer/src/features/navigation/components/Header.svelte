<script lang="ts">
	import router from 'page';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';

	import { Button } from '$lib/components/ui/button/index.js';

	import { appearance } from '$lib/stores/appearance.svelte';

	interface Props {
		title: string;
		previousPageUrl?: string;
	}

	let { title, previousPageUrl }: Props = $props();
</script>

<header class="flex h-12 items-center gap-2 border-b bg-background px-4">
	{#if previousPageUrl}
		<Button onclick={() => router.show(previousPageUrl)} variant="ghost" size="icon-sm">
			<ArrowLeftIcon />
		</Button>
	{/if}
	<h1 class="text-base font-medium">{title}</h1>

	<Button
		onclick={() => appearance.toggleColorSchema()}
		variant="outline"
		size="icon-sm"
		class="ml-auto"
	>
		<SunIcon class="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
		<MoonIcon class="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
		<span class="sr-only">Toggle theme</span>
	</Button>
</header>
