import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const restaurants = pgTable('restaurants', {
  id: text().primaryKey(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  category: text().notNull(),
  accent: text().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const products = pgTable(
  'products',
  {
    id: text().primaryKey(),
    restaurantId: text('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    description: text().notNull(),
    imageUrl: text('image_url').notNull(),
    priceCents: integer('price_cents').notNull(),
    taxRate: numeric('tax_rate', { precision: 5, scale: 4 }).notNull().default('0.0825'),
    active: boolean().notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('products_restaurant_idx').on(table.restaurantId)],
)

export const qrCodes = pgTable(
  'qr_codes',
  {
    id: text().primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    batchId: text('batch_id').notNull(),
    serialNumber: text('serial_number').notNull(),
    status: text().notNull().default('unused'),
    redeemedAt: timestamp('redeemed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('qr_codes_token_hash_idx').on(table.tokenHash),
    index('qr_codes_batch_idx').on(table.batchId),
    index('qr_codes_status_idx').on(table.status),
  ],
)

export const payments = pgTable(
  'payments',
  {
    id: text().primaryKey(),
    qrCodeId: text('qr_code_id')
      .notNull()
      .references(() => qrCodes.id),
    identityUserId: text('identity_user_id'),
    subtotalCents: integer('subtotal_cents').notNull(),
    taxCents: integer('tax_cents').notNull(),
    totalCents: integer('total_cents').notNull(),
    paymentTokenFingerprint: text('payment_token_fingerprint').notNull(),
    status: text().notNull().default('succeeded'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('payments_qr_code_idx').on(table.qrCodeId),
    index('payments_user_idx').on(table.identityUserId),
  ],
)

export const customerProfiles = pgTable('customer_profiles', {
  identityUserId: text('identity_user_id').primaryKey(),
  displayName: text('display_name').notNull(),
  loyaltyPoints: integer('loyalty_points').notNull().default(0),
  notificationPreferences: text('notification_preferences').notNull().default('all'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const favoriteRestaurants = pgTable(
  'favorite_restaurants',
  {
    identityUserId: text('identity_user_id').notNull(),
    restaurantId: text('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('favorites_user_restaurant_idx').on(table.identityUserId, table.restaurantId)],
)
