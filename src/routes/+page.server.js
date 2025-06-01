import { error, fail, redirect } from '@sveltejs/kit'
import { z }  from 'zod'
import { PUBLIC_SERVER } from '$env/static/public'
import { decodeJwt } from 'jose'

export async function load({ cookies, url, request }){
  const token = cookies.get('access_token')
}

export const actions = {
  auth: async ({ request, cookies }) => {
    const token = cookies.get('access_token')

    if(token){
      const claims = decodeJwt(token)
      const valid = await fetch(`${PUBLIC_SERVER}/canal/session/poll?id=${claims.sid}`)
      if(valid.ok){ redirect(303, '/canal') }
    }

    const data = await request.formData()
    const passphrase = await data.get('passphrase')
    const schema = z.string().trim().min(1, 'Enter a canal passphrase')
    const validate = schema.safeParse(passphrase)
    if(validate.success === false){
      return fail(400, { autherror: JSON.parse(validate.error.message)[0]['message'] })
    }
    
    const res = await fetch(`${PUBLIC_SERVER}/canal/auth`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': request.headers.get('user-agent') },
        body: JSON.stringify({phrase: passphrase})
      }
    )
    
    if(!res.ok){ return fail(res.status, { autherror: await res.text()}) }

    const canal = await res.json()

    if(canal.access_token){
      const claims = decodeJwt(canal.access_token)
      cookies.set('access_token', canal.access_token, { sameSite: 'strict', path: '/', expires: new Date(claims.exp*1000) })
      cookies.set('canal_session', claims.sid, { sameSite: 'strict', path: '/', expires: new Date(claims.exp*1000), httpOnly: false })
      redirect(302, '/canal')
    } else if(canal.auth_token){ 
      cookies.set('auth_token', canal.auth_token, { sameSite: 'strict', path: '/', expires: new Date( Date.now()+1000*60*3 ) })
      redirect(302, '/access')
    }
  }
}