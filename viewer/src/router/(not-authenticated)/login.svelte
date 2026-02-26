<script lang="ts">
	import ToolCaseIcon from '@lucide/svelte/icons/tool-case';

	import { LoginForm } from '$features/login-form';
</script>

<main class="mx-auto grid h-screen w-full max-w-md place-items-center px-4">
	<div class="flex w-full flex-col gap-6 py-8">
		<div class="flex items-center gap-2 self-center">
			<div class="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground">
				<ToolCaseIcon class="size-4" />
			</div>
			<p class="font-medium">pswrd-vault</p>
		</div>

		<LoginForm callbackUrl="/entries" />

		<p class="px-4 text-center text-sm leading-normal font-normal text-muted-foreground">
			Verify the SHA256 checksum on new devices to ensure your vault's integrity.
		</p>
	</div>
</main>
