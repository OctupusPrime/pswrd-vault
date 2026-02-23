<script lang="ts">
	import router from 'page';
	import { toast } from 'svelte-sonner';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';

	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Kbd from '$lib/components/ui/kbd/index.js';

	import { vault } from '$lib/stores/vault.svelte';
	import { MAX_PASSPHRASE_WORDS } from '$lib/consts';

	interface Props {
		callbackUrl: string;
	}

	let { callbackUrl }: Props = $props();

	let keyBuffer = new Uint8Array();
	let currentWordIndex = $state(0);

	let formRef = $state<HTMLFormElement | null>(null);
	let inputRef = $state<HTMLInputElement | null>(null);

	let inputRevealWord = $state(false);
	let inputError = $state<string | null>(null);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		const encoder = new TextEncoder();

		const formData = new FormData(event.currentTarget as HTMLFormElement);
		const word = formData.get('passphrase-word') as string;

		if (!word || word.trim() === '') {
			inputError = 'Word cannot be empty';
			return;
		}

		const isNotLastWord = currentWordIndex < MAX_PASSPHRASE_WORDS - 1;

		const encodedWord = encoder.encode(word.trim() + (isNotLastWord ? ' ' : ''));
		const newKeyBuffer = new Uint8Array(keyBuffer.length + encodedWord.length);
		newKeyBuffer.set(keyBuffer);
		newKeyBuffer.set(encodedWord, keyBuffer.length);

		keyBuffer.fill(0);
		keyBuffer = newKeyBuffer;

		if (isNotLastWord) {
			currentWordIndex += 1;
			formRef?.reset();
			inputRef?.focus();
			return;
		}

		let isUnlocked = false;

		try {
			await vault.unlock(keyBuffer);
			isUnlocked = true;
		} catch (error) {
			toast.error('Invalid passphrase. Please try again.');
			currentWordIndex = 0;
		} finally {
			keyBuffer.fill(0);
			keyBuffer = new Uint8Array();
		}

		if (isUnlocked) {
			router.show(callbackUrl);
		}
	}
</script>

<Card.Root class="w-full py-4">
	<Card.Header class="px-4">
		<Card.Title>Unlock Vault</Card.Title>
		<Card.Description>
			Enter your passphrase one word at a time. Press <Kbd.Root>Enter</Kbd.Root>
			after each word to continue.
		</Card.Description>
	</Card.Header>
	<Card.Content class="px-4">
		<form bind:this={formRef} onsubmit={handleSubmit} autocomplete="off">
			<div class="grid gap-2">
				<Label for="passphrase-word">
					Word {currentWordIndex + 1} of {MAX_PASSPHRASE_WORDS}
				</Label>
				<InputGroup.Root>
					<InputGroup.Input
						bind:ref={inputRef}
						name="passphrase-word"
						type={inputRevealWord ? 'text' : 'password'}
						autocomplete="off"
						oninput={() => (inputError = null)}
					/>
					<InputGroup.Addon align="inline-end">
						<InputGroup.Button
							aria-label={inputRevealWord ? 'Hide passphrase word' : 'Show passphrase word'}
							type="button"
							size="icon-xs"
							onclick={() => (inputRevealWord = !inputRevealWord)}
						>
							{#if inputRevealWord}
								<EyeIcon />
							{:else}
								<EyeOffIcon />
							{/if}
						</InputGroup.Button>
					</InputGroup.Addon>
				</InputGroup.Root>
				{#if inputError}
					<p class="text-sm text-destructive">{inputError}</p>
				{/if}
			</div>
		</form>
	</Card.Content>
	<Card.Footer class="px-4">
		<Button type="submit" class="ml-auto" onclick={() => formRef?.requestSubmit()}>Continue</Button>
	</Card.Footer>
</Card.Root>
