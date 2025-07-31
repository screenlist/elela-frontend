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
  import { PUBLIC_SERVER, PUBLIC_CLIENT } from '$env/static/public'
  import { setupSessionTimers, clearSessionTimers } from '$lib/session'
  import { session } from '$lib/expiry.svelte'
  import { cleanupToasts } from '$lib/toasts.js'
  import { getCookie } from '$lib/cookie'
  import { FolderClosed, Settings, MessageCircle, Home, ArrowLeft } from '@lucide/svelte'

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

<svelte:head>
	<title>Elela - Encrypted anonymous file storage & meetings</title>
	<meta name="description" content="Encrypted anonymous private file storage & scheduled meetings with no email, no subscriptions, and no trail." />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Elela - Encrypted anonymous file storage & meetings" />
	<meta name="twitter:description" content="Encrypted anonymous private file storage & scheduled meetings with no email, no subscriptions, and no trail." />
	<meta name="twitter:image" content="/elela-display-art.webp" />

	<meta property="og:title" content="Elela - Encrypted anonymous file storage & meetings" />
	<meta property="og:description" content="Encrypted anonymous private file storage & scheduled meetings with no email, no subscriptions, and no trail." />
	<meta property="og:image" content="/elela-display-art.webp" />
	<meta property="og:image:width" content="1920" />
	<meta property="og:image:height" content="1920" />
	<meta property="og:url" content={`${PUBLIC_CLIENT}`} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Elela" />
	<meta property="og:locale" content="en_ZA" />

	<meta name="keywords" content="anonymous chat, encrypted file storage, ephemeral chat, no email, no subscription storage" />
</svelte:head>

{#if !page.url.pathname.startsWith('/bridge/')}
  <header class="w-full mt-4 mb-4">
    <nav class="bg-base-100 pl-4 pr-4 flex items-center justify-center shadow-sm">
      {#if page.url.pathname !== '/'}
        <button onclick={() => history.back()} class="btn btn-circle btn-primary btn-sm">
          <ArrowLeft />
        </button>
      {/if}
      <a class="text-xl flex-1 flex items-center justify-center" href="/">
        <img src="/elela-name-light.svg" alt="name logo" class="w-[6.25rem]">
      </a>
    </nav>
  </header>
{/if}

<main class={`flex-grow pb-4 h-full overflow-y-auto pl-4 pr-4 scrollbar-hide ${page.url.pathname.startsWith('/bridge/') ? 'pt-4 mb-0' : 'mb-14'}`}>
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