import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { payments, products, qrCodes, restaurants as restaurantTable } from '../../db/schema.js'
import { demoTokens, findProduct, restaurants } from '../../src/data/ptp.js'

export const hashValue = async (value: string) => {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const seedDemoData = async () => {
  for (const restaurant of restaurants) {
    await db.insert(restaurantTable).values({
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.id,
      category: restaurant.category,
      accent: restaurant.accent,
    }).onConflictDoNothing()

    await db.insert(products).values(restaurant.menu.map((product) => ({
      id: product.id,
      restaurantId: restaurant.id,
      name: product.name,
      description: product.description,
      imageUrl: product.image,
      priceCents: Math.round(product.price * 100),
      taxRate: '0.0825',
    }))).onConflictDoNothing()
  }

  for (const demo of demoTokens) {
    await db.insert(qrCodes).values({
      id: `qr-${demo.productId}`,
      productId: demo.productId,
      tokenHash: await hashValue(demo.token),
      batchId: 'DEMO-2026-07',
      serialNumber: demo.serial,
    }).onConflictDoNothing()
  }
}

export const getTokenRecord = async (token: string) => {
  const tokenHash = await hashValue(token)
  const [record] = await db
    .select({
      qrId: qrCodes.id,
      status: qrCodes.status,
      redeemedAt: qrCodes.redeemedAt,
      serialNumber: qrCodes.serialNumber,
      productId: products.id,
      productName: products.name,
      description: products.description,
      imageUrl: products.imageUrl,
      priceCents: products.priceCents,
      taxRate: products.taxRate,
      restaurantId: restaurantTable.id,
      restaurantName: restaurantTable.name,
      accent: restaurantTable.accent,
    })
    .from(qrCodes)
    .innerJoin(products, eq(qrCodes.productId, products.id))
    .innerJoin(restaurantTable, eq(products.restaurantId, restaurantTable.id))
    .where(eq(qrCodes.tokenHash, tokenHash))
    .limit(1)

  return record
}

export const redeemToken = async (token: string, identityUserId: string | null, paymentFingerprint: string) => {
  const tokenHash = await hashValue(token)
  const now = new Date()
  return db.transaction(async (transaction) => {
    const [claimed] = await transaction
      .update(qrCodes)
      .set({ status: 'redeemed', redeemedAt: now })
      .where(and(eq(qrCodes.tokenHash, tokenHash), eq(qrCodes.status, 'unused'), isNull(qrCodes.redeemedAt)))
      .returning({ id: qrCodes.id, productId: qrCodes.productId })

    if (!claimed) return null
    const found = findProduct(claimed.productId)
    if (!found) throw new Error('Product record missing for token')
    const subtotalCents = Math.round(found.product.price * 100)
    const taxCents = Math.round(subtotalCents * 0.0825)
    const paymentId = `pay_${crypto.randomUUID()}`

    await transaction.insert(payments).values({
      id: paymentId,
      qrCodeId: claimed.id,
      identityUserId,
      subtotalCents,
      taxCents,
      totalCents: subtotalCents + taxCents,
      paymentTokenFingerprint: await hashValue(paymentFingerprint),
    })

    return { paymentId, redeemedAt: now.toISOString(), totalCents: subtotalCents + taxCents }
  })
}
