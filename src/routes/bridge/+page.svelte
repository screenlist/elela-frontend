<script>
  import { enhance } from '$app/forms'
  import { addToast, cleanupToasts, dismissToast } from '$lib/toasts'
  import { toasts } from '$lib/toasts.svelte.js'
  import { onDestroy, onMount } from 'svelte'
  import { Info, Calendar, Clock } from '@lucide/svelte'
  import { browser } from '$app/environment'
  import { getCookie } from '$lib/cookie'
  import { invalidateAll } from '$app/navigation'
  import { argon2id } from 'hash-wasm'
  import { decodeHex } from '@std/encoding'
  import { PUBLIC_SERVER } from '$env/static/public'
  import database from '$lib/surrealdb'

  let { data } = $props()

  let queried = $state(false)
  let bridge = $state(null)
  let session = $state(null)
  let loading = $state(false)

  let counterflare = $state('')
  let flare = $state('')
  let passphrase = $state('')

  let salt = $state(null)

  const dateFormatter = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium' });
  const timeFormatter = new Intl.DateTimeFormat('en-ZA', { timeStyle: 'short' });

  async function getSalt(){
    loading = true
    const res = await fetch(`${PUBLIC_SERVER}/canal/wave/salt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ counterflare, flare })
    })

    if(!res.ok){  
      loading = false
      addToast({ message: await res.text(), type: 'error', auto: true }) 
    } else {
      const wave = await res.json()
      salt = wave.secret_salt
      loading = false
    }
  }

  onMount(() => {
    if(data?.bridge){ 
      bridge = data.bridge 
    }
    session = getCookie('wave_session')
  })

  onDestroy(() => { cleanupToasts() })
</script>

<svelte:head>
  <title>Elela - Join a Bridge</title>
	<meta name="description" content="Join an anonymous bridge meeting." />
</svelte:head>

<div class="flex flex-col justify-items-start items-center">
  <div class="card card-border bg-base-300 max-w-sm w-full min-w-xs">
    {#if data?.bridge}
      <section class="card-body">
        <h1 class="card-title">Response status</h1>
        <div class="w-full text-center mt-2 mb-2">
          <span class={`badge-xl badge ${data.bridge.approved === true ? 'badge-success' : 'badge-warning'}`}>
            {data.bridge.approved === true ? 'Approved' : 'Pending'}
          </span>
        </div>
        {#if new Date(data.bridge.start_time) > new Date()}
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
        {:else if new Date(data.bridge.start_time) < new Date() && new Date(data.bridge.end_time > new Date())}
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
              <div class="stat-title">Ended</div>
              <div class="stat-value"><span>{Math.ceil( ( Date.now() - new Date(data.bridge.end_time).valueOf() ) / (1000*60) )}</span></div>
              <div class="stat-desc">Minutes ago</div>
            </div>
          </div>
        {/if}
        {#if data.bridge.approved}
          <form method="POST" action="?/logout" class="card-actions" use:enhance={({formData}) => {
            loading = true
            return async ({result, update}) => {
              if(result.data?.posterror){ 
                addToast({ message: result.data.posterror, type: 'error', auto: true }) 
              }
              if(result.data?.success){
                queried = false
                bridge = null
              }
              await update()
              loading = false
            }
          }}>
            <button type="submit" class="btn btn-outline">Logout</button>
            {#if data.bridge.connection_id}
              <a href={`/bridge/${data.bridge.connection_id}`} class="btn btn-primary flex-1" >Join</a>
            {/if}
          </form>
        {/if}
      </section>
    {:else if queried}
      <section class="card-body">
        <h1 class="card-title">Response status</h1>
        <div class="w-full text-center mt-2 mb-2">
          <span class={`badge badge-xl  ${bridge.approved === true ? 'badge-success' : 'badge-warning'}`}>
            {bridge.approved === true ? 'Approved' : 'Pending'}
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
            loading = true
            return async ({result, update}) => {
              if(result.data?.posterror){ 
                addToast({ message: result.data.posterror, type: 'error', auto: true }) 
              }
              if(result.data?.success){
                queried = false
                bridge = null
              }
              await update()
              loading = false
            }
          }}>
            <button type="submit" class="btn btn-outline">Logout</button>
            {#if bridge.connection_id}
              <a href={`/bridge/${data.bridge.connection_id}`} class="btn btn-primary flex-1" >Join</a>
            {/if}
          </form>
        {/if}
      </section>
    {:else}
      <form method="POST" action="?/auth" class="card-body" use:enhance={async ({formData}) => {
        loading = true
        if(!salt || passphrase.length < 1){
          addToast({ message: 'The anchor must be at least 10 characters long', type: 'error', auto: true }) 
          cancel()
          loading = false
        } else { 
          const hash = await argon2id({
            password: passphrase,
            salt: decodeHex(salt),
            memorySize: 64000,
            iterations: 3,
            hashLength: 32,
            outputType: 'hex',
            parallelism: 1
          })

          const db = await database()
          db.upsert(new RecordId('crypto', 'wave'), {key: hash}).catch(err => {
            addToast({ message: 'Failed to save encryption keys', type: 'error', auto: true }) 
            cancel()
            loading = false
          })

          formData.append('passphrase', hash)
          formData.append('flare', flare)
          formData.append('counterflare', counterflare)
        }
        return async ({result, update}) => {
          if(result.data?.posterror){ 
            const db = await database()
            await db.delete(new RecordId('crypto', 'wave'))
            addToast({ message: result.data.posterror, type: 'error', auto: true }) 
          }
          if(result.data?.bridge){
            queried = true
            bridge = result.data?.bridge
          } else {
            const db = await database()
            await db.delete(new RecordId('crypto', 'wave'))
          }
          await update()
          loading = false
        }
      }} >
        <h1 class="card-title">Bridge meeting</h1>
        <div role="alert" class="alert alert-soft alert-warning">
          <Info />
          <span>You must have already replied to a flare with a <a href="/wave" class="link">response flare</a></span>
        </div>
        <div role="alert" class="alert alert-soft alert-info">
          <Info />
          <span>This feature can also be used to check if your reply has been accepted</span>
        </div>
        <fieldset class="fieldset">
          {#if salt}
            <label for="passphrase" class="label">Anchor</label>
            <input bind:value={passphrase} autocomplete="off" type="password" class="input w-full" placeholder="Passphrase" />
          {:else}
            <label for="flare" class="label">Flare</label>
            <input id="flare" bind:value={flare} autocomplete="off" type="text" class="input w-full" placeholder="😎 worries aplenty 👨🏽‍🍳🥰" />
            <label for="counterflare" class="label">Response Flare</label>
            <input id="counterflare" bind:value={counterflare} autocomplete="off" type="text" class="input w-full" placeholder="😮👨🏽 calmly breathe 🧘🏽‍♀️" />
          {/if}
        </fieldset>
        <div class="card-actions justify-end">
          {#if salt}
            <button disabled={loading} class={`btn btn-primary mt-4 w-full`} type="submit">Join</button>
          {:else}
            <button onclick={getSalt} disabled={loading} class={`btn btn-primary mt-4`} type="button">Continue</button>
          {/if}
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
{#if loading}
  <div class="toast toast-top toast-center">
    <div class={`btn btn-primary btn-circle`}>
      <span class="loading loading-spinner loading-md"></span>
    </div>
  </div>
{/if}