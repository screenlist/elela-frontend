<script>
  import { Calendar, Clock } from "@lucide/svelte"
  import { addToast, cleanupToasts, dismissToast } from '$lib/toasts'
  import { toasts } from '$lib/toasts.svelte.js'
  import { onDestroy } from 'svelte'
  import { addToCalendar } from '$lib/event'

  let { data } = $props()
  let connect = $state(false) 

  function copyFlare(){
    navigator.clipboard.writeText(data.bridge.flare)
    addToast({ message: 'Flare successfully copied to clipboard', type: 'success', auto: true })
  }

  const dateFormatter = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'full' });
  const timeFormatter = new Intl.DateTimeFormat('en-ZA', { timeStyle: 'short' });

  onDestroy(() => { cleanupToasts() })
</script>

<div class="flex flex-col justify-items-start items-center p-4">
  <div class="card card-border bg-base-300 max-w-md w-full min-w-xs">
    {#if connect ===  false}
      <section class="card-body">
        <h1 class="card-title">{data.bridge.flare}</h1>
        {#if new Date(data.bridge.start_time) < new Date() && new Date(data.bridge.end_time > new Date())}
          <div class="stats stats-vertical shadow">
            <div class="stat place-items-center">
              <div class="stat-title">Ending in</div>
              <div class="stat-value"><span>{Math.ceil( (new Date(data.bridge.end_time).valueOf() - Date.now()) / (1000*60) )}</span></div>
              <div class="stat-desc">Minutes</div>
            </div>
          </div>
        {:else}
          <div class="stats stats-vertical shadow">
            <div class="stat place-items-center">
              <div class="stat-figure text-neutral" >
                <Calendar />
              </div>
              <div class="stat-title">Date</div>
              <div class="stat-value">{dateFormatter.format(new Date(data.bridge.start_time))}</div>
            </div>
            <div class="stat place-items-center">
              <div class="stat-figure text-neutral" >
                <Clock/>
              </div>
              <div class="stat-title">Time</div>
              <div class="stat-value">{timeFormatter.format(new Date(data.bridge.start_time))}</div>
            </div>
          </div>
        {/if}
        <div class="stats shadow">
          <div class="stat place-items-center">
            <div class="stat-title">Connections</div>
            <div class="stat-value">{data.bridge.connections}</div>
          </div>
          <div class="stat place-items-center">
            <div class="stat-title">Responses</div>
            <div class="stat-value">{data.bridge.responses}</div>
          </div>
        </div>
        <div class="card-actions">
          <a href="/canal/bridges" class="btn btn-outline flex-1">Back</a>
          <button onclick={copyFlare} type="button" class="btn btn-accent flex-1">Share</button>
          <button type="button" class="btn btn-primary flex-1">Connect</button>
        </div>
      </section>
    {/if}
  </div>
</div>
<div class="toast toast-bottom toast-center">
  {#each toasts as toast (toast.id) }
    <div class={`alert alert-${toast.type}`}>
      <span>{toast.message}</span>
    </div>
  {/each}
</div>