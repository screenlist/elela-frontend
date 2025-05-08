<script>
	import { page } from '$app/state';
  import { TriangleAlert } from '@lucide/svelte'
</script>

<div class="flex flex-col justify-center items-center p-4">
  <span class="alert alert-soft alert-error">
    <TriangleAlert />
    <h1 class="text-lg">{page.status}: {page.error.message}</h1>
  </span>
  
</div>
