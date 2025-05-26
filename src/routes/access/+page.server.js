import { error, fail, redirect } from '@sveltejs/kit'
import { z }  from 'zod'
import { PUBLIC_SERVER } from '$env/static/public'
import { decodeJwt } from 'jose'

export async function load({ cookies, url, request }){
  const token = cookies.get('access_token')

  if(token){
    const claims = decodeJwt(token)
    const valid = await fetch(`${PUBLIC_SERVER}/canal/session/poll?id=${claims.sid}`)
    if(valid.ok){ redirect(303, '/canal') }
  }
}

export const actions = {
  verify: async ({ request, cookies }) => {
    const token = cookies.get('access_token')
    const auth_token = cookies.get('auth_token')

    if(token){
      const claims = decodeJwt(token)
      const valid = await fetch(`${PUBLIC_SERVER}/canal/session/poll?id=${claims.sid}`)
      if(valid.ok){ redirect(303, '/canal') }
    }

    if(!auth_token){ return fail(400, { autherror: 'No authentication token found, start afresh.'}) }

    const data = await request.formData()
    const res = await fetch(`${PUBLIC_SERVER}/canal/2fa/verify`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': request.headers.get('user-agent') },
        body: JSON.stringify({
          auth_token: auth_token,
          totp_token: await data.get('totp_token')
        })
      }
    )
    
    if(!res.ok){ return fail(res.status, { autherror: await res.text()}) }

    const canal = await res.json()
    cookies.delete('auth_token', {path: '/'})

    const claims = decodeJwt(canal.access_token)
    cookies.set('access_token', canal.access_token, { sameSite: 'strict', path: '/', expires: new Date(claims.exp*1000) })
    cookies.set('canal_session', claims.sid, { sameSite: 'strict', path: '/', expires: new Date(claims.exp*1000), httpOnly: false })
    redirect(302, '/canal')
  }
}