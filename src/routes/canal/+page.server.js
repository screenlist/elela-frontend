import { error, fail, redirect } from '@sveltejs/kit'
import { PUBLIC_SERVER } from '$env/static/public'

export async function load({ cookies, url }){
  const token = cookies.get('access_token')
  const sessionRes = await fetch(`${PUBLIC_SERVER}/canal/session/validate`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const statisticsRes = await fetch(`${PUBLIC_SERVER}/canal/statistics`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if(!sessionRes.ok){
    error(sessionRes.status, { message: await sessionRes.text() })
  }

  if(!statisticsRes.ok){
    error(statisticsRes.status, { message: await statisticsRes.text() })
  }

  return {session: await sessionRes.json(), statistics: await statisticsRes.json()}
}