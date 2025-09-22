import { error, fail, redirect } from '@sveltejs/kit'
import { z }  from 'zod'
import { PUBLIC_SERVER, PUBLIC_APP_ENV, PUBLIC_COOKIE_DOMAIN } from '$env/static/public'
import { decodeJwt } from 'jose'

export async function load({ cookies, url, request, getClientAddress }){
  const token = cookies.get('access_token')
  console.log(getClientAddress(), request.headers.get('x-real-ip'), request.headers.get('x-forwarded-for'))
  if(token){
    const claims = decodeJwt(token)
    const valid = await fetch(`${PUBLIC_SERVER}/canal/session/poll?id=${claims.sid}`)
    if(!valid.ok) {
      cookies.delete('access_token', { path: '/' })
      cookies.delete('canal_session', { path: '/' })
    }
  }
}

export const actions = {
  auth: async ({ request, cookies }) => {
    const visitor = cookies.get('visitor_token')
    if(visitor){ return fail(400, { autherror: 'Please log out of your bridge first'}) }

    const token = cookies.get('access_token')
    if(token){
      const claims = decodeJwt(token)
      const valid = await fetch(`${PUBLIC_SERVER}/canal/session/poll?id=${claims.sid}`)
      if(valid.ok){ redirect(303, '/canal') }
    }

    const data = await request.formData()
    const values = Object.fromEntries( Object.entries( Object.fromEntries(data.entries()) ).filter(([_, value]) => value != "") )

    const schema = z.object({
      sequence: z.string({ message: 'Provide letter sequence' }).length(8, 'The letter sequence is not correctly formatted'),
      passphrase: z.string({ message: 'Provide a hash of your passphrase' })
    })

    const validate = schema.safeParse({ passphrase: values.passphrase_hash, sequence: values.sequence })

    if(validate.success === false){
      const formatted = validate.error.format()
      let message = ''
      formatted._errors.forEach(val => message += `${val}; `)
      if(formatted.sequence){ formatted.sequence._errors.forEach(val => message += `${val}; `) }
      if(formatted.passphrase){ formatted.passphrase?._errors.forEach(val => message += `${val};`) }
      return fail(400, { autherror: message })
    }
    
    const res = await fetch(`${PUBLIC_SERVER}/canal/auth`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': request.headers.get('user-agent') },
        body: JSON.stringify({passphrase_hash: validate.data.passphrase, sequence: validate.data.sequence})
      }
    )
    
    if(!res.ok){ return fail(res.status, { autherror: await res.text()}) }

    const canal = await res.json()

    if(canal.access_token){
      const claims = decodeJwt(canal.access_token)
      const cookieOptions = { 
        sameSite: 'strict', 
        path: '/', 
        expires: new Date(claims.exp*1000)
      }
      if(PUBLIC_APP_ENV === 'production'){ cookieOptions.domain = PUBLIC_COOKIE_DOMAIN }
      cookies.set('access_token', canal.access_token, cookieOptions)
      cookies.set('canal_session', claims.sid, { sameSite: 'strict', path: '/', expires: new Date(claims.exp*1000), httpOnly: false })
      redirect(302, '/canal')
    } else if(canal.auth_token){ 
      cookies.set('auth_token', canal.auth_token, { sameSite: 'strict', path: '/', expires: new Date( Date.now()+1000*60*3 ) })
      redirect(302, '/access')
    }
  }
}