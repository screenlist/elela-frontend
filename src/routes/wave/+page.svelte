<script>
  import { Calendar, Clock, Info } from '@lucide/svelte'
  import { enhance } from '$app/forms'
  import { addToast, cleanupToasts, dismissToast } from '$lib/toasts'
  import { toasts } from '$lib/toasts.svelte.js'
  import { onDestroy } from 'svelte'
  import { addToCalendar } from '$lib/event'

  let wave = $state(null)

  function copyFlare(){
    navigator.clipboard.writeText(wave.counterflare)
    addToast({ message: 'Response flare successfully copied to clipboard', type: 'success', auto: true })
  }

  function saveEvent(){ addToCalendar({
    title: `Meet with ${wave.flare}`,
    start: new Date(wave.start_time),
    end: new Date(wave.end_time),
    location: 'Elela',
    description: `Their flare was '${wave.flare}' and you replied with '${wave.counterflare}', visit app.elela.online/bridge to join the chat or check to if you have been accepted.`
  }) }

  const dateFormatter = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'full' });
  const timeFormatter = new Intl.DateTimeFormat('en-ZA', { timeStyle: 'short' });

  onDestroy(() => {cleanupToasts()})
</script>

<div class="flex flex-col justify-items-start items-center p-4">
  <div class="card card-border bg-base-300 max-w-sm w-full min-w-xs">
    <form class="card-body" method="POST" action="?/wave" use:enhance={({formData}) => {
      return async ({result, update}) => {
        console.log(result)
        if(result.data?.posterror){ 
          addToast({ message: result.data.posterror, type: 'error', auto: true }) 
        }
        wave = result.data?.wave
        await update()
      }
    }}>
      {#if wave}
        <h1 class="card-title">Share the Response Flare</h1>
        <div role="alert" class="alert alert-soft alert-info">
          <Info />
          <span>Copy the response flare below as it is & share it with person who gave you the flare</span>
        </div>
        <span class="font-mono w-full p-4 bg-base-300 font-semibold text-center text-base border-dashed border-1 rounded-lg border-neutral">{wave.counterflare}</span>
        <div class="card-actions flex-col">
          <button type="button" onclick={copyFlare} class="btn btn-accent w-full">Copy</button>
        </div>
        <div class="divider"></div>
        <div class="stats stats-vertical shadow">
          <div class="stat place-items-center">
            <div class="stat-figure text-neutral" >
              <Calendar />
            </div>
            <div class="stat-title">Date</div>
            <div class="stat-value">{dateFormatter.format(new Date(wave.start_time))}</div>
          </div>
          <div class="stat place-items-center">
            <div class="stat-figure text-neutral" >
              <Clock/>
            </div>
            <div class="stat-title">Time</div>
            <div class="stat-value">{timeFormatter.format(new Date(wave.start_time))}</div>
          </div>
        </div>
        <div class="card-actions">
          <button type="button" onclick={saveEvent} class="btn btn-secondary flex-1">Download Calendar Event</button>
        </div>
        <div class="divider"></div>
        <div class="card-actions flex-col">
          <a href="/bridge" onclick={() => wave = null} class="btn btn-neutral w-full">Join Bridge</a>
          <button type="button" onclick={() => wave = null} class="btn btn-outline w-full">Respond Again</button>
        </div>
      {:else}
        <h1 class="card-title">Response Flare</h1>
        <fieldset class="fieldset">
          <label for="flare" class="fieldset-legend">Flare</label>
          <span class="label">The initial phrase as exposed to you by a sailor</span>
          <input id="flare" name="flare" type="text" class="input w-full" placeholder="😎 worries aplenty 👨🏽‍🍳🥰" />
          <div class="divider"></div>
          <label for="counterflare" class="fieldset-legend">Response Flare</label>
          <span class="label">A two word reply phrase of at least 4 letters each</span>
          <input id="counterflare" name="counterflare" type="text" class="input w-full" placeholder="calmly breathe" />
          <div role="alert" class="alert alert-soft alert-info">
            <Info />
            <span>The phrase will form a part of the counterflare which you must show to the creator of the flare</span>
          </div>
          <div class="divider"></div>
          <label for="passphrase" class="fieldset-legend">Anchor</label>
          <p class="label">A private passphrase you will need to join a bridge chat</p>
          <input id="passphrase" name="passphrase" type="password" class="input w-full" placeholder="Passphrase" />
          <div role="alert" class="alert alert-soft alert-info">
            <Info />
            <span>Never share the passphrase with anyone, treat it like your password and do not forget it</span>
          </div>
        </fieldset>
        <div class="card-actions flex-col">
          <button type="submit" class="btn btn-primary mt-4 w-full">Respond</button>
        </div>
      {/if}
    </form>
  </div>
</div>
<div class="toast toast-top toast-center">
  {#each toasts as toast (toast.id) }
    <div class={`alert alert-${toast.type}`}>
      <span>{toast.message}</span>
    </div>
  {/each}
</div>