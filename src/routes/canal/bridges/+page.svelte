<script>
  import { CirclePlus, Eye, Info, MessageCircle, Phone } from "@lucide/svelte";
  import { enhance } from '$app/forms'
  import { addToast, cleanupToasts, dismissToast } from '$lib/toasts'
  import { toasts } from '$lib/toasts.svelte.js'
  import { onDestroy } from 'svelte'

  let { data } = $props()
  
  let bridge = $state(null)

  function copyFlare(){
    navigator.clipboard.writeText(bridge.public_code)
    addToast({ message: 'Flare successfully copied to clipboard', type: 'success', auto: true })
  }

  onDestroy(() => {cleanupToasts()})
</script>
  
<div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
  <div class="card card-border card-sm bg-base-300 w-full sm:w-1/2 md:w-2/5 lg:w-1/3 xl:w-1/4">
    <form class="card-body justify-between" method="POST" action="?/bridge" use:enhance={({formData}) => {
      return async ({result, update}) => {
        console.log(result)
        if(result.data?.posterror){ 
          addToast({ message: result.data.posterror, type: 'error', auto: true }) 
        }
        bridge = result.data?.new_bridge
        await update()
      }
    }}>
      {#if bridge}
        <h2 class="card-title">Share the flare</h2>
        <div role="alert" class="alert alert-soft alert-info">
          <Info />
          <span>Copy the flare below as it is & must be used as an invitation code to join the bridge</span>
        </div>
        <span class="font-mono w-full p-4 bg-base-300 font-semibold text-center text-base border-dashed border-1 rounded-lg border-neutral">{bridge.public_code}</span>
        <div class="card-actions flex-col">
          <button type="button" onclick={copyFlare} class="btn btn-accent w-full">Copy</button>
          <button type="button" onclick={() => bridge = null} class="btn btn-success w-full">Another Bridge?</button>
        </div>
      {:else}
        <h2 class="card-title">Create a Bridge Chat</h2>
        <fieldset class="fieldset">
          <label for="flare" class="fieldset-legend">Flare</label>
          <span class="label">A two word phrase of at least 4 letters each</span>
          <input name="flare" type="text" class="input w-full" placeholder="worries aplenty" />
          <div class="divider"></div>
          <p class="fieldset-legend">Schedule</p>
          <label for="date" class="label">Date</label>
          <input id="date" name="date" type="date" class="input w-full" />
          <label for="time" class="label">Time</label>
          <input id="time" name="time" type="time" class="input w-full" />
        </fieldset>
        <div class="card-actions justify-end">
          <button type="submit" class="btn btn-neutral uppercase w-1/2">Create</button>
        </div>
      {/if}
    </form>
  </div>
  <div class="flex flex-col gap-4 w-full sm:flex-1 xl:flex-row">
    <section class="card card-sm card-border bg-base-300 xl:flex-1">
      <div class="card-body">
        <h3 class="card-title">Active</h3>
        <ul class="list bg-base-100 rounded-box shadow-md">
          {#each data.active as data}
            <li class="list-row">
              <div><span class="text-4xl">{data.flare.split(' ')[0]}</span></div>
              <div>
                <div>{data.flare}</div>
                <div class="text-xs uppercase font-semibold opacity-60">Ends in {Math.ceil( (new Date(data.end_time).valueOf() - Date.now()) / (1000*60) )} mins</div>
              </div>
              <button class="btn btn-square btn-ghost">
                <Eye />
              </button>
            </li>
          {/each}
        </ul>
      </div>
    </section>
    <section class="card card-sm card-border bg-base-300 xl:flex-1">
      <div class="card-body">
        <h3 class="card-title">Upcoming</h3>
        <ul class="list bg-base-100 rounded-box shadow-md">
          {#each data.upcoming as data}
            <li class="list-row">
              <div><span class="text-4xl">{data.flare.split(' ')[0]}</span></div>
              <div>
                <div>{data.flare}</div>
                <div class="text-xs uppercase font-semibold opacity-60">Starts in {Math.ceil( (new Date(data.start_time).valueOf() - Date.now()) / (1000*60) )} mins</div>
              </div>
              <button class="btn btn-square btn-ghost">
                <Eye />
              </button>
            </li>
          {/each}
        </ul>
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