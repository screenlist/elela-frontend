import {redirect } from '@sveltejs/kit'

export async function load({ cookies, url }){
  redirect(307, '/canal/settings/refill')
}