<script>
  import { Info } from "@lucide/svelte"
  import { enhance } from '$app/forms'

  let { data, form } = $props()
</script>
<div class="flex flex-col justify-items-start items-center p-4">
  <div class="card card-border card-sm bg-base-300 max-w-sm w-full min-w-xs">
    <form class="card-body" method="POST" action="?/verify" use:enhance>
      <h1 class="card-title uppercase">Secure Access</h1>
      {#if form?.autherror}
        <div role="alert" class="alert alert-soft alert-error">
          <Info />
          <span>{form.autherror}</span>
        </div>
      {/if}
      <fieldset class="fieldset">
        <label for="totp_token" class="label">Code</label>
        <input id="totp_token" name="totp_token" type="text" class="input w-full" placeholder="Enter code" />
      </fieldset>
      <div class="card-actions flex-col">
        <button type="submit" class="btn btn-primary mt-4 w-full">Verify</button>
      </div>
    </form>
  </div>
</div>