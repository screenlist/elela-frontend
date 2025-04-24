<script>
    import { House } from "@lucide/svelte";
</script>
<div class="flex flex-col justify-items-start items-center p-4">
    <div class="card card-border bg-base-300 max-w-sm w-full min-w-xs">
        <div class="card-body">
            <h1 class="card-title">Maritime waters await...</h1>
            <fieldset class="fieldset">
                <label for="passphrase" class="label">Passphrase</label>
                <input name="passphrase" type="password" class="input w-full" placeholder="...all you need is six words" />
            </fieldset>
            <div class="card-actions flex-col">
                <button class="btn btn-primary mt-4 w-full">Enter</button>
                <div class="divider">OR</div>
                <a href="/canal/generate" class="btn btn-outline w-full">Generate a new canal</a>
            </div>
        </div>
    </div>
</div>

