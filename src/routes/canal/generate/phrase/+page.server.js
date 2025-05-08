import { error, fail, redirect } from '@sveltejs/kit'
import { PUBLIC_SERVER } from '$env/static/public'

export async function load({ url }){
  const ref = url.searchParams.get('ref')
	const sender = url.searchParams.get('sender')

  if(ref && sender){
    const res = await fetch(`${PUBLIC_SERVER}/canal/generate?ref=${ref}&sender=${sender}`)
    if(!res.ok){ error(res.status, { message: await res.text() }) }
    return await res.json()
  } else if (ref && !sender){
    const res = await fetch(`${PUBLIC_SERVER}/canal/generate?ref=${ref}`)
    if(!res.ok){ error(res.status, { message: await res.text() }) }
    return await res.json()
  } else {
    const res = await fetch(`${PUBLIC_SERVER}/canal/generate`)
    if(!res.ok){ error(res.status, { message: await res.text() }) }
    return await res.json()
  }
}