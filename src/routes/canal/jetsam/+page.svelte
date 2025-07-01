<script>
  import { CirclePlus, Download, Eye, Info, MessageCircle, Phone } from "@lucide/svelte";
  import { enhance } from '$app/forms'
  import { addToast, cleanupToasts, dismissToast } from '$lib/toasts'
  import { toasts } from '$lib/toasts.svelte.js'
  import { onDestroy, onMount } from 'svelte'
  import { PUBLIC_SERVER } from "$env/static/public"
  import Icon from "$lib/Icon.svelte"
  import extend_session from "$lib/extend_session"

  let { data } = $props()
  
  let bridge = $state(null)
  let input_file = $state(null)
  let input_value = $state(null)
  let file = $derived(input_file ? input_file[0] : null)
  let downloads = $state(3)
  let retention = $state(1)

  let loading = $state(false)
  let total_costs = $state(0)

  function copyFlare(){
    navigator.clipboard.writeText(bridge.public_code)
    addToast({ message: 'Flare successfully copied to clipboard', type: 'success', auto: true })
  }

  function startUpload(){

  }
  
  $effect(async () => {
    if(file){
      extend_session()
      loading = true
      const size = file.size

      if(size >  40 * (1024 ** 3)) {
        addToast({ message: 'Files bigger than 40GB are not accepted', type: 'error', auto: true }) 
        loading = false
        input_file = null
        input_value = null
        total_costs = 0
        return
      }
      
      const res = await fetch(`${PUBLIC_SERVER}/jetsam/cost?size=${file.size}&downloads=${downloads}&retention=${retention}`, {
        method: 'POST',
        credentials: 'include'
      })
      if(!res.ok){ 
        addToast({ message: await res.text(), type: 'error', auto: true }) 
      } else {
        total_costs = (await res.json()).total_subpoints
      }
      loading = false
    }
  })

  onMount(async () => { console.log((await navigator.storage.estimate()).quota/1024 ** 3) })

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
        <label for="flare" class="fieldset-legend">Cargo</label>
        <input type="file" bind:value={input_value} bind:files={input_file} class="file-input file-input-lg" />

        <label for="flare" class="fieldset-legend">Duration</label>
        <input disabled={typeof input_value !== 'string' ? true : false} id="drops" name="quantity" type="range" min="1" max="36" bind:value={retention} class="range w-full" />
        <span class="label">{retention} months</span>

        <label for="flare" class="fieldset-legend">Downloads</label>
        <input disabled={typeof input_value !== 'string' ? true : false} id="drops" name="quantity" type="range" min="3" max="100" bind:value={downloads} class="range w-full" />
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
    <section id="active" class="card card-sm card-border h-[calc(100vh-2rem)] sm:h-[calc(100vh-18.75rem)] xl:h-[calc(100vh-12rem)]  bg-base-300 xl:flex-1">
      <div class="card-body h-full">
        <h3 class="card-title">Files</h3>
        {#if data.active.length < 1}
          <figure class="w-full flex-1 items-center justify-center">
            <img class="sm:max-w-sm" src="/friends.svg" alt="An illustration a person sitting in a garden with their pet" />
          </figure>
        {:else}
          <div class="h-full overflow-y-auto w-full">
            <ul class="list bg-base-100 rounded-box shadow-md">
              {#each data.active as cargo}
                <li class="list-row">
                  <div>
                    <Icon typeInput={cargo.content_type} />
                  </div>
                  <div>
                    <div>{cargo.name}</div>
                    <div class="text-xs uppercase font-semibold opacity-60">Ends in {Math.ceil( (new Date(data.end_time).valueOf() - Date.now()) / (1000*60) )} mins</div>
                  </div>
                  <button class="btn btn-square btn-ghost">
                    <Download />
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </section>
  </div>
</div>

<div class="toast toast-bottom toast-center">
  {#each toasts as toast (toast.id) }
    <div class={`alert alert-${toast.type}`}>
      <span>{toast.message}</span>
    </div>
  {/each}
</div>