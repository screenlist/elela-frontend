<script>
  import { FileText, FileImage, FileVideo, FileAudio, FileArchive, File, FileCode } from '@lucide/svelte'
  let { typeInput, size } = $props()
  const typePatterns = {
    video: /^video\/.*/,
    image: /^image\/.*/,
    audio: /^audio\/.*/,
    text: /^text\/.*/,
    pdf: /^application\/pdf$/,
    archive: /^application\/(x-.*|zip|vnd\.rar|x-tar|gzip|x-7z-compressed|x-bzip2)$/,
    code: /^(text\/(x-.*|javascript|json|xml)|application\/(javascript|json|xml|x-.*script|wasm))$/,
  }

  const type = () => {
    for (const [category, pattern] of Object.entries(typePatterns)) {
      if (pattern.test(typeInput)) {
        return category
      }
    }
    return 'other'
  }
</script>

{#if type() ===  'video' }
  {#if size}
    <FileVideo size={size} />
  {:else}
    <FileVideo/>
  {/if}
{:else if type() ===  'image' }
  {#if size}
    <FileImage size={size} />
  {:else}
    <FileImage/>
  {/if}
{:else if type() ===  'audio' }
  {#if size}
    <FileAudio size={size} />
  {:else}
    <FileAudio/>
  {/if}
{:else if type() ===  'text' || type() ===  'pdf' }
  {#if size}
    <FileText size={size} />
  {:else}
    <FileText/>
  {/if}
{:else if type() ===  'archive' }
  {#if size}
    <FileArchive size={size} />
  {:else}
    <FileArchive/>
  {/if}
{:else if type() ===  'code' }
  {#if size}
    <FileCode size={size} />
  {:else}
    <FileCode/>
  {/if}
{:else if type() ===  'other' }
  {#if size}
    <File size={size} />
  {:else}
    <File/>
  {/if}
{/if}