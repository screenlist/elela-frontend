import { error, fail, redirect } from '@sveltejs/kit'
import { PUBLIC_SERVER } from '$env/static/public'

export async function load({ cookies, url, params }){
  const token = cookies.get('access_token')
  const id = params.id

  const res = await fetch(`${PUBLIC_SERVER}/canal/bridges/${id}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if(!res.ok){
    error(res.status, { message: await res.text() })
  }

  return await res.json() 
}

export const actions = {
  connect: async ({ request, cookies, params }) => {
    const token = cookies.get('access_token')
    const id = params.id
    const data = await request.formData()
    const values = Object.fromEntries( Object.entries( Object.fromEntries(data.entries()) ).filter(([_, value]) => value != "") )
    const counterflare = values.counterflare
    
    const res = await fetch(`${PUBLIC_SERVER}/canal/bridges/${id}/connect`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          counterflare: counterflare
        })
      }
    )
    
    if(!res.ok){ return fail(res.status, { posterror: await res.text()}) }

    return { success: true }
  }
}