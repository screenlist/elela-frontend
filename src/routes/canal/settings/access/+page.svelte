<script>
  import QRCode from 'qrcode'
  import { enhance } from '$app/forms'
  import { Lock, LockOpen, Info } from '@lucide/svelte';
  import { addToast, cleanupToasts, dismissToast } from '$lib/toasts'
  import { toasts } from '$lib/toasts.svelte.js'
  import { onDestroy } from 'svelte'
  let { data, form } = $props()
  let setup = $state(false)
  let token = $state(null)
  let secret =$state(null)
  let uri = $state(null)

  let qrUrl = $state('')

  $effect(() => {
    if(setup){
      QRCode.toDataURL(uri, (err, url) => {
        qrUrl = url
      })
    }
  })
  
  onDestroy(() => { cleanupToasts() })
  // $inspect(data, form).with(console.log)
</script>

<section class="card bg-base-200 min-h-[70vh] w-full">
  <div class="card-body">
    <h2 class="card-title">Secure Access</h2>
    <span class="opacity-50">Manage multi-factor authentication to secure your canal</span>
    {#if data.canal.usage.totp_enabled && !setup}
      <form method="POST" action="?/disable" use:enhance={({formData}) => {
        if(token){ formData.append('auth_token', token) }
        return async ({result, update}) => {
          if(result.data?.autherror){ 
            addToast({ message: result.data.autherror, type: 'error', auto: true }) 
          }
          await update()
        }
      }}>
        <p class="alert alert-soft alert-success mb-4"><Info/>Your secure access is enabled, you need to use your authenticator app to enter the canal.</p>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Code</legend>
          <input name="totp_token" type="text" class="input" placeholder="Enter code" />
        </fieldset>
        <div class="card-actions">
          <button class="btn btn-neutral">Disable</button>
        </div>
      </form>
    {:else if !data.canal.usage.totp_enabled && !setup}
      <form method="POST" action="?/setup" use:enhance={() => {
        return async ({result, update}) => {
          console.log(result)
          if(result.data?.autherror){ 
            addToast({ message: result.data.autherror, type: 'error', auto: true }) 
          } else {
            uri = result.data.setup.uri
            secret = result.data.setup.secret
            token = result.data.setup.token
            setup = true
          }
          await update()
        }
      }}>
        {#if !data.canal.usage.is_premium }
          <div role="alert" class="alert alert-warning alert-soft">
            <Info />
            <span>This feature is for premium canals, <a class="link" href="/generate/buy">get yours</a>.</span>
          </div>
        {:else}
          <p class="alert alert-soft alert-info mb-4"><Info/>After initiating the setup do not refresh the page until you have enabled secure access, otherwise you will need to wait at least 3 minutes before you can restart.</p>
        {/if}
        <div class="card-actions mt-4">
          <button class="btn btn-neutral">Setup</button>
        </div>
      </form>
    {/if}
    {#if !data.canal.usage.topt_enabled && setup}
      <form method="POST" action="?/enable" use:enhance={({formData}) => {
        if(token){ formData.append('auth_token', token) }
        return async ({result, update}) => {
          if(result.data?.autherror){ 
            addToast({ message: result.data.autherror, type: 'error', auto: true }) 
          } else {
            uri = null
            secret = null
            token = null
            setup = false
          }
          await update()
        }
      }}>
        {#if qrUrl}
          <img class="mb-4 mt-2" src={qrUrl} alt="QR code" />
          <p class="alert alert-soft alert-info mb-4"><Info/>Scan the QR code with your Authenicator app of choice or manually enter the code below.</p>
        {/if}
        <span class="badge badge-neutral">{secret}</span>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Code</legend>
          <input name="totp_token" autocomplete="off" type="text" class="input" placeholder="Enter code" />
        </fieldset>
        <div class="card-actions mt-4">
          <button class="btn btn-neutral">Enable</button>
        </div>
      </form>
    {/if}
  </div>
</section>
<div class="toast toast-top toast-center">
  {#each toasts as toast (toast.id) }
    <div class={`alert alert-${toast.type}`}>
      <span>{toast.message}</span>
    </div>
  {/each}
</div>