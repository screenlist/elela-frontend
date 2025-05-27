<script>
  import { goto } from '$app/navigation'
  import { setupSessionTimers, clearSessionTimers } from '$lib/session'
  import { session } from '$lib/expiry.svelte'
  import { Clock, Lock, LockOpen } from '@lucide/svelte';
    import { setActivity } from '$lib/active.svelte.js';

  let { data } = $props()
  async function onExit(){
    await fetch(`/canal/settings/logout`, { method: 'POST' })
    goto('/')
    session.expiry = null
    setActivity(false)
    clearSessionTimers()
  }
  console.log(new Date(data.canal.usage.created_at).valueOf() + 1000*60*60*24*3, new Date( new Date(data.canal.usage.created_at) + 1000*60*60*24*3 ).toLocaleDateString('en-ZA', { hour: 'numeric', minute: 'numeric', second: 'numeric' }))
</script>

<div class="flex flex-col justify-items-start p-4">
  <div class="card card-border card-sm bg-base-300 max-w-sm w-full min-w-xs">
    <section class="card-body">
      <h2 class="card-title uppercase">Canal {data.canal.usage.id}</h2>
      <div class="flex flex-row gap-4 mt-2 mb-2">
        <div class="badge badge-neutral">{data.canal.usage.is_premium ? 'Premium' : 'Free'}</div>
        {#if data.canal.usage.is_premium}
          <div class={`badge ${data.canal.usage.totp_enabled ? 'badge-success' : 'badge-warning'}`}>
            {#if data.canal.usage.totp_enabled}
              <Lock size={18}/>
            {:else}
              <LockOpen size={18}/>
            {/if}
            {data.canal.usage.totp_enabled ? 'Access Secured' : 'Access Not Secured'}
          </div>
        {:else}
          <div class={`badge badge-warning`}>
            <Clock size={18}/>
            {`${new Date( new Date(data.canal.usage.created_at).valueOf() + 1000*60*60*24*3 ).toLocaleDateString('en-ZA', { hour: 'numeric', minute: 'numeric', second: 'numeric' })}`}
          </div>
        {/if}
      </div>
      <div class="fieldset">
        <p class="label">Drops usage</p>
        <progress class="progress w-full" value={data.canal.usage.capacity - data.canal.usage.usage} max={data.canal.usage.capacity}></progress>
      </div>
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-value">{( data.canal.usage.usage / 100 ).toFixed(2)}</div>
          <div class="stat-desc">Used</div>
        </div>
        <div class="stat">
          <div class="stat-value">{( data.canal.usage.capacity / 100 ).toFixed(2)}</div>
          <div class="stat-desc">Total</div>
        </div>
      </div>
      <div class="card-actions">
        {#if data.canal.usage.is_premium}
          <a href="/canal/settings/refill" class="btn btn-neutral uppercase w-full">Refill Canal</a>
        {:else}
          <a href="/generate/buy" class="btn btn-primary uppercase w-full">Buy a Premium Canal</a>
        {/if}
      </div>
    </section>
  </div>
  <div class="card card-border mt-4 card-sm bg-base-300 max-w-sm w-full min-w-xs">
    <section class="card-body justify-between">
      <h2 class="card-title">Session</h2>
      <div class="flex flex-col gap-3 mt-2 mb-4">
        <div class="flex flex-row w-full">
          <p class="flex-1">Since</p>

          <span class="flex-1">{new Date(data.session.created_at).toLocaleDateString('en-ZA', { hour: 'numeric', minute: 'numeric', second: 'numeric' })}</span>
        </div>
        <div class="flex flex-row w-full">
          <p class="flex-1">Until</p>

          <span class="flex-1">{new Date(data.session.expires_at).toLocaleDateString('en-ZA', { hour: 'numeric', minute: 'numeric', second: 'numeric' })}</span>
        </div>
        <div class="flex flex-row w-full">
          <p class="flex-1">Device</p>

          <span class="flex-1">{data.session.device}</span>
        </div>
        <div class="flex flex-row w-full">
          <p class="flex-1">Browser</p>

          <span class="flex-1">{data.session.browser}</span>
        </div>
        <div class="flex flex-row w-full">
          <p class="flex-1">Operation System</p>

          <span class="flex-1">{data.session.os}</span>
        </div>
      </div>
      <div class="card-actions">
        <button onclick={onExit} class="btn btn-outline uppercase w-full">Exit</button>
      </div>
    </section>
  </div>
</div>
