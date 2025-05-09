<script>
  import { page } from '$app/state';
  import { FolderClosed, Settings, MessageSquare } from '@lucide/svelte'
  let { children } = $props()

  const path = $derived(page.url.pathname)
</script>
<div role="tablist" class="tabs tabs-border">
  <a role="tab" href="/canal" class={`tab ${path === '/canal' ? 'tab-active' : ''}`}>Home</a>
  <a role="tab" href="/canal/bridges" class={`tab ${path === '/canal/bridges' ? 'tab-active' : ''}`}>Chat</a>
  <a role="tab" href="/canal/jetsam" class={`tab ${path === '/canal/jetsam' ? 'tab-active' : ''}`}>Storage</a>
  <a role="tab" href="/canal/settings" class={`tab ${path === '/canal/settings' ? 'tab-active' : ''}`}>Settings</a>
</div>
{@render children()}