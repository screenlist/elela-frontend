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
  </div>
{/if}

{@render children()}