import { PUBLIC_SERVER } from '$env/static/public'

export async function POST({ cookies }){
  const token = cookies.get('access_token')

  await fetch(`${PUBLIC_SERVER}/canal/session/validate`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }
  )

  return new Response(JSON.stringify({ 'status': 'success' }))
}