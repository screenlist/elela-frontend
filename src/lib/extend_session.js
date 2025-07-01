export default function extend_session(){
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