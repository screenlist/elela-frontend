<script>
  import { FileText, FileImage, FileVideo, FileAudio, FileArchive, File, FileCode } from '@lucide/svelte'
  let { typeInput } = $props()
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
  <FileVideo/>
{:else if type() ===  'image' }
  <FileImage />
{:else if type() ===  'audio' }
  <FileAudio/>
{:else if type() ===  'text' }
  <FileText/>
{:else if type() ===  'pdf' }
  <FileText/>
{:else if type() ===  'archive' }
  <FileArchive/>
{:else if type() ===  'code' }
  <FileCode/>
{:else if type() ===  'other' }
  <File/>
{/if}