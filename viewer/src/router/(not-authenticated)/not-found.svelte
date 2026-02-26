<script lang="ts">
	import router from 'page';

	import { Button } from '$lib/components/ui/button/index.js';
</script>

<main class="mx-auto grid h-screen w-full max-w-md place-items-center px-4">
	<div class="flex w-full flex-col items-center gap-6 py-8 text-center">
		<h1 class="text-4xl font-bold tracking-tight text-foreground">404</h1>
		<p class="text-muted-foreground">You've ventured into the unknown digital realm</p>

		<Button onclick={() => router.redirect('/login')}>Back to Login</Button>
	</div>
</main>
