export async function encryptFileChunk(chunk, key, nonce, offset){
  const iv = new Uint8Array(16)
  iv.set(nonce)
  iv.set(uint32ToBytes(Math.floor(offset / 16)), 12)

  const content = await crypto.subtle.encrypt(
    { name: 'AES-CTR', counter: iv, length: 64 },
    key,
    chunk
  )

  return new Uint8Array([...iv, ...new Uint8Array(content)])
}

export async function encryptFile(chunk, key){
  const iv = crypto.getRandomValues(new Uint8Array(16))

  const content = await crypto.subtle.encrypt(
    { name: 'AES-CTR', counter: iv, length: 64 },
    key,
    chunk
  )

  return new Uint8Array([...iv, ...new Uint8Array(content)])
}

export async function decryptFile(chunk, key){
	const iv = chunk.slice(0, 16)
  const data = chunk.slice(16)

  return new Uint8Array(await crypto.subtle.decrypt(
    { name: 'AES-CTR', counter: iv, length: 64 },
    key,
    data
  ))
}

export async function deriveKey(hash, salt){
  const encoder = new TextEncoder()

  const material = await crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 10000,
      hash: 'SHA-256'
    },
    material,
    { name: 'AES-CTR', length: 128 },
    true,
    ['encrypt', 'decrypt']
  )
}

export function authenticationPass(str){
  return str+' for authentication'
}

export function encryptionPass(str){
  return str+' for encryption'
}

function uint32ToBytes(num) {
  const arr = new Uint8Array(4)
  
  arr[0] = (num >> 24) & 0xff
  arr[1] = (num >> 16) & 0xff
  arr[2] = (num >> 8)  & 0xff
  arr[3] = num         & 0xff
  return arr;
}