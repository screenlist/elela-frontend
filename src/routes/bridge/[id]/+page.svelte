<script>
  import { onMount, onDestroy } from "svelte"
  import { page, navigating } from "$app/state"
  import { PUBLIC_SERVER, PUBLIC_APP_ENV } from "$env/static/public";
  import { SendHorizonal } from "@lucide/svelte";

  let { data } = $props()

  let retry
  let text = $state('')
  let sender = $state(null)
  let isPageActive = $state(true)
  let currentPage = page.url.pathname

  function sendText(){
    console.log('Submitting...')
    if(sender?.readyState === WebSocket.OPEN){
      sender.send(text)
      text = ''
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

		socket.addEventListener('open', (ws) => { socket.send('I swear this so cool') })
		socket.addEventListener('message', (ws) => { console.log(ws.data) })
		
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
  
  onDestroy(() => {
    cleanUp()
  })

  onMount(() => {
    isPageActive = true
    realtime()
  })

  $effect(() => {
    if(navigating && currentPage !== page.url.pathname){ cleanUp() }
  })

  $inspect(isPageActive, currentPage).with(console.log)
</script>

<div class="flex flex-col justify-items-start items-center">
  <div class="card card-xs bg-base-300 max-w-sm w-full min-w-2xs h-[calc(100vh-2rem)]">
    <form class="card-body flex-col h-full" onsubmit={(event) => event.preventDefault()}>
      <div class="flex-1 overflow-y-auto scrollbar-hide"></div>
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

