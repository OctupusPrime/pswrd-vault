<script lang="ts">
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import ToolCaseIcon from '@lucide/svelte/icons/tool-case';

	import { Button } from '$lib/components/ui/button/index.js';
	import { LoginForm } from '$features/login-form';

	import { appearance } from '$lib/stores/appearance.svelte';
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

<main class="mx-auto grid h-screen w-full max-w-md place-items-center px-4">
	<div class="gap flex w-full flex-col gap-6 py-8">
		<div class="flex items-center gap-2 self-center">
			<div class="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground">
				<ToolCaseIcon class="size-4" />
			</div>
			<p class="font-medium">pswrd-vault</p>
		</div>

		<LoginForm callbackUrl="/" />

		<p class="px-4 text-center text-sm leading-normal font-normal text-muted-foreground">
			Verify the SHA256 checksum on new devices to ensure your vault's integrity.
		</p>
	</div>
</main>
