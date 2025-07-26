<script>
  import '../app.css'
  import '@fontsource-variable/inter'
  import '@fontsource-variable/jetbrains-mono'
  import '@fontsource-variable/biorhyme'
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import { page, navigating } from '$app/state'
  import { decodeJwt } from 'jose'
  import { PUBLIC_SERVER } from '$env/static/public'
  import { setupSessionTimers, clearSessionTimers } from '$lib/session'
  import { session } from '$lib/expiry.svelte'
  import { cleanupToasts } from '$lib/toasts.js'
  import { getCookie } from '$lib/cookie'
  import { FolderClosed, Settings, MessageCircle, Home } from '@lucide/svelte'

  let { children, data } = $props()

  let sessionWarningDialog
  let warningOnceOpened = $state(false)
  let mounted = $state(false)
  let active_session = $state(null)
  const path = $derived(page.url.pathname)

  function onWarning(){
    sessionWarningDialog.showModal()
    warningOnceOpened = true
  }

  async function onExpiry(){
    await fetch(`/canal/settings/logout`, { method: 'POST' })
    goto('/')
    session.expiry = null
    clearSessionTimers()
    if(warningOnceOpened){
      sessionWarningDialog.close()
      warningOnceOpened = false
    }
  }

  async function extendSession() {
    await fetch(`/canal/settings/extend`, {
      method: 'POST'
    })

    const sid = getCookie('canal_session')
    if(sid){
      const valid = await fetch(`${PUBLIC_SERVER}/canal/session/poll?id=${sid}`)
      if(valid.ok){
        const data = await valid.json()
        session.expiry = new Date(data.expires_at)
        await setupSessionTimers(session.expiry, { onWarning, onExpiry })
      }
    }

    warningOnceOpened = false
    sessionWarningDialog.close()
  }

  $effect(async () => {

    if(page.url.pathname){
      const sid = getCookie('canal_session') 

      if(sid){
        const valid = await fetch(`${PUBLIC_SERVER}/canal/session/poll?id=${sid}`)
        if(valid.ok){
          const data = await valid.json()
          session.expiry = new Date(data.expires_at)
          await setupSessionTimers(session.expiry, { onWarning, onExpiry })
        }
      }
    }
    
    return () => { clearSessionTimers() }
  })

  onMount(() => {
    requestAnimationFrame(() => {
      mounted = true
    })
  })

  $effect(() => {  
    if(navigating.type){ active_session = getCookie('canal_session') }
  })

  if(browser){ active_session = getCookie('canal_session') }
</script>

<!-- {#if !page.url.pathname.startsWith('/bridge/')}
  <header class="pb-2 pt-2">
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
{/if} -->

<main class={`flex-grow pt-4 pb-4 h-full overflow-y-auto scrollbar-hide ${page.url.pathname.startsWith('/bridge/') ? 'pl-4 pr-4 mb-0' : 'mb-14'}`}>
  {#if mounted && browser}
    {@render children()}
  {:else}
    <div class="flex flex-col justify-center items-center p-4 h-full">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>
  {/if}
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
{#if !page.url.pathname.startsWith('/bridge/')}
  <div class="dock dock-sm bg-base-300 text-primary sm:pl-[10%] sm:pr-[10%] lg:pl-[25%] lg:pr-[25%]">
    <button onclick={() => goto('/')} class={`${path === '/' ? 'dock-active' : ''}`}>
      <img src="/icon-light.svg" alt="Icon" class="w-[2.4rem]">
    </button>

    {#if active_session}
      <button onclick={() => goto('/canal')} class={`${path === '/canal' ? 'dock-active' : ''}`}>
        <Home size={25} fill="#A7F3D0" />
        <span class="dock-label">Canal</span>
      </button>

      <button onclick={() => goto('/canal/bridges')} class={`${/.*\/bridges\/?.*/.test(path) ? 'dock-active' : ''}`}>
        <MessageCircle size={25} fill="#A7F3D0" />
        <span class="dock-label">Bridge</span>
      </button>

      <button onclick={() => goto('/canal/jetsam')} class={`${/.*\/jetsam\/?.*/.test(path) ? 'dock-active' : ''}`}>
        <FolderClosed size={25} fill="#A7F3D0" />
        <span class="dock-label">Cargo</span>
      </button>

      <button onclick={() => goto('/canal/settings')} class={`${/.*\/settings\/?.*/.test(path) ? 'dock-active' : ''}`}>
        <Settings size={25} fill="#A7F3D0" />
        <span class="dock-label">Settings</span>
      </button>
    {/if}
  </div>
{/if}
{#if navigating.type}
  <div class="toast toast-top toast-center">
    <div class={`btn btn-primary btn-circle`}>
      <span class="loading loading-spinner loading-md"></span>
    </div>
  </div>
{/if}