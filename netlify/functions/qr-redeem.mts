import { getUser } from '@netlify/identity'
import type { Config } from '@netlify/functions'
import { redeemToken, seedDemoData } from './qr-core.js'

export default async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const body = await request.json() as { token?: string; paymentFingerprint?: string; confirmed?: boolean }
  if (!body.confirmed) return Response.json({ error: 'Explicit payment confirmation is required.' }, { status: 400 })
  if (!body.token || !body.paymentFingerprint) return Response.json({ error: 'Missing payment details.' }, { status: 400 })

  await seedDemoData()
  const user = await getUser()
  const result = await redeemToken(body.token, user?.id ?? null, body.paymentFingerprint)
  if (!result) return Response.json({ error: 'This item has already been paid for.' }, { status: 409 })
  return Response.json({ success: true, ...result })
}

export const config: Config = { path: '/api/qr/redeem' }
