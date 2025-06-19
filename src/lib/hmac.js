import { encodeHex } from "@std/encoding"

export async function computeHMAC(message, salt){
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(salt),
    {
      name: 'HMAC',
      hash: {name: 'SHA-256'}
    },
    false,
    ['sign', 'verify']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return encodeHex(signature)
}