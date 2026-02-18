<script lang="ts">
  import router from "page";

  import { LoginForm } from "$features/login-form";
</script>

<main class="max-w-md w-full mx-auto h-screen grid place-items-center px-4">
  <LoginForm onSubmit={() => router.redirect("/")} />
</main>
