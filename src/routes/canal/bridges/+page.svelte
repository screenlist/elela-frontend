<script>
  import { CirclePlus, Eye, Info, MessageCircle, Phone } from "@lucide/svelte";
  import { enhance } from '$app/forms'
  import { addToast, cleanupToasts, dismissToast } from '$lib/toasts'
  import { toasts } from '$lib/toasts.svelte.js'
  import { onDestroy } from 'svelte'

  let { data } = $props()
  
  let bridge = $state(null)
  let date = $state(new Date(Date.now() + 1000*60*5))
  let date_string = $derived(date.toISOString().split('T')[0])
  let time_string = $derived(`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`)

  function copyFlare(){
    navigator.clipboard.writeText(bridge.public_code)
    addToast({ message: 'Flare successfully copied to clipboard', type: 'success', auto: true })
  }

  onDestroy(() => {cleanupToasts()})
</script>
  
<div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
  <div class="card card-border card-sm bg-base-300 w-full sm:w-1/2 md:w-2/5 lg:w-1/3 xl:w-1/4">
    <form id="new" class="card-body justify-between" method="POST" action="?/bridge" use:enhance={({formData}) => {
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
          <input name="flare" autocomplete="off" type="text" class="input w-full" placeholder="worries aplenty" />
          <div class="divider"></div>
          <p class="fieldset-legend">Schedule</p>
          <label for="date" class="label">Date</label>
          <input id="date" name="date" bind:value={date_string} type="date" class="input w-full" />
          <label for="time" class="label">Time</label>
          <input id="time" name="time" bind:value={time_string} type="time" class="input w-full" />
        </fieldset>
        <div class="card-actions justify-end">
          <button type="submit" class="btn btn-neutral uppercase w-1/2">Create</button>
        </div>
      {/if}
    </form>
  </div>
  <div class="flex flex-col gap-4 w-full sm:flex-1 xl:flex-row">
    <section id="active" class="card card-sm card-border bg-base-300 xl:flex-1">
      <div class="card-body">
        <h3 class="card-title">Active</h3>
        {#if data.active?.length === 0}
          <figure>
            <img src="/friends.svg" alt="An illustration a person sitting in a garden with their pet" />
          </figure>
        {:else}
          <ul class="list bg-base-100 rounded-box shadow-md">
            {#each data.active as data}
              <li class="list-row">
                <div><span class="text-4xl">{data.flare.split(' ')[0]}</span></div>
                <div>
                  <div>{data.flare}</div>
                  <div class="text-xs uppercase font-semibold opacity-60">Ends in {Math.ceil( (new Date(data.end_time).valueOf() - Date.now()) / (1000*60) )} mins</div>
                </div>
                <a href={`/canal/bridges/${data.id.split(':')[1]}`} class="btn btn-square btn-ghost">
                  <Eye />
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </section>
    <section id="upcoming" class="card card-sm card-border bg-base-300 xl:flex-1">
      <div class="card-body">
        <h3 class="card-title">Upcoming</h3>
        {#if data.upcoming.length === 0}
          <figure>
            <img src="/friends.svg" alt="An illustration a person sitting in a garden with their pet" />
          </figure>
        {:else}
          <ul class="list bg-base-100 rounded-box shadow-md">
            {#each data.upcoming as data}
              <li class="list-row">
                <div><span class="text-4xl">{data.flare.split(' ')[0]}</span></div>
                <div>
                  <div>{data.flare}</div>
                  <div class="text-xs uppercase font-semibold opacity-60">Starts in {Math.ceil( (new Date(data.start_time).valueOf() - Date.now()) / (1000*60) )} mins</div>
                </div>
                <a href={`/canal/bridges/${data.id.split(':')[1]}`} class="btn btn-square btn-ghost">
                  <Eye />
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </section>
  </div>
</div>
<div class="toast toast-top toast-center">
  {#each toasts as toast (toast.id) }
    <div class={`alert alert-${toast.type}`}>
      <span>{toast.message}</span>
    </div>
  {/each}
</div>