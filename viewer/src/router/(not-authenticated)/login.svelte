<script lang="ts">
	import router from 'page';

	import { LoginForm } from '$features/login-form';
</script>

<main class="mx-auto grid h-screen w-full max-w-md place-items-center px-4">
	<LoginForm onSubmit={() => router.show('/')} />
</main>
