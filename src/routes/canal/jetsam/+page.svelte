<script>
  import { CirclePlus, Download, Eye, Info, MessageCircle, Phone, Trash2, CircleX } from "@lucide/svelte";
  import { enhance } from '$app/forms'
  import { addToast, cleanupToasts, dismissToast } from '$lib/toasts'
  import { toasts } from '$lib/toasts.svelte.js'
  import { onDestroy, onMount } from 'svelte'
  import { PUBLIC_SERVER } from "$env/static/public"
  import Icon from "$lib/Icon.svelte"
  import extend_session from "$lib/extend_session"
  import { sha1 } from "hash-wasm"
  import { invalidate } from "$app/navigation"
  import { page } from "$app/state"

  let { data } = $props()

  let cargo_info_modal
  let cargo_info = $state({
    name: '',
    downloads_left: 0,
    drops: '',
    type: '',
    size: 0,
    is_public: false,
    id: ''
  })
  let cargo_loading = $state(false)
  
  let bridge = $state(null)
  let input_file = $state(null)
  let file = $derived(input_file ? input_file[0] : null)
  let downloads = $state(3)
  let retention = $state(1)

  let loading = $state(false)
  let total_costs = $state(0)

  let large_progress = $state(0)
  let uploading = $state(false)

  function resetCargoInfo(){
    cargo_info = {
      name: '',
      downloads_left: 0,
      drops: '',
      type: '',
      size: 0,
      is_public: false,
      id: ''
    }
  }

  function getType (type) {
    const typePatterns = {
      video: /^video\/.*/,
      image: /^image\/.*/,
      audio: /^audio\/.*/,
      text: /^text\/.*/,
      pdf: /^application\/pdf$/,
      archive: /^application\/(x-.*|zip|vnd\.rar|x-tar|gzip|x-7z-compressed|x-bzip2)$/,
      code: /^(text\/(x-.*|javascript|json|xml)|application\/(javascript|json|xml|x-.*script|wasm))$/,
    }
    for (const [category, pattern] of Object.entries(typePatterns)) {
      if (pattern.test(type)) {
        return category
      }
    }
    return 'file'
  }

  function openCargoModal(){ cargo_info_modal.showModal() }

  function closeCargoModal(){ cargo_info_modal.close() }

  function copyFlare(){
    navigator.clipboard.writeText(bridge.public_code)
    addToast({ message: 'Flare successfully copied to clipboard', type: 'success', auto: true })
  }

  async function deleteCargo(){
    cargo_loading = true
    const response = await fetch(`${PUBLIC_SERVER}/jetsam/cargo/${cargo_info.id.split(':')[1]}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    
    if(!response.ok){
      cargo_loading = false
      addToast({ message: await response.text(), type: 'error', auto: true })
    } else {
      cargo_loading = false
      await invalidate('get:jetsam')
      closeCargoModal()
      addToast({ message: 'Cargo successfully deleted', type: 'success', auto: true })
      resetCargoInfo()
    }
  }

  async function uploadCargo(){
    if(!file) return

    const chunk_size = 6 * ( 1024 ** 2 )
    const is_big_size = 9 * ( 1024 ** 2 )
    
    loading = true
    uploading = true

    const hash = await sha1(new Uint8Array(await file.arrayBuffer()))
    const name = file.name
    const type = file.type
    const size = file.size

    if(size < is_big_size){
      console.log(hash)
      const response = await fetch(`${PUBLIC_SERVER}/jetsam/small/start`,
        {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            sha1: hash, 
            type: type, 
            name: name, 
            size: size,
            downloads: downloads,
            retention: retention
          })
        }
      )
      if(!response.ok){ 
        addToast({ message: await response.text(), type: 'error', auto: true }) 
        loading = false
        uploading = false
        return
      }
      const info = await response.json()
      const upload = await fetch(info.url, {
        method: 'POST',
        headers: { 
          'Authorization': info.token,
          'X-Bz-File-Name': info.name,
          'Content-Type': info.type,
          'Content-Length': info.size,
          'X-Bz-Content-Sha1': info.sha1
        },
        body: file
      })
      if(!upload.ok){ 
        addToast({ message: await upload.text(), type: 'error', auto: true })
        loading = false
        uploading = false
        return 
      }
      const upload_info = await upload.json()
      const finish = await fetch(`${PUBLIC_SERVER}/jetsam/small/finish?cargo=${info.id}`,{
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({file_id: upload_info.fileId})
      })
      if(!finish.ok){ 
        addToast({ message: await finish.text(), type: 'error', auto: true })
        loading = false
        uploading = false
        return 
      }
      
      loading = false
      uploading = false
      input_file = null
      total_costs = 0
      downloads = 0
      retention = 0
      await invalidate('get:jetsam')
    } else {

      const total_chunks = Math.ceil(size / chunk_size)
      const chunks = []

      for (let i = 0; i < total_chunks; i++){
        const start = i * chunk_size
        const end = Math.min(start + chunk_size, size)
        const chunk = await file.slice(start, end).arrayBuffer()
        const chunk_hash = await sha1(new Uint8Array(chunk))
        const chunk_size = chunk.byteLength
        chunks.push({
          index: i,
          sha1: chunk_hash,
          size: chunk_size
        })
      }

      const response = await fetch(`${PUBLIC_SERVER}/jetsam/large/start`,
        {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            sha1: hash, 
            type: type, 
            name: name, 
            size: size,
            downloads: downloads,
            retention: retention,
            chunks: total_chunks
          })
        }
      )
      if(!response.ok){ 
        addToast({ message: await response.text(), type: 'error', auto: true })
        loading = false
        uploading = false
        return 
      }

      const info = await response.json()

      for await (const chunk of chunks){
        try {
          const upload = await fetch(info.url, {
            method: 'POST',
            headers: { 
              'Authorization': info.token,
              'X-Bz-Part-Number': chunk.index,
              'Content-Length': chunk.size,
              'X-Bz-Content-Sha1': chunk.sha1
            },
            body: file
          })
          const upload_info = await upload.json()

          if(!upload.ok){ 
            addToast({ message: upload_info.message, type: 'error', auto: true }); 
          } else {
            const update = await fetch(`${PUBLIC_SERVER}/jetsam/large/session/${info.session_id}`, {
              method: 'PATCH',
              credentials: 'include',
              body: JSON.stringify({
                sha1: chunk.sha1,
                index: chunk.index,
                size: chunk.size
              })
            })

            if(!update.ok){ 
              addToast({ message: await update.text(), type: 'error', auto: true }); 
            } else {
              large_progress = (await update.json()).percentage_completion
            }
          }
          
          continue
        } catch (error) {
          addToast({ message: error.message, type: 'error', auto: true })
          continue
        }
      }

      const finish = await fetch(`${PUBLIC_SERVER}/jetsam/large/finish`,
        {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            file_id: info.file_id, 
            session_id: info.session_id, 
            hashes: chunks.map(val => val.sha1)
          })
        }
      )

      if(!finish.ok){
        addToast({ message: await finish.text(), type: 'error', auto: true })
        loading = false
        uploading = false
        return
      }

      loading = false
      uploading = false
      await invalidate()
    }
  }
  
  $effect(async () => {
    if(file){
      // extend_session()
      loading = true
      const size = file.size

      if(size >  40 * (1024 ** 3)) {
        addToast({ message: 'Files bigger than 40GB are not accepted', type: 'error', auto: true }) 
        loading = false
        input_file = null
        total_costs = 0
        return
      }
      
      const res = await fetch(`${PUBLIC_SERVER}/jetsam/cost?size=${file.size}&downloads=${downloads}&retention=${retention}`, {
        method: 'POST',
        credentials: 'include'
      })
      if(!res.ok){ 
        addToast({ message: await res.text(), type: 'error', auto: true }) 
      } else {
        total_costs = (await res.json()).total_subpoints
      }
      loading = false
    }
  })

  onDestroy(() => {cleanupToasts()})

  $inspect(loading, uploading, input_file).with(console.log)
</script>

<div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
  <div class="card card-border card-sm bg-base-300 w-full sm:w-1/2 md:w-2/5 lg:w-1/3 xl:w-1/4">
    <section class="card-body justify-between">
      <h2 class="card-title">{uploading ? 'Uploading' : 'Upload'}</h2>
      {#if uploading === true}
        <div class="w-full flex justify-center mb-2">
          <div class="w-fit rounded">
            <Icon size={150} />
          </div>
        </div>
        <span class="mb-2 text-lg">{file.name}</span>
        {#if file.size < 9 * ( 1024 ** 2 )}
          <progress class="progress w-full"></progress>
        {:else}
          <progress class="progress progress-primary w-full" value={large_progress} max="100"></progress>
        {/if}
      {:else}
        {#if total_costs > data.canal.usage.capacity - data.canal.usage.usage }
          <div role="alert" class="alert alert-warning alert-soft">
            <Info />
            <span>This action will cost more drops than available in your canal, <a class="link" href="/canal/settings/refill">please refill</a>.</span>
          </div>
        {/if}
        {#if loading}
          <div class="flex justify-center items-center h-29 w-full">
            <span class="loading loading-spinner text-neutral"></span>
          </div>
        {:else}
          <div class="stats shadow">
            <div class="stat place-items-center">
              <div class="stat-title">Costs</div>
              <div class="stat-value">{( total_costs / 100 ).toFixed(2)}</div>
              <div class="stat-desc">Drops</div>
            </div>
          </div>
        {/if}
        <fieldset class="fieldset">
          <label for="flare" class="fieldset-legend">Cargo</label>
          <input type="file" bind:files={input_file} class="file-input file-input-lg" />

          <label for="flare" class="fieldset-legend">Duration</label>
          <input disabled={!input_file || input_file.length === 0} id="drops" name="quantity" type="range" min="1" max="36" bind:value={retention} class="range w-full" />
          <span class="label">{retention} months</span>

          <label for="flare" class="fieldset-legend">Downloads</label>
          <input disabled={!input_file || input_file.length === 0} id="drops" name="quantity" type="range" min="3" max="100" bind:value={downloads} class="range w-full" />
          <div class="flex">
            <button onclick={() => downloads - 100 >= 3 ? downloads -= 100 : downloads = downloads} type="button" class="btn btn-ghost uppercase flex-1">- 100</button>
            <button onclick={() => downloads += 100} type="button" class="btn btn-ghost uppercase flex-1">+ 100</button>
          </div>
          <span class="label">{downloads} downloads</span>
        </fieldset>
        <div class="card-actions justify-end">
          <button onclick={uploadCargo} type="button"  class="btn btn-neutral uppercase w-1/2">Start</button>
        </div>
      {/if}
    </section>
  </div>
  <div class="flex flex-col gap-4 w-full sm:flex-1 xl:flex-row">
    <section id="active" class="card card-sm card-border h-[calc(100vh-2rem)] sm:h-[calc(100vh-18.75rem)] xl:h-[calc(100vh-12rem)]  bg-base-300 xl:flex-1">
      <div class="card-body h-full">
        <h3 class="card-title">Files</h3>
        {#if data.active.length < 1}
          <figure class="w-full flex-1 items-center justify-center">
            <img class="sm:max-w-sm" src="/friends.svg" alt="An illustration a person sitting in a garden with their pet" />
          </figure>
        {:else}
          <div class="h-full overflow-y-auto w-full">
            <ul class="list bg-base-100 rounded-box shadow-md">
              {#each data.active as cargo}
                <li class="list-row">
                  <div>
                    <Icon typeInput={cargo.content_type} />
                  </div>
                  <div>
                    <div>{cargo.name}</div>
                    <div class="text-xs uppercase font-semibold opacity-60">Expires in {Math.floor( ( ( new Date(cargo.storage_valid_until).valueOf() - Date.now() ) / (1000 * 60 * 60 * 24)) )} days</div>
                  </div>
                  <button onclick={() => {
                    cargo_info = {
                      name: cargo.name,
                      is_public: cargo.is_public,
                      type: getType(cargo.content_type),
                      downloads_left: cargo.downloads_total - cargo.downloads_count,
                      size: cargo.size,
                      drops: ( cargo.subpoints / 100 ).toFixed(2),
                      id: cargo.id
                    }
                    openCargoModal()
                  }} class="btn btn-square btn-neutral">
                    <Info />
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </section>
  </div>
</div>
<div>
  <dialog bind:this={cargo_info_modal} class="modal modal-bottom sm:modal-middle">
    <div class="modal-box bg-neutral text-base-100">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-4.5">
          <CircleX />
        </button>
      </form>
      <h3 class="text-lg font-bold uppercase">{cargo_info.type}</h3>
      {#if cargo_loading }
        <div class="flex justify-center items-center h-50 sm:h-44 w-full">
          <span class="loading loading-spinner text-base-100"></span>
        </div>
      {:else}
        <div class="flex flex-col gap-3 mt-2 mb-4 w-full">
          <span class="text-wrap overflow-ellipsis wrap-anywhere font-mono font-bold">{cargo_info.name}</span>
          <div class="flex flex-row w-full justify-between">
            <p class="w-1/3">Size</p>
            <span class="flex-1 wrap-anywhere">
              {
              cargo_info.size > 100 * (1024**2) ? 
              `${( Math.round( (cargo_info.size / (1024 ** 3)) * 100 ) / 100 ).toFixed(2)} GB` : 
              `${( Math.round( (cargo_info.size / (1024 ** 2)) * 100 ) / 100 ).toFixed(2)} MB`
              }
            </span>
          </div>
          <div class="flex flex-row w-full justify-between">
            <p class="w-1/3">Access</p>
            <span class="flex-1">{cargo_info.is_public ? 'Public' : 'Private'}</span>
          </div>
          <div class="flex flex-row w-full justify-between">
            <p class="w-1/3">Downloads</p>
            <span class="flex-1">{cargo_info.downloads_left}</span>
          </div>
          <div class="flex flex-row w-full justify-between">
            <p class="w-1/3">Cost</p>
            <span class="flex-1">{cargo_info.drops} Drops</span>
          </div>
        </div>
      {/if}
      <div class="modal-action">
        <button disabled={cargo_loading} class="btn btn-error" onclick={deleteCargo}>
          <Trash2 />
        </button>
        <button disabled={cargo_loading} class="btn" onclick={''}>
          <Download />
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>Close</button>
    </form>
  </dialog>
</div>
<div class="toast toast-top toast-center z-400000000000">
  {#each toasts as toast (toast.id) }
    <div class={`alert alert-${toast.type}`}>
      <span>{toast.message}</span>
    </div>
  {/each}
</div>