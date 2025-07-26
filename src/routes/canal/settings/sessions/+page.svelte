<script>
  import { browser } from "$app/environment";
  import { getCookie } from "$lib/cookie";
  let { data } = $props() 
  let theSession = $state(null)

  if(browser){
    theSession = getCookie('canal_session')
  }
</script>

<section class="card bg-base-300 min-h-[70vh] w-full">
  <div class="card-body">
    <h2 class="card-title">Sessions</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 row-auto">
      {#each data.sessions as session }
        <div class={`card card-sm ${session.id === `session:${theSession}` ? 'bg-neutral text-base-100' : 'bg-base-300'}`}>
          <article class="card-body justify-between">
            <h3 class="card-title">{ session.id === `session:${theSession}` ? 'Your current session' : `${session.device} • ${session.browser} • ${session.os}` }</h3>
            <div class="flex flex-col gap-3 mt-2 mb-4">
              <div class="flex flex-row w-full">
                <p class="flex-1/3">Since</p>
                <span class="">{new Date(session.created_at).toLocaleDateString('en-ZA', { hour: 'numeric', minute: 'numeric', second: 'numeric' })}</span>
              </div>
              <div class="flex flex-row w-full">
                <p class="flex-1/3">Until</p>
                <span class="">{new Date(session.expires_at).toLocaleDateString('en-ZA', { hour: 'numeric', minute: 'numeric', second: 'numeric' })}</span>
              </div>
            </div>
          </article>
        </div>
      {/each}
    </div>
  </div>
</section>