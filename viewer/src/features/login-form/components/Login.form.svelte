<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";

  import { Button } from "$lib/components/ui/button/index.js";
  import * as Kbd from "$lib/components/ui/kbd/index.js";

  import { vault } from "$lib/stores/vault.svelte";

  let { onSubmit }: { onSubmit?: () => void } = $props();

  const MAX_PASSPHRASE_WORDS = 12;

  let passphrase = $state<string[]>([]);
  let currentWordIndex = $state(0);

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
    const word = formData.get("passphrase-word") as string;

    if (!word || word.trim() === "") {
      errorMessage = "Word cannot be empty";
      return;
    }

    passphrase[currentWordIndex] = word.trim();

    if (currentWordIndex < MAX_PASSPHRASE_WORDS - 1) {
      currentWordIndex += 1;
      (event.currentTarget as HTMLFormElement).reset();
      return;
    }

    try {
      await vault.unlock(passphrase.join(" "));
      onSubmit?.();
    } catch (error) {
      errorMessage = "Invalid passphrase. Please try again.";
      currentWordIndex = 0;
    } finally {
      // Clear passphrase from memory
      passphrase = [];
    }
  }
</script>

<form onsubmit={handleSubmit} class="space-y-4 w-full" autocomplete="off">
  <h1 class="font-bold text-5xl">
    {currentWordIndex + 1} / {MAX_PASSPHRASE_WORDS}
  </h1>
  <p class="mt-2 text-muted-foreground text-base">
    Enter your passphrase one word at a time. Press <Kbd.Root>Enter</Kbd.Root>
    after each word to continue.
  </p>
  {#key currentWordIndex}
    <input
      autofocus
      name="passphrase-word"
      type="password"
      autocomplete="one-time-code"
      class="outline-none border-b border-input w-full text-2xl pb-2"
      defaultValue={passphrase[currentWordIndex] ?? ""}
      oninput={() => (errorMessage = null)}
    />
  {/key}
  {#if errorMessage}
    <p class="text-destructive text-sm">{errorMessage}</p>
  {/if}
  <div class="flex items-center gap-2">
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

    <Button class="ml-auto">Continue</Button>
  </div>
</form>
