import { sqliteTable, integer, text, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const collections = sqliteTable('collections', {
  id: integer('id', { mode: 'number' }).primaryKey({
    autoIncrement: true,
  }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
}, (table) => [
  uniqueIndex('collections_slug_idx').on(table.slug),
])

export const categories = sqliteTable('categories', {
  id: integer('id', { mode: 'number' }).primaryKey({
    autoIncrement: true,
  }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  collectionId: integer('collection_id').references(() => collections.id),
  imageUrl: text('image_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
}, (table) => [
  index('categories_collection_idx').on(table.collectionId),
  uniqueIndex('categories_slug_idx').on(table.slug),
])

export const subcollections = sqliteTable('subcollections', {
  id: integer('id', { mode: 'number' }).primaryKey({
    autoIncrement: true,
  }),
  name: text('name').notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
}, (table) => [
  index('subcollections_category_idx').on(table.categoryId),
])

export const subcategories = sqliteTable('subcategories', {
  id: integer('id', { mode: 'number' }).primaryKey({
    autoIncrement: true,
  }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  subcollectionId: integer('subcollection_id').references(() => subcollections.id),
  imageUrl: text('image_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
}, (table) => [
  index('subcategories_subcollection_idx').on(table.subcollectionId),
  uniqueIndex('subcategories_slug_idx').on(table.slug),
])

export const products = sqliteTable('products', {
  id: integer('id', { mode: 'number' }).primaryKey({
    autoIncrement: true,
  }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description').notNull(),
  price: real('price').notNull(),
  subcategoryId: integer('subcategory_id').references(() => subcategories.id),
  imageUrl: text('image_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
}, (table) => [
  index('products_subcategory_idx').on(table.subcategoryId),
  uniqueIndex('products_slug_idx').on(table.slug),
])
