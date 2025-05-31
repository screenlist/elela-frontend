<script>
    import { House, Info, ArrowBigRightDash } from "@lucide/svelte"
    import { enhance } from '$app/forms'
    import { getCookie } from "$lib/cookie"
    import { browser } from "$app/environment";

    let { data, form } = $props()
    let session = $state(null)
    if(browser){ session = getCookie('canal_session') }
</script>
<div class="flex flex-col justify-items-start items-center p-4">
    {#if !session}
      <div class="card card-border card-sm bg-base-300 max-w-sm w-full min-w-xs">
        <form class="card-body" method="POST" action="?/auth" use:enhance>
          <h1 class="card-title uppercase">Canal</h1>
          {#if form?.autherror}
            <div role="alert" class="alert alert-soft alert-error">
              <Info />
              <span>{form.autherror}</span>
            </div>
          {/if}
          <fieldset class="fieldset">
            <label for="passphrase" class="label">Passphrase</label>
            <input id="passphrase" name="passphrase" type="password" class="input w-full" placeholder="all you need is six words" />
          </fieldset>
          <div class="card-actions flex-col">
            <button type="submit" class="btn btn-primary mt-4 w-full">Enter</button>
            <div class="divider">OR</div>
            <a href="/generate" class="btn btn-outline w-full">Generate a New Canal</a>
          </div>
        </form>
      </div>
    {:else if session}
      <div class="card card-border card-sm bg-base-300 max-w-sm w-full min-w-xs">
        <section class="card-body flex-row justify-between">
          <h2 class="card-title uppercase">Canal</h2>
          <div class="card-actions">
            <a href="/canal" class="btn btn-primary w-full">
              <ArrowBigRightDash />
            </a>
          </div>
        </section>
      </div>     
    {/if} 
    <div class="card card-border mt-4 card-sm bg-base-300 max-w-sm w-full min-w-xs">
      <div class="card-body">
        <h2 class="card-title uppercase">Bridge</h2>
        <div class="card-actions flex-row justify-evenly mt-4">
          <a href="/wave" class="btn btn-neutral w-auto flex-1/2">Send a Response Flare</a>
          <a href="/bridge" class="btn btn-neutral w-auto flex-1/2">Join a Bridge Chat</a>
        </div>
      </div>
    </div>
    <div class="card card-border mt-4 card-sm bg-base-300 max-w-sm w-full min-w-xs">
      <div class="card-body">
        <h2 class="card-title uppercase">Cargo</h2>
        <fieldset class="fieldset">
          <label for="passphrase" class="label">Driftkey</label>
          <input name="phrase" type="password" class="input w-full" placeholder="💦 for your eyes only 😁👀" />
          <div role="alert" class="alert alert-soft alert-info">
            <Info />
            <span>The driftkey is an emoji-words phrase used to access files made public</span>
          </div>
        </fieldset>
        <div class="card-actions flex-row justify-end mt-4">
          <a href="/cargo" class="btn btn-accent w-auto">Search</a>
        </div>
      </div>
    </div>
</div>

