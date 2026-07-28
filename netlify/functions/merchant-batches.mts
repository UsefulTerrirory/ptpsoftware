import { getUser, verifyRequestOrigin } from '@netlify/identity'
import type { Config } from '@netlify/functions'
import { db } from '../../db/index.js'
import { qrCodes } from '../../db/schema.js'
import { hashValue } from './qr-core.js'

export default async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  verifyRequestOrigin(request)
  const user = await getUser()
  if (!user) return Response.json({ error: 'Merchant authentication required.' }, { status: 401 })
  const body = await request.json() as { productId?: string; quantity?: number }
  const quantity = Math.min(Math.max(Number(body.quantity) || 0, 1), 5000)
  if (!body.productId) return Response.json({ error: 'Product is required.' }, { status: 400 })

  const batchId = `BATCH-${Date.now().toString(36).toUpperCase()}`
  const generated = await Promise.all(Array.from({ length: quantity }, async (_, index) => {
    const token = `PTP-${crypto.randomUUID()}`
    return {
      id: crypto.randomUUID(),
      productId: body.productId as string,
      token,
      tokenHash: await hashValue(token),
      batchId,
      serialNumber: `${batchId}-${String(index + 1).padStart(5, '0')}`,
    }
  }))

  await db.insert(qrCodes).values(generated.map((entry) => ({
    id: entry.id,
    productId: entry.productId,
    tokenHash: entry.tokenHash,
    batchId: entry.batchId,
    serialNumber: entry.serialNumber,
  })))
  return Response.json({ batchId, quantity, tokens: generated.map(({ token, serialNumber }) => ({ token, serialNumber })) }, { status: 201 })
}

export const config: Config = { path: '/api/merchant/batches' }
