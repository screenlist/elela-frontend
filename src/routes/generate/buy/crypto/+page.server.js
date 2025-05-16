import { error, fail, redirect } from '@sveltejs/kit'
import { z }  from 'zod'
import { PUBLIC_SERVER } from '$env/static/public'
import { decodeJwt } from 'jose'

export async function load({ url }){
  const quantity = url.searchParams.get('quantity')
  const email = url.searchParams.get('email')
  const res = await fetch(`${PUBLIC_SERVER}/payments/crypto?quantity=${quantity}`)

  if(!res.ok){ error(res.status, { message: await res.text() }) }
  
  const data = await res.json()
  return {
    crypto: data
  }
}