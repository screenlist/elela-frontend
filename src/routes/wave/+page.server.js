import { error, fail, redirect } from '@sveltejs/kit'
import { PUBLIC_SERVER } from '$env/static/public'

export const actions = {
  wave: async ({ request, cookies }) => {
    const data = await request.formData()
    const values = Object.fromEntries( Object.entries( Object.fromEntries(data.entries()) ).filter(([_, value]) => value != "") )

    const flare = values.flare
    const counterflare = values.counterflare
    const anchor = values.passphrase_hash
    const salt = values.passphrase_salt
    const public_key = values.public_key

    const res = await fetch(`${PUBLIC_SERVER}/canal/wave`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          flare: flare,
          counterflare: counterflare,
          anchor: anchor,
          salt: salt
        })
      }
    )
    
    if(!res.ok){ return fail(res.status, { posterror: await res.text()}) }

    return { wave: await res.json() }
  }
}