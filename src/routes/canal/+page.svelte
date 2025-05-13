<script>
  import { goto } from '$app/navigation'
  import { setupSessionTimers, clearSessionTimers } from '$lib/session'
  import { session } from '$lib/expiry.svelte'

  let { data } = $props()
  async function onExit(){
    await fetch(`/canal/settings/logout`, { method: 'POST' })
    goto('/')
    session.expiry = null
    clearSessionTimers()
  }
</script>

<div class="flex flex-col justify-items-start p-4">
  <div class="card card-border mt-4 card-sm bg-base-300 max-w-sm w-full min-w-xs">
    <section class="card-body flex-row justify-between">
      <h2 class="card-title">Canal {data.usage.id}</h2>
      <div class="card-actions">
        <button onclick={onExit} class="btn btn-outline w-auto">Exit</button>
      </div>
    </section>
  </div>
</div>
