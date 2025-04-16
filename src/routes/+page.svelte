<script>
    import { Avatar } from "melt/builders";

    const avatar = new Avatar({
        src: "https://api.screenlist.co.za/storage/umjolo-the-gone-girl-jpeg1728754895410optmsd",
    });
</script>

<h1>Welcome to SvelteKit</h1>
<p>
    Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the
    documentation
</p>

<img {...avatar.image} alt="Avatar" />
<span {...avatar.fallback}>RH</span>

<style>
    [data-melt-avatar-image] {
        width: 200px;
    }
</style>
