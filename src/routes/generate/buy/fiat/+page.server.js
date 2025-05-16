import { error, fail, redirect } from '@sveltejs/kit'
import { z }  from 'zod'
import { PUBLIC_SERVER } from '$env/static/public'
import { decodeJwt } from 'jose'

export async function load({ url }){
  const quantity = url.searchParams.get('quantity')
  const email = url.searchParams.get('email')
  const res = await fetch(`${PUBLIC_SERVER}/payments/fiat?quantity=${quantity}&email=${email}`)

  if(!res.ok){ error(404, { message: await res.text() }) }
  
  const data = await res.json()
  redirect(303, data.url)
}