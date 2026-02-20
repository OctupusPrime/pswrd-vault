<script lang="ts">
	import router from 'page';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';

	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Kbd from '$lib/components/ui/kbd/index.js';

	import { vault } from '$lib/stores/vault.svelte';

	interface Props {
		callbackUrl: string;
	}

	let { callbackUrl }: Props = $props();

	const MAX_PASSPHRASE_WORDS = 12;

	let passphrase = $state<string[]>([]);
	let currentWordIndex = $state(0);

	let inputRevealWord = $state(false);
	let errorMessage = $state<string | null>(null);

	const isPreviousDisabled = $derived.by(() => {
		if (currentWordIndex === 0) return true;
		return false;
	});

	const isNextDisabled = $derived.by(() => {
		if (currentWordIndex === MAX_PASSPHRASE_WORDS - 1) return true;
		if (!passphrase[currentWordIndex]) return true;
		return false;
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		const formData = new FormData(event.currentTarget as HTMLFormElement);
		const word = formData.get('passphrase-word') as string;

		if (!word || word.trim() === '') {
			errorMessage = 'Word cannot be empty';
			return;
		}

		passphrase[currentWordIndex] = word.trim();

		if (currentWordIndex < MAX_PASSPHRASE_WORDS - 1) {
			currentWordIndex += 1;
			(event.currentTarget as HTMLFormElement).reset();
			return;
		}

		try {
			await vault.unlock(passphrase.join(' '));
			router.show(callbackUrl);
		} catch (error) {
			errorMessage = 'Invalid passphrase. Please try again.';
			currentWordIndex = 0;
		} finally {
			// Clear passphrase from memory
			passphrase = [];
		}
	}
</script>

<Card.Root class="-my-4 w-full">
	<Card.Header>
		<Card.Title>Unlock Vault</Card.Title>
		<Card.Description>
			Enter your passphrase one word at a time. Press <Kbd.Root>Enter</Kbd.Root>
			after each word to continue.
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<form onsubmit={handleSubmit} autocomplete="off">
			<div class="grid gap-2">
				<Label for="passphrase-word">
					Word {currentWordIndex + 1} of {MAX_PASSPHRASE_WORDS}
				</Label>
				{#key currentWordIndex}
					<InputGroup.Root>
						<InputGroup.Input
							autofocus
							name="passphrase-word"
							type={inputRevealWord ? 'text' : 'password'}
							autocomplete="one-time-code"
							defaultValue={passphrase[currentWordIndex] ?? ''}
							oninput={() => (errorMessage = null)}
						/>
						<InputGroup.Addon align="inline-end">
							<InputGroup.Button
								aria-label={inputRevealWord ? 'Hide passphrase word' : 'Show passphrase word'}
								title={inputRevealWord ? 'Hide passphrase word' : 'Show passphrase word'}
								type="button"
								size="icon-xs"
								onclick={() => (inputRevealWord = !inputRevealWord)}
							>
								{#if inputRevealWord}
									<EyeOffIcon />
								{:else}
									<EyeIcon />
								{/if}
							</InputGroup.Button>
						</InputGroup.Addon>
					</InputGroup.Root>
				{/key}
				{#if errorMessage}
					<p class="text-sm text-destructive">{errorMessage}</p>
				{/if}
			</div>
		</form>
	</Card.Content>
	<Card.Footer class="flex items-center gap-2">
		<Button
			size="icon"
			aria-label="Back"
			variant="outline"
			type="button"
			disabled={isPreviousDisabled}
			onclick={() => (currentWordIndex -= 1)}
		>
			<ArrowLeftIcon />
		</Button>
		<Button
			size="icon"
			aria-label="Next"
			variant="outline"
			type="button"
			disabled={isNextDisabled}
			onclick={() => (currentWordIndex += 1)}
		>
			<ArrowRightIcon />
		</Button>

		<Button class="ml-auto" type="submit">Continue</Button>
	</Card.Footer>
</Card.Root>
