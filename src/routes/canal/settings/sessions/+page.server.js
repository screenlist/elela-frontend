import { error, fail, redirect } from '@sveltejs/kit'
import { z }  from 'zod'
import { PUBLIC_SERVER } from '$env/static/public'
import { decodeJwt } from 'jose'

export async function load({ cookies, url, request }){
  const token = cookies.get('access_token')

  const response = await fetch(`${PUBLIC_SERVER}/canal/session/all`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if(!response.ok){
    error(response.status, { message: await response.text() })
  }

  return {sessions: await response.json()}
}