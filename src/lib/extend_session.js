import { getCookie } from "./cookie"
import { PUBLIC_SERVER } from "$env/static/public"
import { session } from "./expiry.svelte"
import { setupSessionTimers } from "./session"

export default async function extend_session(){
  await fetch(`/canal/settings/extend`, {
    method: 'POST'
  })

  const sid = getCookie('canal_session')
  if(sid){
    const valid = await fetch(`${PUBLIC_SERVER}/canal/session/poll?id=${sid}`)
    if(valid.ok){
      const data = await valid.json()
      session.expiry = new Date(data.expires_at)
      await setupSessionTimers(session.expiry, { onWarning, onExpiry })
    }
  }
}

async function onExpiry(){
    await fetch(`/canal/settings/logout`, { method: 'POST' })
    goto('/')
    session.expiry = null
    clearSessionTimers()
    if(warningOnceOpened){
      sessionWarningDialog.close()
      warningOnceOpened = false
    }
  }