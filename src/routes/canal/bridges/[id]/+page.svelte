<script>
  import { Calendar, Clock, Info } from "@lucide/svelte"
  import { addToast, cleanupToasts, dismissToast } from '$lib/toasts'
  import { toasts } from '$lib/toasts.svelte.js'
  import { onDestroy } from 'svelte'
  import { addToCalendar } from '$lib/event'
  import { enhance } from "$app/forms"

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
        {#if data.bridge.connections < 1}
          <div class="stats shadow">
            <div class="stat place-items-center">
              <div class="stat-title">Responses</div>
              <div class="stat-value">{data.bridge.responses}</div>
            </div>
          </div>
        {:else}
          <ul class="list bg-base-100 rounded-box shadow-md">
            <li class="list-row">
              <div><span class="text-4xl">{Array.from(data.connection.counterflare.split(' ')[0])[0]}</span></div>
              <div>
                <div>{data.connection.counterflare}</div>
                <div class="text-xs uppercase font-semibold opacity-60">Connected</div>
              </div>
              <a href={`/bridge/${data.connection.connection_id.split(':')[1]}`} class="btn btn-square btn-outline">
                Join
              </a>
            </li>
          </ul>
        {/if}
        <div class="card-actions">
          <a href="/canal/bridges" class="btn btn-outline flex-1">Back</a>
          <button onclick={copyFlare} type="button" class="btn btn-accent flex-1">Share</button>
          {#if data.bridge.connections < 1}
            <button onclick={() => { connect = true }} type="button" class="btn btn-primary flex-1">Connect</button>
          {/if}
        </div>
      </section>
    {:else}
      <form class="card-body" action="?/connect" method="POST" use:enhance={({formData}) => {
        return async ({result, update}) => {
          if(result.data?.posterror){ 
            addToast({ message: result.data.posterror, type: 'error', auto: true }) 
          }
          if(result.data?.success === true){
            connect = false
          }
          await update()
        }
      }}>
        <h1 class="card-title">Connect</h1>
        <fieldset class="fieldset">
          <label for="counterflare" class="label">Response Flare</label>
          <input name="counterflare" type="text" class="input w-full" placeholder="😮 calmly breathe 👨🏽🧘🏽‍♀️" />
          <div role="alert" class="alert alert-soft alert-info">
            <Info />
            <span>This is the response flare that you want to establish connection with</span>
          </div>
        </fieldset>
        <div class="card-actions">
          <button type="submit" class="btn btn-accent flex-1">Approve</button>
        </div>
      </form>
    {/if}
  </div>
</div>
<div class="toast toast-top toast-center">
  {#each toasts as toast (toast.id) }
    <div class={`alert alert-${toast.type}`}>
      <span>{toast.message}</span>
    </div>
  {/each}
</div>