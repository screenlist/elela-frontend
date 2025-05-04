<script>
  import { Info } from '@lucide/svelte'
</script>

<div class="flex flex-col justify-items-start items-center p-4">
  <div class="card card-border bg-base-300 max-w-lg w-full min-w-xs">
    <div class="card-body">
      <h1 class="card-title">Counterflare</h1>
      <fieldset class="fieldset">
          <label for="flare" class="fieldset-legent">Flare</label>
          <span class="label">The initial phrase as exposed to you by a sailor</span>
          <input name="flare" type="text" class="input w-full" placeholder="😎 worries aplenty 👨🏽‍🍳🥰" />
          <div class="divider"></div>
          <label for="counterflare" class="fieldset-legent">Counterflare</label>
          <span class="label">A two words reply phrase of at least 4 letters each</span>
          <input name="counterflare" type="text" class="input w-full" placeholder="calmly breathe" />
          <div role="alert" class="alert alert-soft alert-info">
            <Info />
            <span>The phrase will form a part of counterflare which you must show to the creator of the flare</span>
          </div>
          <div class="divider"></div>
          <label for="passphrase" class="fieldset-legent">Anchor</label>
          <p class="label">A private passphrase you will need to join a bridge chat</p>
          <input name="passphrase" type="password" class="input w-full" placeholder="Passphrase" />
          <div role="alert" class="alert alert-soft alert-info">
            <Info />
            <span>Never share the passphrase with anyone, treat it like your password and do not forget it</span>
          </div>
      </fieldset>
      <div class="card-actions flex-col">
        <button class="btn btn-primary mt-4 w-full">Reply</button>
      </div>
    </div>
  </div>
</div>