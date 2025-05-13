import { error, fail, redirect } from '@sveltejs/kit'
import { z }  from 'zod'

export async function load({ cookies }){
  const token = cookies.get('access_token')
}

export const actions = {
  auth: async ({ request }) => {
    const data = await request.formData()
    const passphrase = await data.get('passphrase')
    const schema = z.string().trim().min(1, 'Enter a canal passphrase')
    const validate = schema.safeParse(passphrase)
    if(validate.success === false){
      return fail(400, { autherror: validate.error.message })
    }
    console.log(validate)
  }
}