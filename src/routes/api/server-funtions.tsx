import { createServerFn } from "@tanstack/react-start";
import { count, eq } from "drizzle-orm";
import z from "zod";
import { db } from "@/db";
import {
	categories,
	products,
	subcategories,
	subcollections,
} from "@/db/schema";

const getCollections = createServerFn({ method: "GET" }).handler(async () => {
	return await db.query.collections.findMany({
		with: {
			categories: true,
		},
		orderBy: (collections, { asc }) => asc(collections.name),
	});
});
const getCollectionDetails = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			collectionName: z.string(),
		}),
	)
	.handler(async ({ data: { collectionName } }) => {
		return db.query.collections.findMany({
			with: {
				categories: true,
			},
			where: (collections, { eq }) => eq(collections.slug, collectionName),
			orderBy: (collections, { asc }) => asc(collections.slug),
		});
	});

const getCategory = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			category: z.string(),
		}),
	)
	.handler(async ({ data: { category } }) => {
		return await db.query.categories.findFirst({
			where: (categories, { eq }) => eq(categories.slug, category),
			with: {
				subcollections: {
					with: {
						subcategories: true,
					},
				},
			},
		});
	});

const getCategoryProductCount = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			category: z.string(),
		}),
	)
	.handler(async ({ data: { category } }) => {
		return await db
			.select({ count: count() })
			.from(categories)
			.leftJoin(
				subcollections,
				eq(categories.slug, subcollections.categorySlug),
			)
			.leftJoin(
				subcategories,
				eq(subcollections.id, subcategories.subcollectionId),
			)
			.leftJoin(products, eq(subcategories.slug, products.subcategorySlug))
			.where(eq(categories.slug, category));
	});

const getProductForSubcategory = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			subcategory: z.string(),
		}),
	)
	.handler(async ({ data: { subcategory } }) => {
		return await db.query.products.findMany({
			where: (products, { eq, and }) =>
				and(eq(products.subcategorySlug, subcategory)),
			orderBy: (products, { asc }) => asc(products.slug),
		});
	});

const getSubCategoryProductCount = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			subcategory: z.string(),
		}),
	)
	.handler(async ({ data: { subcategory } }) => {
		return await db
			.select({ count: count() })
			.from(products)
			.where(eq(products.subcategorySlug, subcategory));
	});

const getProductDetails = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			product: z.string(),
		}),
	)
	.handler(async ({ data: { product } }) => {
		return db.query.products.findFirst({
			where: (products, { eq }) => eq(products.slug, product),
		});
	});

const getProductsForSubcategory = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			subcategory: z.string(),
		}),
	)
	.handler(async ({ data: { subcategory } }) => {
		return await db.query.products.findMany({
			where: (products, { eq, and }) =>
				and(eq(products.subcategorySlug, subcategory)),
			orderBy: (products, { asc }) => asc(products.slug),
		});
	});

const getProductCount = createServerFn({ method: "GET" }).handler(async () => {
	return await db.select({ count: count() }).from(products);
});

export {
	getCollections,
	getCollectionDetails,
	getCategory,
	getCategoryProductCount,
	getProductForSubcategory,
	getSubCategoryProductCount,
	getProductCount,
	getProductDetails,
	getProductsForSubcategory,
};
