// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
export const orders = sqliteTable('orders', {
 id: text('id').primaryKey(), payloadHash: text('payload_hash').notNull(), payload: text('payload').notNull(),
 mailStatus: text('mail_status').notNull(), status: text('status').notNull(), paymentStatus: text('payment_status').notNull(),
 createdAt: integer('created_at').notNull(), providerId: text('provider_id'), lockedUntil: integer('locked_until')
});
export const orderRateLimits = sqliteTable('order_rate_limits', {
 bucket: text('bucket').primaryKey(), attempts: integer('attempts').notNull(), expiresAt: integer('expires_at').notNull()
});
export const products = sqliteTable('products', {
 id: text('id').primaryKey(), name: text('name').notNull(), category: text('category').notNull(),
 price: integer('price').notNull(), quantity: integer('quantity'), productType:text('product_type'), image: text('image').notNull(), imagesJson: text('images_json'),
 description: text('description').notNull(), measurements: text('measurements').notNull(),
 active: integer('active').notNull(), version: integer('version').notNull(), updatedAt: integer('updated_at').notNull()
});
export const shopSettings = sqliteTable('shop_settings', {key:text('key').primaryKey(),value:text('value').notNull()});
export const orderWorkflow = sqliteTable('order_workflow', {
 orderId:text('order_id').primaryKey(), paymentMailAt:integer('payment_mail_at'), paidAt:integer('paid_at'),
 fulfilledAt:integer('fulfilled_at'), confirmedAt:integer('confirmed_at'), cancelledAt:integer('cancelled_at'), notes:text('notes').notNull(), version:integer('version').notNull()
});
export const adminHistory = sqliteTable('admin_history', {
 id:text('id').primaryKey(),entityId:text('entity_id').notNull(),action:text('action').notNull(),actor:text('actor').notNull(),
 details:text('details').notNull(),createdAt:integer('created_at').notNull()
});
export const productDailyViews = sqliteTable('product_daily_views', {
 key:text('key').primaryKey(), productId:text('product_id').notNull(), day:text('day').notNull(), views:integer('views').notNull()
});

export const orderInventory=sqliteTable('order_inventory',{
 orderId:text('order_id').notNull(),productId:text('product_id').notNull(),quantity:integer('quantity').notNull(),physical:integer('physical').notNull(),productType:text('product_type').notNull(),state:text('state').notNull()
},table=>[primaryKey({columns:[table.orderId,table.productId]})]);
export const inventoryMovements=sqliteTable('inventory_movements',{
 id:integer('id').primaryKey(),orderId:text('order_id').notNull(),productId:text('product_id').notNull(),action:text('action').notNull(),physical:integer('physical').notNull(),made:integer('made').notNull(),createdAt:integer('created_at').notNull()
});
