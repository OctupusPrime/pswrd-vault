<script lang="ts">
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';

	import { Button } from '$lib/components/ui/button/index.js';

	import { appearance } from '$lib/stores/appearance.svelte';

	interface Props {
		children: () => any;
	}

	let { children }: Props = $props();
</script>

<div class="fixed top-2 right-2 z-20 rounded-md bg-background">
	<Button
		aria-label="Toggle theme"
		onclick={() => appearance.toggleColorSchema()}
		variant="outline"
		size="icon-sm"
		class=""
	>
		<SunIcon class="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
		<MoonIcon class="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
	</Button>
</div>

{@render children()}
