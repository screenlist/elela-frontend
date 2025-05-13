import { error, fail, redirect } from '@sveltejs/kit'
import { z }  from 'zod'
import { PUBLIC_SERVER } from '$env/static/public'
import { decodeJwt } from 'jose'

export async function load({ cookies }){
  return {}
}

export const actions = {
  generate: async ({ request, cookies }) => {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({phrase: passphrase})
      }
    )
    
    if(!res.ok){ return fail(res.status, { autherror: await res.text()}) }

    const canal = await res.json()

    if(canal.access_token){
      const claims = decodeJwt(token)
      cookies.set('access_token', canal.access_token, { sameSite: 'strict', path: '/', expires: new Date(claims.exp*1000) })
      redirect(302, '/canal')
    } else if(canal.auth_token){ 
      redirect(302, '/canal/2fa')
    }
  }
}