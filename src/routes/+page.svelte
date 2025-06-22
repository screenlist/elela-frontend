<script>
  import { House, Info, ArrowBigRightDash, ClipboardPaste, Delete, ArrowLeft } from "@lucide/svelte"
  import { enhance } from '$app/forms'
  import { getCookie } from "$lib/cookie"
  import { browser } from "$app/environment";
  import { addToast, cleanupToasts, dismissToast } from '$lib/toasts'
  import { diceware } from '$lib/diceware.js'
  import { toasts } from '$lib/toasts.svelte.js'
  import { PUBLIC_SERVER } from '$env/static/public'
  import { argon2id } from 'hash-wasm'
  import { decodeHex } from '@std/encoding'
  import { computeHMAC } from '$lib/hmac.js'
  import { onDestroy } from "svelte";

  let { data, form } = $props()
  let session = $state(null)

  let sequenceInput = $state('')
  let salt = $state(null)
  let sequence = $state(null)
  let passphrase = $state('')

  let alphabet = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
    'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
    'W', 'X', 'Y', 'Z'
  ]

  async function pasteSequence(){
    const text =  await navigator.clipboard.readText()
    sequenceInput = text.replace(/[^A-Z]/g, '').substring(0, 6)
  }

  async function getSalt(){
    const formattedSequence = `${sequenceInput.slice(0,2)}:${sequenceInput.slice(2,4)}:${sequenceInput.slice(4)}`
    const res = await fetch(`${PUBLIC_SERVER}/canal/salt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sequence: formattedSequence })
    })

    if(!res.ok){  
      addToast({ message: await res.text(), type: 'error', auto: true }) 
    } else {
      const canal = await res.json()
      salt = canal.passphrase_salt
      sequence = canal.letter_sequence
    }
  }

  async function reset() {
    salt = null
    sequence = null
    passphrase = ''
    sequenceInput = ''
  }
  
  onDestroy(() => {
    reset()
  })

  // $inspect(salt, sequence, passphrase.length).with(console.log)
  if(browser){ session = getCookie('canal_session') }
</script>
<div class="flex flex-col justify-items-start items-center p-4">
    {#if !session}
      <div class="card card-border card-sm bg-base-300 max-w-sm w-full min-w-xs">
        <form class="card-body" method="POST" action="?/auth" use:enhance={async ({formData, cancel}) => {
          if(!sequence || !salt || passphrase.length === 0){
            addToast({ message: 'Find your letter sequence and enter your passphrase', type: 'error', auto: true }) 
            cancel()
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
          }
        }}>
          <h1 class="card-title uppercase">Canal</h1>
          <span for="passphrase" class="fieldset-legend">Sequence</span>
          <div class="flex items-center justify-between gap-2">
            <span class={`flex items-center justify-center tracking-widest text-center text-lg font-bold flex-1 border-2 rounded-lg h-12 ${sequenceInput.length < 2 ? 'bg-primary text-base-100 border-base-100 border-dashed' : 'bg-base-100 border-primary'}`} >
              {sequenceInput[0] ? sequenceInput[0] : '•'}
              {sequenceInput[1] ? sequenceInput[1] : '•'}
            </span>
            <span class="font-bold text-lg">:</span>
            <span class={`flex items-center justify-center tracking-widest text-center text-lg font-bold flex-1 border-2 rounded-lg h-12 ${sequenceInput.length >= 2 && sequenceInput.length < 4 ? 'bg-primary text-base-100 border-base-100 border-dashed' : 'bg-base-100 border-primary'}`} >
              {sequenceInput[2] ? sequenceInput[2] : '•'}
              {sequenceInput[3] ? sequenceInput[3] : '•'}
            </span>
            <span class="font-bold text-lg">:</span>
            <span class={`flex items-center justify-center tracking-widest text-center text-lg font-bold flex-1 border-2 rounded-lg h-12 ${sequenceInput.length >= 4 ? 'bg-primary text-base-100 border-base-100 border-dashed' : 'bg-base-100 border-primary'}`} >
              {sequenceInput[4] ? sequenceInput[4] : '•'}
              {sequenceInput[5] ? sequenceInput[5] : '•'}
            </span>
          </div>
          {#if !salt && !sequence}
            <div class="grid auto-rows-auto grid-cols-6 gap-4 mt-2 mb-2">
              {#each alphabet as letter}
                <button onclick={() => {
                  if(sequenceInput.length < 6){
                    sequenceInput += letter
                  }
                }} type="button" class="btn btn-neutral btn-circle" >{letter}</button>
              {/each}
              <button onclick={() => {
                  if(sequenceInput.length > 0){
                    sequenceInput = sequenceInput.split('').filter((_, i, arr) => i !== arr.length - 1).join('')
                  }
                }} type="button" class="btn btn-error btn-circle" >
                <Delete/>
              </button>
              <button onclick={pasteSequence} type="button" class="btn btn-outline btn-circle" >
                <ClipboardPaste />
              </button>
              <button disabled={sequenceInput.length !== 6 ? true : false} onclick={getSalt} type="button" class="btn btn-primary col-span-2 col-start-5" >Find</button>
            </div>
          {:else}
            <fieldset class="fieldset">
              <label for="passphrase" class="fieldset-legend">Passphrase</label>
              <input id="passphrase" bind:value={passphrase} name="passphrase" type="password" class="input w-full" placeholder="all you need is six words" />
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

<div class="toast toast-bottom toast-center">
  {#each toasts as toast (toast.id) }
    <div class={`alert alert-${toast.type}`}>
      <span>{toast.message}</span>
    </div>
  {/each}
</div>