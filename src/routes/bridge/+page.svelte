<script>
  import { Info } from '@lucide/svelte'
</script>

<div class="flex flex-col justify-items-start items-center p-4">
  <div class="card card-border bg-base-300 max-w-lg w-full min-w-xs">
    <div class="card-body">
      <h1 class="card-title">Bridge Chat</h1>
      <div role="alert" class="alert alert-soft alert-warning">
        <Info />
        <span>You must have already replied to a flare with a counterflare</span>
      </div>
      <div role="alert" class="alert alert-soft alert-info">
        <Info />
        <span>This can also be used to check if your reply has been accepted</span>
      </div>
      <fieldset class="fieldset">
          <label for="flare" class="label">Flare</label>
          <input name="flare" type="text" class="input w-full" placeholder="😎 worries aplenty 👨🏽‍🍳🥰" />
          <label for="counterflare" class="label">Counterflare</label>
          <input name="counterflare" type="text" class="input w-full" placeholder="😮 calmly breathe 👨🏽🧘🏽‍♀️" />
          <label for="passphrase" class="label">Anchor</label>
          <input name="passphrase" type="password" class="input w-full" placeholder="Passphrase" />
      </fieldset>
      <div class="card-actions flex-col">
        <button class="btn btn-primary mt-4 w-full">Join</button>
      </div>
    </div>
  </div>
</div>