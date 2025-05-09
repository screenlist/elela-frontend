<script>
  import '../app.css'
  import '@fontsource-variable/inter'
  import '@fontsource-variable/jetbrains-mono'
  import '@fontsource-variable/biorhyme'
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { decodeJwt } from 'jose'
  import { PUBLIC_SERVER } from '$env/static/public'

  let { children } = $props()

  function getCookie(name) {
    const cookieArray = document.cookie.split('; ');
    const cookie = cookieArray.find(row => row.startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
  }

  let sessionWarningDialog
  let warningOnceOpened = $state(false)
  let sessionExpiry = new Date()

  async function trackSession(expiry){
    const difference = new Date(expiry) - new Date()
    if(difference < 1000*60*1 && warningOnceOpened ===  false){
      sessionWarningDialog.showModal()
      warningOnceOpened = true
    }
    if(difference < 0){
      await fetch(`/canal/settings/logout`, {
        method: 'POST'
      })
      goto('/')
    }
  }

  async function extendSession() {
    await fetch(`/canal/settings/extend`, {
      method: 'POST'
    })

    const session = getCookie('canal_session')
    if(session){
      const valid = await fetch(`${PUBLIC_SERVER}/canal/session/poll?id=${session}`)
      if(valid.ok){
        const data = await valid.json()
        sessionExpiry = data.expires_at
      }
    }

    warningOnceOpened = false
    sessionWarningDialog.close()
  }

  onMount(async () => { 
    const session = getCookie('canal_session') 
    if(session){
      const valid = await fetch(`${PUBLIC_SERVER}/canal/session/poll?id=${session}`)
      if(valid.ok){
        const data = await valid.json()
        sessionExpiry = data.expires_at
      }
    }
    
    const interval = setInterval(async () => {
      await trackSession(sessionExpiry)
    }, 1000)

    return () => { clearInterval(interval) }
  })

</script>

<header class="pb-4 pt-6">
  <nav class="navbar bg-base-100 shadow-sm">
    <div class="navbar-start">
    </div>
    <div class="navbar-center">
      <a class="btn btn-circle text-xl" href="/">
        <img src="/icon-dark.svg" alt="Elela icon" height="100px" width="100px" />
      </a>
    </div>
    <div class="navbar-end">
    </div>
  </nav>
</header>
<main class="flex-grow pt-4">
  {@render children()}
</main>
<div>
  <dialog bind:this={sessionWarningDialog} class="modal modal-bottom sm:modal-middle">
    <div class="modal-box bg-accent">
      <h3 class="text-lg font-bold">Session</h3>
      <p class="py-4">Your session is about expire in less than 1 minute due to inactivity. To remain logged in, extend it.</p>
      <div class="modal-action">
        <button class="btn btn-neutral" onclick={extendSession}>Extend</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>Close</button>
    </form>
  </dialog>
</div>
<footer class="footer sm:footer-horizontal footer-center text-base-content p-4">
  <aside>
    <img class="mb-4" src="/logo-light.svg" alt="Elela logo" width="100px" />
    <span>Made with ❤️ in Braamfontein, Johannesburg</span>
  </aside>
</footer>