<script>
  import { page } from "$app/state";
  import { Lock, Droplet, CirclePlus, MonitorSmartphone } from "@lucide/svelte";
  let { children } = $props()

  const path = $derived(page.url.pathname)
</script>
<div class="flex flex-col justify-items-start">
  <div class="flex flex-col gap-4 sm:flex-row">
    <ul class="menu bg-base-300 rounded-box w-full sm:w-60">
      <li><a href="/canal/settings/refill" class={`${path === '/canal/settings/refill' ? 'menu-active' : ''}`}><Droplet />Refill Canal</a></li>
      <li><a href="/generate" class={`${path === '/generate' ? 'menu-active' : ''}`}><CirclePlus />Generate Canal</a></li>
      <li><a href="/canal/settings/access" class={`${path === '/canal/settings/access' ? 'menu-active' : ''}`}><Lock /> Secure Access</a></li>
      <li><a href="/canal/settings/sessions" class={`${path === '/canal/settings/sessions' ? 'menu-active' : ''}`}><MonitorSmartphone />Active Sessions</a></li>
    </ul>
    <div class="flex-1">
      {@render children()}
    </div>
  </div>
</div>

