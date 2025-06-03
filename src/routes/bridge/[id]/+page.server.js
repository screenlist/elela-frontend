import { error, fail, redirect } from '@sveltejs/kit'
import { PUBLIC_SERVER } from '$env/static/public'

export async function load({ cookies, url, params }){
  const token = cookies.get('access_token') || cookies.get('visitor_token')

  if(!token){ error(403, { message: 'Access denied' }) }
  
  const id = params.id

  const res = await fetch(`${PUBLIC_SERVER}/canal/connection/${id}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if(!res.ok){
    error(res.status, { message: await res.text() })
  }

  return { bridge: await res.json() }
}