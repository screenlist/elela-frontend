<script>
	import { page } from '$app/state';
  import { TriangleAlert } from '@lucide/svelte'
</script>

<div class="flex flex-col justify-center w-full h-full items-center p-4">
  <figure class="w-full max-w-sm">
    <img src="/deadend.svg" alt="An illustration with the cancel icon">
  </figure>
  <span class="alert alert-soft alert-error mt-4">
    <TriangleAlert />
    <h1 class="text-lg">{page.status}: {page.error.message}</h1>
  </span>
</div>
