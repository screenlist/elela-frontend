import { PUBLIC_SERVER } from '$env/static/public'

export async function GET({ cookies }){
  return new Response(JSON.stringify({ 'status': 'success' }))
}