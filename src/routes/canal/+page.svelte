<script>
  import { goto } from '$app/navigation'
  import { clearSessionTimers } from '$lib/session'
  import { session } from '$lib/expiry.svelte'
  import { Clock, Lock, LockOpen, MessageCircle, Info } from '@lucide/svelte';
  import size from '$lib/size.js';

  let { data } = $props()
  async function onExit(){
    await fetch(`/canal/settings/logout`, { method: 'POST' })
    goto('/')
    session.expiry = null
    clearSessionTimers()
  }
</script>

<div class="grid auto-rows-auto grid-cols-1 gap-4 overflow-y-auto h-[calc(100vh-8.829rem)] scrollbar-hide sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  <div class="card card-border card-sm bg-base-300 w-full h-full">
    <section class="card-body justify-between">
      <h2 class="card-title uppercase">Canal <span class="text-primary">{data.canal.usage.letter_sequence}</span></h2>
      <div class="flex flex-row gap-4 mt-2 mb-2">
        <div class="badge badge-neutral">{data.canal.usage.is_premium ? 'Premium' : 'Free'}</div>
        {#if data.canal.usage.is_premium}
          <div class={`badge flex-1 ${data.canal.usage.totp_enabled ? 'badge-success' : 'badge-warning'}`}>
            {#if data.canal.usage.totp_enabled}
              <Lock size={18}/>
            {:else}
              <LockOpen size={18}/>
            {/if}
            {data.canal.usage.totp_enabled ? 'Access Secured' : 'Access Not Secured'}
          </div>
        {:else}
          <div class={`badge flex-1 badge-warning`}>
            <Clock size={18}/>
            {`${new Date( new Date(data.canal.usage.created_at).valueOf() + 1000*60*60*24*3 ).toLocaleDateString('en-ZA', { hour: 'numeric', minute: 'numeric', second: 'numeric' })}`}
          </div>
        {/if}
      </div>
      <div class="fieldset">
        <p class="label">Usage</p>
        <progress class="progress w-full" value={data.canal.usage.capacity - data.canal.usage.usage} max={data.canal.usage.capacity}></progress>
      </div>
      <div class="stats shadow">
        <div class="stat place-items-center">
          <div class="stat-title">Drops</div>
          <div class="stat-value">{( ( data.canal.usage.capacity - data.canal.usage.usage ) / 100 ).toFixed(2)}</div>
          <div class="stat-desc">Left</div>
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
  <div class="card card-border card-sm bg-base-300 w-full h-full">
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
  {#if data.canal.usage.is_premium && !data.canal.usage.totp_enabled}
    <div class="card card-border card-sm bg-base-300 w-full h-full">
      <section class="card-body justify-between">
        <figure>
          <img class="w-2/3" src="/enter-password.svg" alt="An illustration a log in screen" />
        </figure>
        <h2 class="card-title">Set up 2-Factor Authentication</h2>
        <div class="card-actions">
          <a href="/canal/settings/access" class="btn btn-success uppercase w-full">Secure access</a>
        </div>
      </section>
    </div>
  {/if}
  <div class="card card-border card-sm bg-base-300 w-full h-full">
    <section class="card-body justify-between">
      <h2 class="card-title">Connect anonymously</h2>
      <figure>
        <img class="w-2/3" src="/connected-world.svg" alt="An illustration a globe with lines connecting the continents" />
      </figure>
      <div role="alert" class="alert alert-soft alert-info">
        <Info />
        <span>Secure ephemeral chatrooms for people to connect without sharing personal information beforehand</span>
      </div>
      <div class="card-actions">
        <a href="/canal/bridges#new" class="btn btn-outline uppercase w-full">Schedule a Bridge</a>
      </div>
    </section>
  </div>
  <div class="card card-border card-sm bg-base-300 w-full h-full">
    <section class="card-body justify-between">
      <h2 class="card-title">Upcoming Bridges</h2>
      <figure>
        <img class="w-2/3" src="/schedule-meeting.svg" alt="An illustration a person pointing a calendar" />
      </figure>
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-value">{data.statistics.scheduled_bridges}</div>
          <div class="stat-desc">Bridges</div>
        </div>
        <div class="stat">
          <div class="stat-value">{data.statistics.expressed_interest}</div>
          <div class="stat-desc">Responses</div>
        </div>
      </div>
      <div class="card-actions justify-end">
        <a href="/canal/bridges#upcoming" class="btn btn-outline uppercase w-1/2">View</a>
      </div>
    </section>
  </div>
  <div class="card card-border card-sm bg-base-300 w-full h-full">
    <section class="card-body justify-between">
      <h2 class="card-title">Active Bridges</h2>
      <figure>
        <img class="w-2/3" src="/online-message.svg" alt="An illustration a person looking a at a superimposed desktop screen with chat messages" />
      </figure>
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-value">{data.statistics.active_bridges}</div>
          <div class="stat-desc">Bridges</div>
        </div>
      </div>
      <div class="card-actions justify-end">
        <a href="/canal/bridges#active" class="btn btn-outline uppercase w-1/2">View</a>
      </div>
    </section>
  </div>
  <div class="card card-border card-sm bg-base-300 w-full h-full">
    <section class="card-body justify-between">
      <h2 class="card-title">Cargo</h2>
      <div class="flex flex-col gap-3 mt-2 mb-4">
        <div class="flex flex-row w-full">
          <p class="flex-1">Storage</p>
          <span class="flex-1">{size(data.jetsam.total_size)}</span>
        </div>
        <div class="flex flex-row w-full">
          <p class="flex-1">Private</p>
          <span class="flex-1">{data.jetsam.cargo_private}</span>
        </div>
        <div class="flex flex-row w-full">
          <p class="flex-1">Public</p>
          <span class="flex-1">{data.jetsam.cargo_public}</span>
        </div>
        <div class="flex flex-row w-full">
          <p class="flex-1">Cost</p>
          <span class="flex-1">{(data.jetsam.total_subpoints/100).toFixed(2)} Drops</span>
        </div>
      </div>
      <div class="card-actions justify-end">
        <a href="/canal/jetsam" class="btn btn-outline uppercase w-1/2">View</a>
      </div>
    </section>
  </div>
</div>
