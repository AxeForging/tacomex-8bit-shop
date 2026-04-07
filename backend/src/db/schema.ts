import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  jsonb,
  primaryKey,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// =============================================================================
// Seed History Table
// =============================================================================

export const seedHistory = pgTable('_seed_history', {
  id: serial('id').primaryKey(),
  seedName: varchar('seed_name', { length: 255 }).unique().notNull(),
  executedAt: timestamp('executed_at').defaultNow(),
});

// =============================================================================
// Users Table
// =============================================================================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('customer').$type<'customer' | 'admin'>(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  roleCheck: check('role_check', sql`${table.role} IN ('customer', 'admin')`),
}));

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  orderStatusHistory: many(orderStatusHistory),
  favorites: many(userFavorites),
  notifications: many(notifications),
}));

// =============================================================================
// Categories Table
// =============================================================================

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

// =============================================================================
// Products Table
// =============================================================================

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  isAvailable: boolean('is_available').default(true),
  isFeatured: boolean('is_featured').default(false),
  spiceLevel: integer('spice_level').default(0),
  prepTimeMinutes: integer('prep_time_minutes').default(15),
  calories: integer('calories'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  spiceLevelCheck: check('spice_level_check', sql`${table.spiceLevel} >= 0 AND ${table.spiceLevel} <= 5`),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  options: many(productOptions),
  orderItems: many(orderItems),
  favorites: many(userFavorites),
}));

// =============================================================================
// Product Options Table
// =============================================================================

export const productOptions = pgTable('product_options', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  optionType: varchar('option_type', { length: 50 }).notNull().$type<'size' | 'extra' | 'sauce' | 'side'>(),
  priceModifier: decimal('price_modifier', { precision: 10, scale: 2 }).default('0'),
  isDefault: boolean('is_default').default(false),
}, (table) => ({
  optionTypeCheck: check('option_type_check', sql`${table.optionType} IN ('size', 'extra', 'sauce', 'side')`),
}));

export const productOptionsRelations = relations(productOptions, ({ one }) => ({
  product: one(products, {
    fields: [productOptions.productId],
    references: [products.id],
  }),
}));

// =============================================================================
// Promotions Table
// =============================================================================

export const promotions = pgTable('promotions', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).unique().notNull(),
  description: text('description'),
  discountType: varchar('discount_type', { length: 20 }).notNull().$type<'percentage' | 'fixed'>(),
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal('min_order_amount', { precision: 10, scale: 2 }).default('0'),
  maxUses: integer('max_uses'),
  currentUses: integer('current_uses').default(0),
  startsAt: timestamp('starts_at').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  discountTypeCheck: check('discount_type_check', sql`${table.discountType} IN ('percentage', 'fixed')`),
}));

export const promotionsRelations = relations(promotions, ({ many }) => ({
  orders: many(orders),
}));

// =============================================================================
// Orders Table
// =============================================================================

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 50 }).default('pending').$type<'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'>(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  promotionId: integer('promotion_id').references(() => promotions.id, { onDelete: 'set null' }),
  deliveryAddress: text('delivery_address'),
  deliveryNotes: text('delivery_notes'),
  estimatedDelivery: timestamp('estimated_delivery'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  statusCheck: check('status_check', sql`${table.status} IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')`),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  promotion: one(promotions, {
    fields: [orders.promotionId],
    references: [promotions.id],
  }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
}));

// =============================================================================
// Order Items Table
// =============================================================================

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: varchar('product_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  optionsJson: jsonb('options_json'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// =============================================================================
// Order Status History Table
// =============================================================================

export const orderStatusHistory = pgTable('order_status_history', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
});

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
  createdByUser: one(users, {
    fields: [orderStatusHistory.createdBy],
    references: [users.id],
  }),
}));

// =============================================================================
// User Favorites Table
// =============================================================================

export const userFavorites = pgTable('user_favorites', {
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.productId] }),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [userFavorites.productId],
    references: [products.id],
  }),
}));

// =============================================================================
// Notifications Table (fake email & SMS stored from RabbitMQ queue)
// =============================================================================

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  channel: varchar('channel', { length: 10 }).notNull().$type<'email' | 'sms'>(),
  subject: varchar('subject', { length: 500 }),
  body: text('body').notNull(),
  fromAddress: varchar('from_address', { length: 255 }),
  toAddress: varchar('to_address', { length: 255 }).notNull(),
  isRead: boolean('is_read').default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  channelCheck: check('channel_check', sql`${table.channel} IN ('email', 'sms')`),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// =============================================================================
// Type Exports
// =============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductOption = typeof productOptions.$inferSelect;
export type NewProductOption = typeof productOptions.$inferInsert;

export type Promotion = typeof promotions.$inferSelect;
export type NewPromotion = typeof promotions.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type OrderStatusHistoryItem = typeof orderStatusHistory.$inferSelect;
export type NewOrderStatusHistoryItem = typeof orderStatusHistory.$inferInsert;

export type UserFavorite = typeof userFavorites.$inferSelect;
export type NewUserFavorite = typeof userFavorites.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
