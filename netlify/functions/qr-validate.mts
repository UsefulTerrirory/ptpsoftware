import type { Config } from '@netlify/functions'
import { getTokenRecord, seedDemoData } from './qr-core.js'

export default async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const body = await request.json() as { token?: string }
  const token = body.token?.trim()
  if (!token || token.length > 160) return Response.json({ error: 'Invalid QR token.' }, { status: 400 })

  await seedDemoData()
  const record = await getTokenRecord(token)
  if (!record) return Response.json({ error: 'This QR code is not recognized.' }, { status: 404 })
  if (record.status === 'redeemed' || record.redeemedAt) {
    return Response.json({ error: 'This item has already been paid for.', redeemedAt: record.redeemedAt }, { status: 409 })
  }

  const subtotalCents = record.priceCents
  const taxCents = Math.round(subtotalCents * Number(record.taxRate))
  return Response.json({
    valid: true,
    item: {
      qrId: record.qrId,
      serialNumber: record.serialNumber,
      restaurantId: record.restaurantId,
      restaurantName: record.restaurantName,
      accent: record.accent,
      productId: record.productId,
      productName: record.productName,
      description: record.description,
      imageUrl: record.imageUrl,
      subtotalCents,
      taxCents,
      totalCents: subtotalCents + taxCents,
    },
  })
}

export const config: Config = { path: '/api/qr/validate' }
