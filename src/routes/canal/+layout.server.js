import { error, fail, redirect } from '@sveltejs/kit'
import { PUBLIC_SERVER } from '$env/static/public'

export async function load({ cookies, url }){

  const routes = [/.*\/generate\/?.*/]
  const isPublic = routes.some(pattern => {
		if(pattern instanceof RegExp){			
			return pattern.test(url.pathname)
		} else {
			return pattern === url.pathname
		}
	})

  if(!isPublic){
    const token = cookies.get('access_token')
    const response = await fetch(`${PUBLIC_SERVER}/canal`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if(!response.ok){
      error(response.status, { message: await response.text() })
    }

    return await response.json()
  }
  
}