<script lang="ts">
	import router from 'page';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import LockIcon from '@lucide/svelte/icons/lock';
	import ToolCaseIcon from '@lucide/svelte/icons/tool-case';

	import { Button } from '$lib/components/ui/button/index.js';

	import { appearance } from '$lib/stores/appearance.svelte';
	import { vault } from '$lib/stores/vault.svelte';

	interface Props {
		title: string;
		previousPageUrl?: string;
	}

	let { title, previousPageUrl }: Props = $props();

	const lockVault = () => {
		vault.lock();
		router.show('/login');
	};
</script>

<header class="flex h-12 items-center gap-2 border-b bg-background px-4">
	{#if previousPageUrl}
		<Button
			aria-label="Go back"
			onclick={() => router.show(previousPageUrl)}
			variant="ghost"
			size="icon-sm"
		>
			<ArrowLeftIcon />
		</Button>
	{:else}
		<div class="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
			<ToolCaseIcon class="size-4" />
		</div>
	{/if}
	<h1 class="truncate text-base font-medium">{title}</h1>

	<Button
		aria-label="Toggle theme"
		onclick={() => appearance.toggleColorSchema()}
		variant="outline"
		size="icon-sm"
		class="ml-auto"
	>
		<SunIcon class="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
		<MoonIcon class="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
	</Button>
	<Button aria-label="Lock vault" variant="outline" size="icon-sm" onclick={lockVault}>
		<LockIcon />
	</Button>
</header>
