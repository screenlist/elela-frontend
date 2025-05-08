import { redirect } from '@sveltejs/kit'
import { decodeJwt } from 'jose'
import { PUBLIC_SERVER } from '$env/static/public'

export async function handle({ event, resolve }) {
	const routes = [
		'quota',
    '/canal',
		/.*\/bridges\/?.*/,
		// /.*\/new\/?.*/,
		// /.*\/edit\/?.*/,
		// /.*\/dashboard\/?.*/
	]

  const token = event.cookies.get('access_token')

  const guarded = routes.some(pattern => {
		if(pattern instanceof RegExp){			
			return pattern.test(event.url.pathname)
		} else {
			return pattern === event.url.pathname
		}
	})

  if(guarded){
    if(!token){ redirect(303, '/') }
    const claims = decodeJwt(token)
    const valid = await fetch(`${PUBLIC_SERVER}/canal/session/poll?id=${claims.sid}`)
    if(!valid.ok){ redirect(303, '/') }
  }

	const response = await resolve(event);
	return response;
}