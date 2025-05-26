import { error, fail, redirect } from '@sveltejs/kit'
import { PUBLIC_SERVER } from '$env/static/public'

export const actions = {
  setup: async ({ request, cookies }) => {
    const token = cookies.get('access_token')
    const res = await fetch(`${PUBLIC_SERVER}/canal/2fa/setup`,
      {
        method: 'POST',
        headers: { 
          'User-Agent': request.headers.get('user-agent'), 
          'Authorization': `Bearer ${token}` 
        }
      }
    )
    
    if(!res.ok){ return fail(res.status, { autherror: await res.text()}) }

    return { setup: await res.json() }
  },
  enable: async ({ request, cookies }) => {
    const token = cookies.get('access_token')
    const data = await request.formData()

    const res = await fetch(`${PUBLIC_SERVER}/canal/2fa/enable`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': request.headers.get('user-agent'), 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          auth_token: await data.get('auth_token'),
          totp_token: await data.get('totp_token')
        })
      }
    )
    
    if(!res.ok){ return fail(res.status, { autherror: await res.text()}) }

    return { setup: await res.json() }
  },
  disable: async ({ request, cookies }) => {
    const token = cookies.get('access_token')
    const data = await request.formData()

    const res = await fetch(`${PUBLIC_SERVER}/canal/2fa/disable`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': request.headers.get('user-agent'), 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          totp_token: await data.get('totp_token')
        })
      }
    )
    
    if(!res.ok){ return fail(res.status, { autherror: await res.text()}) }

    return { setup: await res.json() }
  }
}