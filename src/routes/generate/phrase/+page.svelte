<script>
  import { Info } from '@lucide/svelte'
  let { data } = $props()

  function copyCanal(){
    navigator.clipboard.writeText(data.passphrase)
  }

  function saveCanal(){
    const blob = new Blob([data.passphrase], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'canal.txt'
    a.click()
    URL.revokeObjectURL(url)
  }
  
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