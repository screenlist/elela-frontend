<script>
  import { Info } from '@lucide/svelte'
  import { onDestroy } from 'svelte'
  import { addToast, cleanupToasts, dismissToast } from '$lib/toasts'
  import { toasts } from '$lib/toasts.svelte.js'

  let { data } = $props()

  function copyCanal(){
    navigator.clipboard.writeText(data.passphrase)
    addToast({ message: 'Your passphrase has been copied to clipboard', type: 'success', auto: true }) 
  }

  function saveCanal(){
    const blob = new Blob([data.passphrase], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `canal_${data.premium ? 'premium' : 'free'}_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  onDestroy(() => { cleanupToasts() })
</script>

<div class="flex flex-col justify-items-start items-center p-4">
  <section class="card card-border bg-base-200  max-w-xl w-full min-w-xs">
    <div class="card-body items-center text-center">
      <h1 class="card-title uppercase">Canal</h1>
      <div role="alert" class="alert alert-soft alert-warning">
        <Info />
        <span>This passphrase will only be displayed once, make sure to copy/save to keep it safe & never share it with anyone.</span>
      </div>
      <span class="font-mono w-full m-4 p-6 bg-base-300 font-semibold text-base border-dashed border-1 rounded-lg border-neutral">{data.passphrase}</span>
      <div class="card-actions justify-evenly w-full">
        <button onclick={copyCanal} class="btn btn-accent mt-4 flex-1">Copy</button>
        <button onclick={saveCanal} class="btn btn-accent mt-4 flex-1">Save</button>
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