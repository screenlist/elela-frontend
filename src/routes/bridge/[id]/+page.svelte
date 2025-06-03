<script>
  import { onMount, onDestroy, tick } from "svelte"
  import { page, navigating } from "$app/state"
  import { PUBLIC_SERVER, PUBLIC_APP_ENV } from "$env/static/public"
  import { SendHorizonal } from "@lucide/svelte"
  import { getCookie } from "$lib/cookie";

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

  function sendText(){
    console.log('Submitting...')
    if(sender?.readyState === WebSocket.OPEN){
      sender.send(JSON.stringify({
        type: 'text',
        data: { message: text }
      }))
      text = ''
      scrollBottom()
    }
  }

  function realtime(){
    if (!isPageActive) return
    const url = PUBLIC_APP_ENV === 'production' ? `wss://${PUBLIC_SERVER.split('//')[1]}` : `ws://${PUBLIC_SERVER.split('//')[1]}`
    console.log(url)
		const socket = new WebSocket(`${url}/canal/realtime/${page.params.id}`, 'chat')

		const handleRetry = () => {
      if(isPageActive){
          retry = setTimeout(function () {
          console.log('Attempting to reconnect...')
          realtime()
        }, 2000)
      }
		}

		socket.addEventListener('open', (ws) => { 
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

    })
		
		socket.addEventListener('close', event => {
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
    if (sender && sender.readyState === WebSocket.OPEN) {
      sender.close()
    }
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
  
  onDestroy(() => {
    cleanUp()
  })

  onMount(() => {
    if(getCookie('wave_session')){ person = data.bridge.wave_id; person_type = 'wave' }
    if(getCookie('canal_session')){ person = data.bridge.bridge_id; person_type = 'bridge' }
    console.log(getCookie('canal_session'))
    isPageActive = true
    realtime()
    messages.push(...data.bridge.messages)
    scrollBottom()
  })

  $effect(() => {
    if(navigating && currentPage !== page.url.pathname){ cleanUp() }
  })

  $effect(() => {
    if(sender?.readyState === WebSocket.OPEN){
      sender.send(JSON.stringify({
        type: 'typing',
        data: { message: 'Actively typing...' }
      }))
    }
  })

  $effect(() => { scrollBottom() })

  $inspect(person, messages).with(console.log)
</script>

<div class="flex flex-col justify-items-start items-center">
  <div class="card card-xs bg-base-300 max-w-sm w-full min-w-2xs h-[calc(100vh-2rem)]">
    <form class="card-body flex-col h-full" onsubmit={(event) => event.preventDefault()}>
      <div bind:this={msgContainer} class="flex-1 overflow-y-auto scrollbar-hide">
        <div class="min-h-full flex flex-col justify-end">
          {#each messages as msg }
            <div class={`chat ${msg.in === person ? 'chat-end' : 'chat-start'}`}>
              <span class={`chat-bubble text-sm ${msg.in === person ? 'chat-bubble-neutral' : 'chat-bubble-accent'}`}>{msg.body}</span>
            </div>
          {/each}
        </div>
      </div>
      <div class="join">
        <input class="input join-item" bind:value={text} type="text" name="text" placeholder="Say something to the other guy..."/>
        <div class="card-actions">
          <button type="submit" onclick={sendText} class="btn btn-neutral join-item">
            <SendHorizonal/>
          </button>
        </div>
      </div>
    </form>
  </div>
</div>

