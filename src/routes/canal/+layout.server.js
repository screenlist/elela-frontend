import { error, fail, redirect } from '@sveltejs/kit'
import { PUBLIC_SERVER } from '$env/static/public'

export async function load({ cookies, url }){
  const token = cookies.get('access_token')
  const response = await fetch(`${PUBLIC_SERVER}/canal`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if(!response.ok){
    error(response.status, { message: await response.text() })
  }

  return {canal: await response.json()}
}