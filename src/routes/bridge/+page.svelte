<script>
  import { enhance } from '$app/forms'
  import { addToast, cleanupToasts, dismissToast } from '$lib/toasts'
  import { toasts } from '$lib/toasts.svelte.js'
  import { onDestroy, onMount } from 'svelte'
  import { Info } from '@lucide/svelte'
  import { browser } from '$app/environment'
  import { getCookie } from '$lib/cookie'

  let { data } = $props()

  let queried = $state(false)
  let bridge = $state(null)
  let session = $state(null)

  if(browser){ session = getCookie('wave_session') }

  const dateFormatter = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'full' });
  const timeFormatter = new Intl.DateTimeFormat('en-ZA', { timeStyle: 'short' });

  onMount(() => {
    if(data?.bridge){ bridge = data.bridge }
  })

  onDestroy(() => { cleanupToasts() })
</script>

<div class="flex flex-col justify-items-start items-center p-4">
  <div class="card card-border bg-base-300 max-w-sm w-full min-w-xs">
    {#if session}
      <section class="card-body">
        <h1 class="card-title">Response Status</h1>
        <div class="w-full text-center mt-2 mb-2">
          <span class={`badge-xl  ${bridge.approved === true ? 'badge-success' : 'badge-warning'}`}>
            ${bridge.approved === true ? 'Approved' : 'Pending'}
          </span>
        </div>
        {#if new Date(bridge.start_time) > new Date()}
          <div class="stats stats-vertical shadow">
            <div class="stat place-items-center">
              <div class="stat-figure text-neutral" >
                <Calendar />
              </div>
              <div class="stat-title">Date</div>
              <div class="stat-value">{dateFormatter.format(new Date(bridge.start_time))}</div>
            </div>
            <div class="stat place-items-center">
              <div class="stat-figure text-neutral" >
                <Clock/>
              </div>
              <div class="stat-title">Time</div>
              <div class="stat-value">{timeFormatter.format(new Date(bridge.start_time))}</div>
            </div>
          </div>
        {:else if new Date(bridge.start_time) < new Date() && new Date(bridge.end_time > new Date())}
          <div class="stats stats-vertical shadow">
            <div class="stat place-items-center">
              <div class="stat-title">Ending in</div>
              <div class="stat-value"><span>{Math.ceil( (new Date(bridge.end_time).valueOf() - Date.now()) / (1000*60) )}</span></div>
              <div class="stat-desc">Minutes</div>
            </div>
          </div>
        {:else}
          <div class="stats stats-vertical shadow">
            <div class="stat place-items-center">
              <div class="stat-title">Ended</div>
              <div class="stat-value"><span>{Math.ceil( ( Date.now() - new Date(bridge.end_time).valueOf() ) / (1000*60) )}</span></div>
              <div class="stat-desc">Minutes ago</div>
            </div>
          </div>
        {/if}
        {#if bridge.approved}
          <form method="POST" action="?/logout" class="card-actions" use:enhance={({formData}) => {
            return async ({result, update}) => {
              if(result.data?.posterror){ 
                addToast({ message: result.data.posterror, type: 'error', auto: true }) 
              }
              if(result.data?.success){
                queried = false
                bridge = null
              }
              await update()
            }
          }}>
            <button type="submit" class="btn btn-outline">Logout</button>
            {#if bridge.connection_path}
              <a href={bridge.connection_path} class="btn btn-primary flex-1" >Join</a>
            {/if}
          </form>
        {/if}
      </section>
    {:else if queried}
      <section class="card-body">
        <h1 class="card-title">Response Status</h1>
        <div class="w-full text-center mt-2 mb-2">
          <span class={`badge-xl  ${bridge.approved === true ? 'badge-success' : 'badge-warning'}`}>
            ${bridge.approved === true ? 'Approved' : 'Pending'}
          </span>
        </div>
        {#if new Date(bridge.start_time) > new Date()}
          <div class="stats stats-vertical shadow">
            <div class="stat place-items-center">
              <div class="stat-figure text-neutral" >
                <Calendar />
              </div>
              <div class="stat-title">Date</div>
              <div class="stat-value">{dateFormatter.format(new Date(bridge.start_time))}</div>
            </div>
            <div class="stat place-items-center">
              <div class="stat-figure text-neutral" >
                <Clock/>
              </div>
              <div class="stat-title">Time</div>
              <div class="stat-value">{timeFormatter.format(new Date(bridge.start_time))}</div>
            </div>
          </div>
        {:else if new Date(bridge.start_time) < new Date() && new Date(bridge.end_time > new Date())}
          <div class="stats stats-vertical shadow">
            <div class="stat place-items-center">
              <div class="stat-title">Ending in</div>
              <div class="stat-value"><span>{Math.ceil( (new Date(bridge.end_time).valueOf() - Date.now()) / (1000*60) )}</span></div>
              <div class="stat-desc">Minutes</div>
            </div>
          </div>
        {:else}
          <div class="stats stats-vertical shadow">
            <div class="stat place-items-center">
              <div class="stat-title">Ended</div>
              <div class="stat-value"><span>{Math.ceil( ( Date.now() - new Date(bridge.end_time).valueOf() ) / (1000*60) )}</span></div>
              <div class="stat-desc">Minutes ago</div>
            </div>
          </div>
        {/if}
        {#if bridge.approved}
          <form method="POST" action="?/logout" class="card-actions" use:enhance={({formData}) => {
            return async ({result, update}) => {
              if(result.data?.posterror){ 
                addToast({ message: result.data.posterror, type: 'error', auto: true }) 
              }
              if(result.data?.success){
                queried = false
                bridge = null
              }
              await update()
            }
          }}>
            <button type="submit" class="btn btn-outline">Logout</button>
            {#if bridge.connection_path}
              <a href={bridge.connection_path} class="btn btn-primary flex-1" >Join</a>
            {/if}
          </form>
        {/if}
      </section>
    {:else}
      <form method="POST" action="?/auth" class="card-body" use:enhance={({formData}) => {
        return async ({result, update}) => {
          if(result.data?.posterror){ 
            addToast({ message: result.data.posterror, type: 'error', auto: true }) 
          }
          if(result.data?.bridge){
            queried = true
            bridge = result.data?.bridge
          }
          await update()
        }
      }} >
        <h1 class="card-title">Bridge Chat</h1>
        <div role="alert" class="alert alert-soft alert-warning">
          <Info />
          <span>You must have already replied to a flare with a <a href="/wave" class="link">response flare</a></span>
        </div>
        <div role="alert" class="alert alert-soft alert-info">
          <Info />
          <span>This feature can also be used to check if your reply has been accepted</span>
        </div>
        <fieldset class="fieldset">
            <label for="flare" class="label">Flare</label>
            <input name="flare" type="text" class="input w-full" placeholder="😎 worries aplenty 👨🏽‍🍳🥰" />
            <label for="counterflare" class="label">Response Flare</label>
            <input name="counterflare" type="text" class="input w-full" placeholder="😮 calmly breathe 👨🏽🧘🏽‍♀️" />
            <label for="passphrase" class="label">Anchor</label>
            <input name="passphrase" type="password" class="input w-full" placeholder="Passphrase" />
        </fieldset>
        <div class="card-actions flex-col">
          <button class="btn btn-primary mt-4 w-full">Join</button>
        </div>
      </form>
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