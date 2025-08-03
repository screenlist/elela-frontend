import { build, files, version } from '$service-worker'

self.addEventListener('install', (event) => {
	self.skipWaiting()
})

self.addEventListener('fetch', async event => {
	const url  = new URL(event.request.url)
	if (url.pathname.startsWith('/canal/jetsam/download')) {
    event.respondWith(handleDownloadInterception(event))
  }
})

async function handleDownloadInterception(event) {
  const url = new URL(event.request.url)
	const meta_url = decodeURIComponent(url.searchParams.get('url'))

	const meta_response = await fetch(meta_url, {
		method: 'GET',
    credentials: 'include'
	})
	if(!meta_response.ok){ throw new Error(`Could not get file metadata`) }
	const meta = await meta_response.json()

  const key = await getDecryptionKey(event)
  
  return new Response(
    new ReadableStream({
      async start(controller) {
				const chunk_size = (6 * ( 1024 ** 2 )) + 16 // Plus the 16 byte IV
        try {
          
					for(let offset = 0; offset < meta.size; offset += chunk_size){
						const response = await fetch(`${meta_url}/partial`, {
							method: 'GET',
							credentials: 'include',
							headers: {
								'Range': `bytes=${offset}-${(offset+chunk_size)-1}`
							}
						})
						
						if (!response.ok) {
							throw new Error(`Server responded with ${response.status}`)
						}

						const decrypted = await decryptChunk(await response.arrayBuffer(), key)
            controller.enqueue(decrypted)
					}
          
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    }),
    {
      headers: {
        'Content-Disposition': `attachment; filename="${meta.name}"`,
        'Content-Type': meta.content_type
      }
    }
  )
}

async function decryptChunk(chunk, key){
	const iv = chunk.slice(0, 16)
  const data = chunk.slice(16)

  return new Uint8Array(await crypto.subtle.decrypt(
    { name: 'AES-CTR', counter: iv, length: 64 },
    key,
    data
  ))
}

async function getDecryptionKey(event){
	const channel = new MessageChannel();
	const receive_key = new Promise(resolve => {
		channel.port1.onmessage = (e) => resolve(e.data.key);
	})

	const clients = await self.clients.matchAll({
		includeUncontrolled: true,
		type: 'window'
	})

	const client = clients.find(client => {
		return client.url.startsWith(event.request.referrer)
	})

	client.postMessage({
			type: 'KEY_REQUEST',
			key_id: 'canal',
			port: channel.port2
		}, [channel.port2]
	)

	return await receive_key
}