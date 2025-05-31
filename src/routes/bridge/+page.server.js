import { error, fail, redirect } from '@sveltejs/kit'
import { PUBLIC_SERVER } from '$env/static/public'

export async function load({ cookies, url }){
  const token = cookies.get('access_token')
  const session = cookies.get('wave_session')
  if(token && session){
    const valid = await fetch(`${PUBLIC_SERVER}/canal/wave`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if(valid.ok){ 
      return { bridge: await valid.json() }
    } else {
      cookies.delete('wave_session', { path: '/' })
    }
  }
}

export const actions = {
  auth: async ({ request, cookies }) => {
    const data = await request.formData()
    const values = Object.fromEntries( Object.entries( Object.fromEntries(data.entries()) ).filter(([_, value]) => value != "") )

    const flare = values.flare
    const counterflare = values.counterflare
    const anchor = values.passphrase

    const res = await fetch(`${PUBLIC_SERVER}/canal/wave/auth`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 'User-Agent': request.headers.get('user-agent')
        },
        body: JSON.stringify({
          flare: flare,
          counterflare: counterflare,
          anchor: anchor
        })
      }
    )
    
    if(!res.ok){ return fail(res.status, { posterror: await res.text()}) }

    const auth = await res.json()

    if(auth.approved === true){
      const claims = decodeJwt(auth.access_token)
      cookies.set('access_token', auth.access_token, { sameSite: 'strict', path: '/', expires: new Date(claims.exp*1000) })
      cookies.set('wave_session', claims.sid, { sameSite: 'strict', path: '/', expires: new Date(claims.exp*1000), httpOnly: false })
      auth.access_token = null
      return { bridge: auth }
    } else {
      return { bridge: auth }
    }
  },
  logout: async ({cookies}) => {
    const token = cookies.get('access_token')

    const res = await fetch(`${PUBLIC_SERVER}/canal/wave/remove`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      }
    )

    if(!res.ok){ return fail(res.status, { posterror: await res.text()}) }

    cookies.delete('access_token', { path: '/' })
    cookies.delete('wave_session', { path: '/' })

    return { success: true }
  }
}