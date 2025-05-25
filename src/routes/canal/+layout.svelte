<script>
  import { page } from '$app/state';
  import { FolderClosed, Settings, MessageCircle, Home } from '@lucide/svelte'
  let { children } = $props()

  const path = $derived(page.url.pathname)
  const routesWithNoNav = ['/canal/generate', '/canal/generate/phrase']

  const getTitle = (path) => {
    if (path.startsWith('/canal/bridges')) return 'Bridges'
    if (path.startsWith('/canal/jetsam')) return 'Cargo'
    if (path.startsWith('/canal/settings')) return 'Settings'
    if (path === '/canal') return 'Home'
    return ''
  }
  const title = $derived(getTitle(path))
  
</script>

{#if !routesWithNoNav.some(route => route === path)}
  <div class="flex justify-between items-center pl-4 sm:pl-12 sm:pr-8">
    <h1 class="text-xl sm:text-2xl font-semibold">{title}</h1>
    <div role="tablist" class="tabs tabs-border tabs-lg">
      <a role="tab" href="/canal" class={`tab ${path === '/canal' ? 'tab-active' : ''}`}><Home  /></a>
      <a role="tab" href="/canal/bridges" class={`tab ${/.*\/bridges\/?.*/.test(path) ? 'tab-active' : ''}`}><MessageCircle  /></a>
      <a role="tab" href="/canal/jetsam" class={`tab ${/.*\/jetsam\/?.*/.test(path) ? 'tab-active' : ''}`}><FolderClosed  /></a>
      <a role="tab" href="/canal/settings" class={`tab ${/.*\/settings\/?.*/.test(path) ? 'tab-active' : ''}`}><Settings  /></a>
    </div>
  </div>
{/if}

{@render children()}