<script>
  import { House, Info, ArrowBigRightDash, ClipboardPaste, Delete, ArrowLeft } from "@lucide/svelte"
  import { enhance } from '$app/forms'
  import { navigating } from '$app/state'
  import { getCookie } from "$lib/cookie"
  import { clearSessionTimers } from '$lib/session'
  import { session } from '$lib/expiry.svelte'
  import { browser } from "$app/environment";
  import { goto, invalidate } from '$app/navigation'
  import { addToast, cleanupToasts, dismissToast } from '$lib/toasts'
  import { diceware } from '$lib/diceware.js'
  import { toasts } from '$lib/toasts.svelte.js'
  import { PUBLIC_SERVER } from '$env/static/public'
  import { argon2id } from 'hash-wasm'
  import { decodeHex } from '@std/encoding'
  import { computeHMAC } from '$lib/hmac.js'
  import { onDestroy } from "svelte"

  let { data, form } = $props()
  let active_session = $state(null)

  let sequenceInput = $state('')
  let sequenceArray = $derived(sequenceInput.padEnd(6, '•').split('').slice(0, 6))
  let isComplete = $derived(sequenceInput.length !== 6)
  let salt = $state(null)
  let sequence = $state(null)
  let passphrase = $state('')
  let loading = $state(false)

  let group1Class = $derived(sequenceInput.length < 2 ? 'bg-accent text-neutral border-accent' : 'bg-neutral border-neutral text-base-100')
  let group2Class = $derived(sequenceInput.length >= 2 && sequenceInput.length < 4 ? 'bg-accent text-neutral border-accent' : 'bg-neutral border-neutral text-base-100')
  let group3Class = $derived(sequenceInput.length >= 4 ? 'bg-accent text-neutral border-accent' : 'bg-neutral border-neutral text-base-100')

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  async function pasteSequence(){
    const text =  await navigator.clipboard.readText()
    sequenceInput = text.replace(/[^A-Z]/g, '').substring(0, 6)
  }

  function addLetter(letter){
    if(sequenceInput.length < 6){
      sequenceInput += letter
    }
  }

  function removeLetter(){
    if(sequenceInput.length > 0){
      sequenceInput = sequenceInput.slice(0, -1)
    }
  }

  async function getSalt(){
    loading = true
    const formattedSequence = `${sequenceInput.slice(0,2)}:${sequenceInput.slice(2,4)}:${sequenceInput.slice(4)}`
    const res = await fetch(`${PUBLIC_SERVER}/canal/salt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sequence: formattedSequence })
    })

    if(!res.ok){  
      loading = false
      addToast({ message: await res.text(), type: 'error', auto: true }) 
    } else {
      const canal = await res.json()
      salt = canal.passphrase_salt
      sequence = canal.letter_sequence
      loading = false
    }
  }

  async function reset() {
    salt = null
    sequence = null
    passphrase = ''
    sequenceInput = ''
  }

  async function onExit(){
    loading = true
    await fetch(`/canal/settings/logout`, { method: 'POST' })
    session.expiry = null
    clearSessionTimers()
    active_session = getCookie('canal_session')
    await invalidate('get:refreshed')
    goto('/', { replaceState: true })
    loading = false
  }
  
  onDestroy(() => {
    reset()
  })

  $effect(() => {  
    if(navigating.type){ active_session = getCookie('canal_session') }
  })

  if(browser){ active_session = getCookie('canal_session') }
</script>

<div class="flex flex-col justify-items-start items-center">
  {#if !active_session}
    <div class="card card-border card-sm bg-base-300 max-w-sm w-full min-w-xs">
      <form class="card-body" method="POST" action="?/auth" use:enhance={async ({formData, cancel}) => {
        loading = true
        if(!sequence || !salt || passphrase.length === 0){
          addToast({ message: 'Find your letter sequence and enter your passphrase', type: 'error', auto: true }) 
          cancel()
          loading = false
        } else {
          const saltBuffer = decodeHex(salt)
          const key = await argon2id({
            password: passphrase,
            salt: saltBuffer,
            memorySize: 64000,
            iterations: 3,
            hashLength: 32,
            outputType: 'hex',
            parallelism: 1
          })
          const hash = await computeHMAC(key, 'canal-passphrase')
          formData.append('passphrase_hash', hash)
          formData.append('sequence', sequence)
        }
        
        return async ({result, update}) => {
          if(result.data?.autherror){ 
            addToast({ message: result.data.autherror, type: 'error', auto: true }) 
          }
          await update()
          loading = false
        }
      }}>
        <h1 class="card-title uppercase">Canal</h1>
        <span for="passphrase" class="fieldset-legend">Sequence</span>
        <div class="flex items-center justify-between gap-2">
          <span class={`flex items-center justify-center tracking-widest text-center text-lg font-bold flex-1 border-2 rounded-lg h-12 ${group1Class}`} >
            {sequenceArray[0]}{sequenceArray[1]}
          </span>
          <span class="font-bold text-lg">:</span>
          <span class={`flex items-center justify-center tracking-widest text-center text-lg font-bold flex-1 border-2 rounded-lg h-12 ${group2Class}`} >
            {sequenceArray[2]}{sequenceArray[3]}
          </span>
          <span class="font-bold text-lg">:</span>
          <span class={`flex items-center justify-center tracking-widest text-center text-lg font-bold flex-1 border-2 rounded-lg h-12 ${group3Class}`} >
            {sequenceArray[4]}{sequenceArray[5]}
          </span>
        </div>
        {#if !salt && !sequence}
          <div class="grid auto-rows-auto grid-cols-6 gap-2 mt-2 mb-2 w-full">
            {#each alphabet as letter (letter)}
              <button style="touch-action: manipulation;" onclick={() => addLetter(letter)} type="button" class="btn btn-neutral btn-square w-full focus:btn-accent" >{letter}</button>
            {/each}
            <button onclick={removeLetter} type="button" class="btn btn-error btn-square w-full" >
              <Delete/>
            </button>
            <button onclick={pasteSequence} type="button" class="btn btn-outline btn-square w-full" >
              <ClipboardPaste />
            </button>
            <button disabled={isComplete} onclick={getSalt} type="button" class="btn btn-primary col-span-2 col-start-5 w-full" >Find</button>
          </div>
        {:else}
          <fieldset class="fieldset">
            <label for="passphrase" class="fieldset-legend">Passphrase</label>
            <input id="passphrase" bind:value={passphrase} name="passphrase" type="text" class="input w-full" placeholder="all you need is six words" />
          </fieldset>
        {/if}
        <div class="card-actions mt-4 flex-col">
          {#if salt && sequence}
            <div class="flex flex-row items-center gap-2 w-full">
              <button onclick={reset} type="button"  class="btn btn-outline btn-circle"><ArrowLeft /></button>
              <button type="submit" class="btn btn-primary flex-1">Enter</button>
            </div>
          {/if}
          <div class="divider">OR</div>
          <a href="/generate" class="btn btn-outline w-full">Generate a New Canal</a>
        </div>
      </form>
    </div>
  {:else}
    <div class="card card-border card-sm bg-base-300 max-w-sm w-full min-w-xs">
      <section class="card-body flex-row justify-between">
        <h2 class="card-title uppercase">Canal</h2>
        <div class="card-actions">
          <button onclick={onExit} class="btn btn-primary w-full uppercase">
            Exit <ArrowBigRightDash />
          </button>
        </div>
      </section>
    </div>  
  {/if} 
  <div class="card card-border mt-4 card-sm bg-base-300 max-w-sm w-full min-w-xs">
    <div class="card-body">
      <h2 class="card-title uppercase">Bridge</h2>
      <div class="card-actions flex-row justify-evenly mt-4">
        <a href="/wave" class="btn btn-neutral w-auto flex-1">Respond</a>
        {#if !active_session}
          <a href="/bridge" class="btn btn-neutral w-auto flex-1">Join</a>
        {/if}
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

{#if loading}
  <div class="toast toast-top toast-center">
    <div class={`btn btn-primary btn-circle`}>
      <span class="loading loading-spinner loading-md"></span>
    </div>
  </div>
{/if}


<div class="toast toast-top toast-center">
  {#each toasts as toast (toast.id) }
    <div class={`alert alert-${toast.type}`}>
      <span>{toast.message}</span>
    </div>
  {/each}
</div>