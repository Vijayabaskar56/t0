import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Collections: ID-based primary key (auto-increment)
export const collections = sqliteTable("collections", {
	id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	slug: text("slug").notNull(),
});

// Categories: slug-based primary key
export const categories = sqliteTable(
	"categories",
	{
		slug: text("slug").primaryKey(),
		name: text("name").notNull(),
		collectionId: integer("collection_id")
			.notNull()
			.references(() => collections.id, { onDelete: "cascade" }),
		imageUrl: text("image_url"),
	},
	(table) => [index("categories_collection_id_idx").on(table.collectionId)],
);

// Subcollections: ID-based primary key (auto-increment)
export const subcollections = sqliteTable(
	"subcollections",
	{
		id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
		name: text("name").notNull(),
		categorySlug: text("category_slug")
			.notNull()
			.references(() => categories.slug, { onDelete: "cascade" }),
	},
	(table) => [index("subcollections_category_slug_idx").on(table.categorySlug)],
);

// Subcategories: slug-based primary key
export const subcategories = sqliteTable(
	"subcategories",
	{
		slug: text("slug").primaryKey(),
		name: text("name").notNull(),
		subcollectionId: integer("subcollection_id")
			.notNull()
			.references(() => subcollections.id, { onDelete: "cascade" }),
		imageUrl: text("image_url"),
	},
	(table) => [
		index("subcategories_subcollection_id_idx").on(table.subcollectionId),
	],
);

// Products: slug-based primary key
export const products = sqliteTable(
	"products",
	{
		slug: text("slug").primaryKey(),
		name: text("name").notNull(),
		description: text("description").notNull(),
		price: text("price").notNull(), // Store as text to preserve PostgreSQL numeric precision
		subcategorySlug: text("subcategory_slug")
			.notNull()
			.references(() => subcategories.slug, { onDelete: "cascade" }),
		imageUrl: text("image_url"),
	},
	(table) => [
		index("products_subcategory_slug_idx").on(table.subcategorySlug),
		index("products_name_idx").on(sql`name COLLATE NOCASE`),
	],
);

// Users: ID-based primary key (auto-increment)
export const users = sqliteTable("users", {
	id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
	username: text("username", { length: 100 }).notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
	updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// Relations
export const collectionsRelations = relations(collections, ({ many }) => ({
	categories: many(categories),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
	collection: one(collections, {
		fields: [categories.collectionId],
		references: [collections.id],
	}),
	subcollections: many(subcollections),
}));

export const subcollectionsRelations = relations(
	subcollections,
	({ one, many }) => ({
		category: one(categories, {
			fields: [subcollections.categorySlug],
			references: [categories.slug],
		}),
		subcategories: many(subcategories),
	}),
);

export const subcategoriesRelations = relations(
	subcategories,
	({ one, many }) => ({
		subcollection: one(subcollections, {
			fields: [subcategories.subcollectionId],
			references: [subcollections.id],
		}),
		products: many(products),
	}),
);

export const productsRelations = relations(products, ({ one }) => ({
	subcategory: one(subcategories, {
		fields: [products.subcategorySlug],
		references: [subcategories.slug],
	}),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Subcollection = typeof subcollections.$inferSelect;
export type NewSubcollection = typeof subcollections.$inferInsert;
export type Subcategory = typeof subcategories.$inferSelect;
export type NewSubcategory = typeof subcategories.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
