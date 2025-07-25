<script>
  import { onMount, onDestroy, tick } from "svelte"
  import { page, navigating } from "$app/state"
  import { PUBLIC_SERVER, PUBLIC_APP_ENV } from "$env/static/public"
  import { SendHorizonal, Clock, Image, CircleX, Eye, Info, PartyPopper } from "@lucide/svelte"
  import { getCookie } from "$lib/cookie"
  import { sha1 } from 'hash-wasm'
  import { addToast, cleanupToasts, dismissToast } from '$lib/toasts'
  import { toasts } from '$lib/toasts.svelte.js'

  let { data } = $props()

  let retry
  let msgContainer
  let text = $state('')
  let sender = $state(null)
  let isPageActive = $state(true)
  let currentPage = page.url.pathname
  let person = $state(null)
  let person_type = $state(null)
  let messages = $state([])

  let is_peer_online = $state(false)
  let is_peer_typing = $state(false)
  let time_since_peer_typed = $state(new Date())
  let intervals
  let time_to_destruction = $state(new Date(data.bridge.end_time).valueOf() - new Date().valueOf())
  let time_to_commencement = $state(new Date(data.bridge.start_time).valueOf() - new Date().valueOf())
  let start_time_ms = $state(new Date(data.bridge.start_time).valueOf())
  let created_at_ms = $state(new Date(data.bridge.created_at).valueOf())
  let time_elapsed_before_commencement = $derived(Math.round( time_to_commencement / ( start_time_ms - created_at_ms ) * 100 ))

  let isConnectionAllowed = $derived(time_to_destruction > 0 && time_to_commencement < 0)
  let isConnected = $state(false)

  let image = $state(null)
  let preview = $state(null)

  let loading = $state(false)

  let open = $state({})
  let opened = $state({})
  let opening = $state({})

  const formatter = new Intl.NumberFormat('en-ZA', {
    minimumIntegerDigits: 2,
  })

  async function sendText(){
    loading = true
    if(image){
      if(sender?.readyState === WebSocket.OPEN){
        const cargo = await uploadImage()
        console.log(cargo)
        if(cargo){
          sender.send(JSON.stringify({
            type: 'text',
            data: { message: text, cargo: cargo }
          }))
          text = ''
          removeImage()
          scrollBottom()
          loading = false
        } else { loading = false }
      }
    } else {
      if(text.length > 0 && sender?.readyState === WebSocket.OPEN){
        sender.send(JSON.stringify({
          type: 'text',
          data: { message: text }
        }))
        text = ''
        scrollBottom()
        loading = false
      } else { loading = false }
    }
  }

  function realtime(){
    if (!isPageActive || !isConnectionAllowed) return
    const url = PUBLIC_APP_ENV === 'production' ? `wss://${PUBLIC_SERVER.split('//')[1]}` : `ws://${PUBLIC_SERVER.split('//')[1]}`
		const socket = new WebSocket(`${url}/canal/realtime/${page.params.id}`, 'chat')

		const handleRetry = () => {
      if(isPageActive && !isConnected && isConnectionAllowed){
          retry = setTimeout(function () {
          console.log('Attempting to reconnect...')
          realtime()
        }, 2000)
      }
		}

		socket.addEventListener('open', (ws) => { 
      isConnected = true
      socket.send(
        JSON.stringify({
          type: 'joined',
          data: { message: 'I am online' }
        })
      )
    })
    
		socket.addEventListener('message', (ws) => {
      
      const msg = JSON.parse(ws.data)

      if(msg.type === 'text_history'){
        msg.data.forEach(val => {
          if(messages.findIndex(item => item.id === val.id) < 0){
            binarySearchInsertAsc(val)
          }
        })
      }

      if(msg.type === 'text'){
        if(messages.findIndex(item => item.id === msg.data.id) < 0){
          binarySearchInsertAsc(msg.data)
          scrollBottom()
        }
      }

      if(msg.type === 'typing'){
        time_since_peer_typed = new Date()
        is_peer_typing = true
      }

      if(msg.type === 'joined'){
        if(msg.from !== person){ is_peer_online = true }
      }

      if(msg.type === 'left'){
        console.log(msg.data)
        if(msg.from !== person){ is_peer_online = false }
      }

      if(msg.type === 'error'){
        console.log(msg.data)
      }

    })
		
		socket.addEventListener('close', event => {
      isConnected = false
			if(event.wasClean){
				console.log('Closed gracefully')
			} else {
        handleRetry()
      }
		})
		
		if(retry){ clearTimeout(retry) }

		sender = socket
	}

  function cleanUp() {
    isPageActive = false
    if (retry) { 
      clearTimeout(retry)
      retry = null
    }
    if (intervals){
      clearInterval(intervals)
    }
    if (sender && sender.readyState === WebSocket.OPEN) {
      sender.close()
    }
    cleanupToasts()
  }

  function binarySearchInsertAsc(newItem) {
    let left = 0
    let right = messages.length
    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      if (messages[mid]['created_at'] < newItem['created_at']) left = mid + 1
      else right = mid
    }
    messages.splice(left, 0, newItem)
  }

  async function scrollBottom(){ 
    await tick()
    msgContainer.scrollTop = msgContainer.scrollHeight 
  }

  function counter(){
    intervals = setInterval(() => {
      if(time_since_peer_typed < new Date( Date.now() - 500 )){
        is_peer_typing = false
      }
      time_to_destruction =  new Date(data.bridge.end_time).valueOf() - new Date().valueOf()
      time_to_commencement = new Date(data.bridge.start_time).valueOf() - new Date().valueOf()
    }, 1000)
  }

  function openFileDialog(){
    const file_input = document.createElement('input')

    file_input.type = 'file'
    file_input.accept = 'image/*'
    file_input.multiple = false
    
    file_input.style.position = 'fixed'
    file_input.style.top = '-1000px'
    file_input.style.left = '-1000px'

    document.body.appendChild(file_input)

    file_input.addEventListener('change', () => {
      console.log('something has changed')
      const file = file_input.files[0]
      if(file){
        image = file
        const reader = new FileReader()
        reader.onload = e => { preview = e.target.result }
        reader.readAsDataURL(file)
      }
      
      document.body.removeChild(file_input)
    })

    file_input.click()
  }

  function removeImage(){
    image = null
    preview = null
  }

  async function uploadImage(){
    const hash = await sha1(new Uint8Array(await image.arrayBuffer()))
    const name = image.name
    const type = image.type
    const size = image.size
    const response = await fetch(`${PUBLIC_SERVER}/jetsam/connection/${page.params.id}`,
      {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({sha1: hash, type: type, name: name, size: size})
      }
    )
    if(!response.ok){ 
      addToast({ message: await response.text(), type: 'error', auto: true }); 
      return null; 
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
      body: image
    })
    if(!upload.ok){ 
      addToast({ message: await upload.text(), type: 'error', auto: true }); 
      return null; 
    }
    const upload_info = await upload.json()
    const finish = await fetch(`${PUBLIC_SERVER}/jetsam/connection/${page.params.id}?cargo=${info.id}`,{
      method: 'PATCH',
      credentials: 'include',
      body: JSON.stringify({file_id: upload_info.fileId})
    })
    if(!finish.ok){ 
      addToast({ message: await finish.text(), type: 'error', auto: true }); 
      return null; 
    }
    const cargo = await finish.json()
    return cargo.id
  }

  async function openChatImage(cargo){
    opening[cargo] = true
    const response = await fetch(`${PUBLIC_SERVER}/jetsam/connection/${page.params.id}?cargo=${cargo}`,
      {
        method: 'GET',
        credentials: 'include'
      }
    )
    if(!response.ok){
      opened[cargo] = await response.text()
      opening[cargo] = false
    } else {
      const reader = new FileReader()
      reader.onload = e => {
        open[cargo] = e.target.result
      }
      reader.readAsDataURL(await response.blob())
      opening[cargo] = false
    }
  }
  
  onDestroy(() => {
    cleanUp()
  })

  onMount(() => {
    if(getCookie('wave_session')){ person = data.bridge.wave_id; person_type = 'wave' }
    if(getCookie('canal_session')){ person = data.bridge.bridge_id; person_type = 'bridge' }
    isPageActive = true
    realtime()
    counter()
    messages.push(...data.bridge.messages)
    scrollBottom()
  })

  $effect(() => {
    if(isPageActive && isConnectionAllowed && !isConnected){
      realtime()
    } else if(!isConnectionAllowed && isConnected){
      if(sender && sender.readyState === WebSocket.OPEN){ sender.close() }
      if(retry){ clearTimeout(retry) }
    }
  })

  $effect(() => {
    if(navigating && currentPage !== page.url.pathname){ cleanUp() }
  })

  $effect(() => {
    if(text.length > 0 && sender?.readyState === WebSocket.OPEN){
      sender.send(JSON.stringify({
        type: 'typing',
        data: { message: 'Actively typing...' }
      }))
    }
  })

  $effect(() => { scrollBottom() })

  $inspect(open, opened).with(console.log)

  function returnLink(){
    if(person === data.bridge.bridge_id && isConnectionAllowed){
      return '/canal/bridges/'+data.bridge.bridge_id.split(':')[1]
    } else if(person === data.bridge.bridge_id && !isConnectionAllowed){
      return '/canal/bridges'
    } else {
      return '/bridge'
    }
  }
</script>

<div class="flex flex-col justify-items-start items-center">
  <div class="card card-xs bg-base-300 max-w-sm w-full min-w-2xs h-[calc(100vh-2rem)]">
    <form class="card-body flex-col h-full" onsubmit={(event) => event.preventDefault()}>
      <div class="navbar bg-base-100 rounded-md shadow-sm">
        <div class="navbar-start w-4/5">
          <div class="flex flex-col">
            <h1 class="line-clamp-1 text-lg font-bold">{person === data.bridge.bridge_id ?  data.bridge.counterflare : data.bridge.flare }</h1>
            <span class={`flex items-center font-semibold ${is_peer_online ? 'text-primary' : 'text-neutral opacity-70'}`}>
              <div aria-label="status" class={`status ${is_peer_online ? 'status-primary animate-pulse' : 'status-neutral'} mr-2`}></div>
              {is_peer_online ? 'Online' : 'Offline'}
              {#if is_peer_typing}
                <span class="text-neutral font-normal ml-2">& is typing...</span>
              {/if}
            </span>
          </div>
        </div>
        <div class="navbar-end w-1/5">
          <a class="btn btn-circle text-xl" href={returnLink()}>
            <img src="/icon-light.svg" alt="Elela icon" height="40px" width="40px" />
          </a>
        </div>
      </div>
      {#if time_to_destruction > 0 && time_to_commencement < 0}
        <div class="w-full flex items-center">
          {#if time_to_destruction > 1000 * 60 * 3}
            <progress class="progress progress-primary flex-1" value={time_to_destruction} max={new Date(data.bridge.end_time).valueOf() - new Date(data.bridge.start_time).valueOf()}></progress>
          {/if}
          <span class={`badge font-semibold ${time_to_destruction > 1000 * 60 * 3 ? 'ml-2 badge-primary' : 'badge-warning flex-1 justify-start'}`}>
            <Clock size={16}/>
            {#if time_to_destruction > 1000 * 60 * 3 }
              <span class="countdown">
                <span style={`--value:${formatter.format(Math.floor( (time_to_destruction % (1000 * 60 * 60)) / (1000 * 60) ))};`} aria-live="polite" aria-label={`${formatter.format(Math.floor( (time_to_destruction % (1000 * 60 * 60)) / (1000 * 60) ))}`}>
                  {formatter.format(Math.floor( (time_to_destruction % (1000 * 60 * 60)) / (1000 * 60) ))}
                </span>
                : 
                <span style={`--value:${formatter.format(Math.floor( (time_to_destruction % (1000 * 60)) / (1000) ))};`} aria-live="polite" aria-label={`${formatter.format(Math.floor( (time_to_destruction % (1000 * 60)) / (1000) ))}`}>
                  {formatter.format(Math.floor( (time_to_destruction % (1000 * 60)) / (1000) ))}
                </span>
              </span>
            {:else}
              This bridge will collapse in 
              <span class="countdown">
                <span style={`--value:${formatter.format(Math.floor( (time_to_destruction % (1000 * 60 * 60)) / (1000 * 60) ))};`} aria-live="polite" aria-label={`${formatter.format(Math.floor( (time_to_destruction % (1000 * 60 * 60)) / (1000 * 60) ))}`}>
                  {formatter.format(Math.floor( (time_to_destruction % (1000 * 60 * 60)) / (1000 * 60) ))}
                </span>
                :
                <span style={`--value:${formatter.format(Math.floor( (time_to_destruction % (1000 * 60)) / (1000) ))};`} aria-live="polite" aria-label={`${formatter.format(Math.floor( (time_to_destruction % (1000 * 60)) / (1000) ))}`}>
                  {formatter.format(Math.floor( (time_to_destruction % (1000 * 60)) / (1000) ))}
                </span>
              </span>
            {/if}
          </span>
        </div> 
      {/if}
      <div bind:this={msgContainer} class="flex-1 overflow-y-auto scrollbar-hide">
        <div class="min-h-full flex flex-col justify-end">
          {#if time_to_commencement < 0 && time_to_destruction > 0}
            {#each messages as msg }
              <div class={`chat ${msg.in === person ? 'chat-end' : 'chat-start'}`}>
                {#if msg.has_attachment}
                  <div class={`card ${msg.in === person ? 'bg-neutral border-neutral' : 'bg-accent border-accent ml-[0.75rem]'}  border-2  w-80 shadow-sm ${!open[msg.attachment.split(':')[1]] ? 'min-h-65' : ''}`}>
                    {#if open[msg.attachment.split(':')[1]] && !opened[msg.attachment.split(':')[1]] && !opening[msg.attachment.split(':')[1]] }
                      <figure class={`w-full rounded-md`} >
                        <img src={open[msg.attachment.split(':')[1]]} alt="Attachment" />
                      </figure>
                      {#if msg.body.length > 0 }
                        <div class="card-body">
                          <span class={`text-sm ${msg.in === person ? 'text-base-100' : 'text-neutral'}`}>{msg.body}</span>
                        </div>
                      {/if}
                    {:else}
                      <div class="card-body">
                        {#if !open[msg.attachment.split(':')[1]] && !opened[msg.attachment.split(':')[1]] && !opening[msg.attachment.split(':')[1]] }
                          <div class={`flex-1 flex flex-col justify-center items-center ${msg.in === person ? 'text-base-100' : 'text-neutral'}`}>
                            <PartyPopper />
                            <span class="mt-4">{msg.in === person ? 'You have sent an open once photo!' : 'You have received an open once photo!'}</span>
                          </div>
                        {:else if !open[msg.attachment.split(':')[1]] && opened[msg.attachment.split(':')[1]] && !opening[msg.attachment.split(':')[1]] }
                          <div class={`flex-1 flex flex-col justify-center items-center ${msg.in === person ? 'text-base-100' : 'text-neutral'}`}>
                            <Info />
                            <span class="mt-4">{opened[msg.attachment.split(':')[1]]}</span>
                          </div>
                        {:else if opening[msg.attachment.split(':')[1]] }
                          <div class={`flex-1 flex justify-center items-center ${msg.in === person ? 'text-base-100' : 'text-neutral'}`}>
                            <span class={`loading loading-spinner`}></span>
                          </div>
                        {/if}
                        {#if !open[msg.attachment.split(':')[1]] && !opened[msg.attachment.split(':')[1]] }
                          <div class="card-actions items-center justify-center">
                            <button disabled={opening[msg.attachment.split(':')[1]] ? true : false} type="button" onclick={() => openChatImage(msg.attachment.split(':')[1])} class={`btn mt-2 ${msg.in === person ? '' : 'btn-neutral'}`}>
                              <Eye /> Open
                            </button>
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </div>
                {:else}
                  <span class={`chat-bubble text-sm ${msg.in === person ? 'chat-bubble-neutral' : 'chat-bubble-accent'}`}>
                    {msg.body}
                  </span>
                {/if}
              </div>
            {/each}
          {:else if time_to_commencement > 0 && time_to_destruction > 0}
            <div class="flex flex-col w-full justify-center items-center pb-12">
              <div class="radial-progress bg-primary border-primary border-4 text-base-100 text-xl font-semibold" style={`--value:${time_elapsed_before_commencement}; --size:15rem; --thickness: 1rem;`} aria-valuenow={time_elapsed_before_commencement} role="progressbar">
                <span class="countdown">
                  <span style={`--value:${Math.floor( (time_to_commencement / (1000 * 60 * 60 * 24)) )};`} aria-live="polite" aria-label={`${Math.floor( (time_to_commencement / (1000 * 60 * 60 * 24)) )}`}>
                    {Math.floor( (time_to_commencement / (1000 * 60 * 60 * 24)) )}
                  </span>
                  d
                  <span style={`--value:${Math.floor( (time_to_commencement % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60) )};`} aria-live="polite" aria-label={`${Math.floor( (time_to_commencement % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60) )}`}>
                    {Math.floor( (time_to_commencement % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60) )}
                  </span>
                  h
                  <span style={`--value:${Math.floor( (time_to_commencement % (1000 * 60 * 60)) / (1000 * 60) )};`} aria-live="polite" aria-label={`${Math.floor( (time_to_commencement % (1000 * 60 * 60)) / (1000 * 60) )}`}>
                    {Math.floor( (time_to_commencement % (1000 * 60 * 60)) / (1000 * 60) )}
                  </span>
                  m
                  <span style={`--value:${Math.floor( (time_to_commencement % (1000 * 60)) / (1000) )};`} aria-live="polite" aria-label={`${Math.floor( (time_to_commencement % (1000 * 60)) / (1000) )}`}>
                    {Math.floor( (time_to_commencement % (1000 * 60)) / (1000) )}
                  </span>
                  s
                </span>
              </div>
              <h2 class="mt-8 text-lg font-semibold">The bridge will erect soon</h2>
            </div>
          {:else if time_to_commencement < 0 && time_to_destruction < 0}
            <div class="flex flex-col w-full justify-center items-center pb-12">
              <figure class="w-full max-w-sm">
                <img src="/feeling-blue.svg" alt="An illustration of an giant sad face"/>
              </figure>
              <h2 class="mt-4 text-xl font-semibold">The bridge has collapsed</h2>
            </div>
          {/if}
        </div>
      </div>
      {#if time_to_destruction > 0 && time_to_commencement < 0}
        {#if preview && image}
          <div class="card bg-neutral border-2 border-neutral w-full shadow-sm">
            <figure id="prevfig" class="max-h-[calc(50vh-2rem)] rounded-md overflow-y-auto">
              <img
                src={preview}
                alt="Preview" />
            </figure>
            <div class="card-body text-base-100">
              <div class="flex flex-row items-center justify-between">
                <h3 class="font-bold flex-1">
                  {#if loading}
                    <span class="loading loading-spinner loading-xs"></span>
                    <span class="ml-2">Sending...</span>
                  {:else}
                    <span>Image preview</span>
                  {/if}
                </h3>
                <button disabled={loading} type="button" onclick={removeImage} class="btn btn-ghost btn-circle">
                  <CircleX />
                </button>
              </div>
            </div>
          </div>
        {/if}
        <div class="join">
          <button disabled={loading} onclick={openFileDialog} type="button" class="btn btn-outline btn-circle mr-1" >
            <Image />
          </button>
          <input disabled={loading} autocomplete="off" class="input join-item rounded-l-full" bind:value={text} type="text" name="text" placeholder="Say something to the other guy..."/>
          <div class="card-actions">
            <button disabled={loading} type="submit" onclick={sendText} class="btn btn-primary join-item">
              <SendHorizonal/>
            </button>
          </div>
        </div>
      {/if}
    </form>
  </div>
</div>
<div class="toast toast-top toast-center">
  {#each toasts as toast (toast.id) }
    <div class={`alert alert-${toast.type}`}>
      <span>{toast.message}</span>
    </div>
  {/each}
</div>