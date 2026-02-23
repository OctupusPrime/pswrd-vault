<script lang="ts">
	import router from 'page';
	import { onDestroy, onMount } from 'svelte';

	import { vault } from '$lib/stores/vault.svelte';
	import { INACTIVITY_AUTO_LOCK_MS, INVISIBILITY_AUTO_HIDE_MS } from '$lib/consts';

	interface Props {
		children: () => any;
	}

	let { children }: Props = $props();

	let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
	let hiddenTimer: ReturnType<typeof setTimeout> | null = null;

	const clearTimers = () => {
		if (inactivityTimer) {
			clearTimeout(inactivityTimer);
			inactivityTimer = null;
		}
		if (hiddenTimer) {
			clearTimeout(hiddenTimer);
			hiddenTimer = null;
		}
	};

	const lockVault = () => {
		clearTimers();
		vault.lock();
		router.show('/login');
	};

	const resetInactivityTimer = () => {
		if (inactivityTimer) clearTimeout(inactivityTimer);
		inactivityTimer = setTimeout(lockVault, INACTIVITY_AUTO_LOCK_MS);
	};

	const handleVisibilityChange = () => {
		if (document.hidden) {
			hiddenTimer = setTimeout(lockVault, INVISIBILITY_AUTO_HIDE_MS);
		} else {
			if (hiddenTimer) {
				clearTimeout(hiddenTimer);
				hiddenTimer = null;
			}
			resetInactivityTimer();
		}
	};

	onMount(resetInactivityTimer);
	onDestroy(clearTimers);
</script>

<svelte:document
	onvisibilitychange={handleVisibilityChange}
	onmousemove={resetInactivityTimer}
	onmousedown={resetInactivityTimer}
	onkeydown={resetInactivityTimer}
	ontouchstart={resetInactivityTimer}
	onscroll={resetInactivityTimer}
/>

{@render children()}
