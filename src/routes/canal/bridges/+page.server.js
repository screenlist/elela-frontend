import { error, fail, redirect } from '@sveltejs/kit'
import { PUBLIC_SERVER } from '$env/static/public'

export async function load({ cookies, url, request }){
  const token = cookies.get('access_token')

  const upcoming = await fetch(`${PUBLIC_SERVER}/canal/bridges?status=upcoming`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })

  const active = await fetch(`${PUBLIC_SERVER}/canal/bridges?status=active`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if(!upcoming.ok){
    error(upcoming.status, { message: await upcoming.text() })
  }

  if(!active.ok){
    error(active.status, { message: await active.text() })
  }

  return {upcoming: await upcoming.json(), active: await active.json()}
}

export const actions = {
  bridge: async ({ request, cookies }) => {
    const token = cookies.get('access_token')
    const data = await request.formData()
    const values = Object.fromEntries( Object.entries( Object.fromEntries(data.entries()) ).filter(([_, value]) => value != "") )
    const flare = values.flare
    const date = values.date
    const time = values.time
    const public_key = values.public_key
    const regeneration_salt = values.regeneration_salt

    if(!date || !time){ return fail(400, { posterror: 'Please fill in both the date and time' }) }

    const start = new Date( date+'T'+time )
    const res = await fetch(`${PUBLIC_SERVER}/canal/bridges`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          flare: flare,
          start_time: start,
          public_key: public_key,
          regeneration_salt: regeneration_salt
        })
      }
    )
    
    if(!res.ok){ return fail(res.status, { posterror: await res.text()}) }

    return { new_bridge: await res.json() }
  }
}