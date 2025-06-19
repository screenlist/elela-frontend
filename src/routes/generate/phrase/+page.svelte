<script>
  import { Info } from '@lucide/svelte'
  import { onDestroy, onMount } from 'svelte'
  import { addToast, cleanupToasts, dismissToast } from '$lib/toasts'
  import { diceware } from '$lib/diceware.js'
  import { toasts } from '$lib/toasts.svelte.js'
  import { PUBLIC_SERVER } from '$env/static/public'
  import { argon2id } from 'hash-wasm'
  import { decodeHex } from '@std/encoding'
  import { computeHMAC } from '$lib/hmac.js'

  let { data } = $props()

  let passphrase = $state(null)
  let loading = $state(false)

  function copyCanal(){
    navigator.clipboard.writeText(passphrase)
    addToast({ message: 'Your passphrase has been copied to clipboard', type: 'success', auto: true }) 
  }

  function saveCanal(){
    const content = [
      `SEQUENCE      ->    ${data.letter_sequence}`,
      `PASSPHRASE    ->    ${passphrase}`
    ]
    const blob = new Blob([content.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `canal_${data.premium ? 'premium' : 'free'}_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function generatePassphrase(){
    loading = true
    const phrase = diceware()
    const salt = decodeHex(data.passphrase_salt)
    const key = await argon2id({
      password: phrase,
      salt: salt,
      memorySize: 64000,
      iterations: 3,
      hashLength: 32,
      outputType: 'hex',
      parallelism: 1
    })
    const hmac = await computeHMAC(key, 'canal-passphrase')
    const res = await fetch(`${PUBLIC_SERVER}/canal/activate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hash: hmac,
        sequence: data.letter_sequence
      })
    })
    
    if(!res.ok){  
      addToast({ message: await res.text(), type: 'error', auto: true }) 
    } else {
      passphrase = phrase
    }
    loading = false
  }

  onMount(async () => {
    await generatePassphrase()
  })

  onDestroy(() => { 
    cleanupToasts() 
    passphrase = null
  })
</script>

<div class="flex flex-col justify-items-start items-center p-4">
  <section class="card card-border bg-base-200  max-w-xl w-full min-w-xs">
    <div class="card-body items-center text-center">
      <h1 class="card-title uppercase">Canal <span class="badge badge-neutral">{data.letter_sequence}</span></h1>
      <div role="alert" class="alert alert-warning w-full">
        <Info />
        <span>Do not refresh this page.</span>
      </div>
      <div role="alert" class="alert alert-warning w-full">
        <Info />
        <span>These details will only be displayed once, click save.</span>
      </div>
      <div role="alert" class="alert alert-info w-full">
        <Info />
        <span>This information cannot be reset, never lose it.</span>
      </div>
      <span class="font-mono w-full m-4 p-6 bg-base-300 font-semibold text-base border-dashed border-1 rounded-lg border-neutral">
        {#if loading || !passphrase}
          <div class="flex justify-center items-center w-full">
            <span class="loading loading-spinner text-neutral"></span>
          </div>
        {:else}
          {passphrase}
        {/if}
      </span>
      <div class="card-actions justify-evenly w-full">
        <button disable={!loading || passphrase ? false : true} onclick={saveCanal} class="btn btn-accent mt-4 flex-1">Save</button>
        <a href="/" class="btn btn-outline mt-4 flex-1">Enter</a>
      </div>
    </div>
  </section>
</div>
<div class="toast toast-bottom toast-center">
  {#each toasts as toast (toast.id) }
    <div class={`alert alert-${toast.type}`}>
      <span>{toast.message}</span>
    </div>
  {/each}
</div>