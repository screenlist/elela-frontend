<script>
  import { page } from '$app/state';
  import { FolderClosed, Settings, MessageCircle, Home } from '@lucide/svelte'
  let { children } = $props()

  const path = $derived(page.url.pathname)
  const routesWithNoNav = ['/canal/generate', '/canal/generate/phrase']
  const titles = {
    '/canal': 'Home',
    '/canal/bridges': 'Bridges',
    '/canal/jetsam': 'Cargo',
    '/canal/settings': 'Settings'
  }
</script>

{#if !routesWithNoNav.some(route => route === path)}
  <div class="flex justify-between items-center pl-4 sm:pl-12 sm:pr-8">
    <h1 class="text-xl sm:text-2xl font-semibold">{titles[path]}</h1>
    <div role="tablist" class="tabs tabs-border tabs-lg">
      <a role="tab" href="/canal" class={`tab ${path === '/canal' ? 'tab-active' : ''}`}><Home  /></a>
      <a role="tab" href="/canal/bridges" class={`tab ${path === '/canal/bridges' ? 'tab-active' : ''}`}><MessageCircle  /></a>
      <a role="tab" href="/canal/jetsam" class={`tab ${path === '/canal/jetsam' ? 'tab-active' : ''}`}><FolderClosed  /></a>
      <a role="tab" href="/canal/settings" class={`tab ${path === '/canal/settings' ? 'tab-active' : ''}`}><Settings  /></a>
    </div>
  </div>
{/if}

{@render children()}