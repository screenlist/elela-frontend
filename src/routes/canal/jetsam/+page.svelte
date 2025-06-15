<script>
  import { CirclePlus, Eye, Info, MessageCircle, Phone } from "@lucide/svelte";
  import { enhance } from '$app/forms'
  import { addToast, cleanupToasts, dismissToast } from '$lib/toasts'
  import { toasts } from '$lib/toasts.svelte.js'
  import { onDestroy } from 'svelte'
  import { PUBLIC_SERVER } from "$env/static/public"

  let { data } = $props()
  
  let bridge = $state(null)
  let input = $state(null)
  let file = $derived(input?.[0])
  let downloads = $state(3)
  let retention = $state(1)

  let loading = $state(false)
  let total_costs = $state(0)

  function copyFlare(){
    navigator.clipboard.writeText(bridge.public_code)
    addToast({ message: 'Flare successfully copied to clipboard', type: 'success', auto: true })
  }

  $effect(async () => {
    if(file && downloads && retention){
      loading = true
      const res = await fetch(`${PUBLIC_SERVER}/jetsam/cost?size=${file.size}&downloads=${downloads}&retention=${retention}`, {
        method: 'POST'
      })
      if(!res.ok){ 
        addToast({ message: await res.text(), type: 'error', auto: true }) 
      } else {
        total_costs = (await res.json()).total_subpoints
      }
      loading = false
    }
  })

  onDestroy(() => {cleanupToasts()})

  $inspect(file).with(console.log)
</script>

<div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
  <div class="card card-border card-sm bg-base-300 w-full sm:w-1/2 md:w-2/5 lg:w-1/3 xl:w-1/4">
    <section class="card-body justify-between">
      <h2 class="card-title">Upload</h2>
      {#if total_costs > data.canal.usage.capacity - data.canal.usage.usage }
        <div role="alert" class="alert alert-warning alert-soft">
          <Info />
          <span>This action will cost more drops than available in your canal, <a class="link" href="/canal/settings/refill">please refill</a>.</span>
        </div>
      {/if}
      {#if loading}
        <div class="flex justify-center items-center h-29 w-full">
          <span class="loading loading-spinner text-neutral"></span>
        </div>
      {:else}
        <div class="stats shadow">
          <div class="stat place-items-center">
            <div class="stat-title">Costs</div>
            <div class="stat-value">{( total_costs / 100 ).toFixed(2)}</div>
            <div class="stat-desc">Drops</div>
          </div>
        </div>
      {/if}
      <fieldset class="fieldset">
        <label for="flare" class="fieldset-legend">File</label>
        <input type="file" bind:files={input} class="file-input file-input-lg" />

        <label for="flare" class="fieldset-legend">Duration</label>
        <input id="drops" name="quantity" type="range" min="1" max="24" bind:value={retention} class="range w-full" />
        <span class="label">{retention} months</span>

        <label for="flare" class="fieldset-legend">Downloads</label>
        <input id="drops" name="quantity" type="range" min="3" max="100" bind:value={downloads} class="range w-full" />
        <div class="flex">
          <button onclick={() => downloads - 100 >= 3 ? downloads -= 100 : downloads = downloads} type="button" class="btn btn-ghost uppercase flex-1">- 100</button>
          <button onclick={() => downloads += 100} type="button" class="btn btn-ghost uppercase flex-1">+ 100</button>
        </div>
        <span class="label">{downloads} downloads</span>
      </fieldset>
      <div class="card-actions justify-end">
        <button  class="btn btn-neutral uppercase w-1/2">Start</button>
      </div>
    </section>
  </div>
  <div class="flex flex-col gap-4 w-full sm:flex-1 xl:flex-row">
    <section id="active" class="card card-sm card-border min-h-lvh bg-base-300 xl:flex-1">
      <div class="card-body">
        <h3 class="card-title">Files</h3>
      </div>
    </section>
  </div>
</div>