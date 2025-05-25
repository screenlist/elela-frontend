import { error, fail, redirect } from '@sveltejs/kit'
import { PUBLIC_SERVER } from '$env/static/public'

export const actions = {
  setup: async ({ request, cookies }) => {
    console.log('it hits')
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
  },
  disable: async ({ request, cookies }) => {
    const token = cookies.get('access_token')
  }
}