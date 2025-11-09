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

const getCollections = createServerFn({ method: "GET" }).handler(
	async (ctx) => {
		const cacheHit = await ctx.context?.env.CACHE.get("collections", "json");
		if (cacheHit) {
			return cacheHit;
		}

		const data = await db.query.collections.findMany({
			with: {
				categories: true,
			},
			orderBy: (collections, { asc }) => asc(collections.name),
		});

		// Cache the result for 2 hours using waitUntil for fire-and-forget caching
		ctx.context?.waitUntil(
			ctx.context.env.CACHE.put("collections", JSON.stringify(data), {
				expirationTtl: 7200,
			}),
		);
		return data;
	},
);

const getCollectionDetails = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			collectionName: z.string(),
		}),
	)
	.handler(async (ctx) => {
		const { collectionName } = ctx.data;
		const cacheKey = `collection-${collectionName}`;
		const cacheHit = await ctx.context?.env.CACHE.get(cacheKey, "json");
		if (cacheHit) {
			return cacheHit;
		}

		const data = await db.query.collections.findMany({
			with: {
				categories: true,
			},
			where: (collections, { eq }) => eq(collections.slug, collectionName),
			orderBy: (collections, { asc }) => asc(collections.slug),
		});

		ctx.context?.waitUntil(
			ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
				expirationTtl: 7200,
			}),
		);
		return data;
	});

const getCategory = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			category: z.string(),
		}),
	)
	.handler(async (ctx) => {
		const { category } = ctx.data;
		const cacheKey = `category-${category}`;
		const cacheHit = await ctx.context?.env.CACHE.get(cacheKey, "json");
		if (cacheHit) {
			return cacheHit;
		}

		const data = await db.query.categories.findFirst({
			where: (categories, { eq }) => eq(categories.slug, category),
			with: {
				subcollections: {
					with: {
						subcategories: true,
					},
				},
			},
		});

		ctx.context?.waitUntil(
			ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
				expirationTtl: 7200,
			}),
		);
		return data;
	});

const getCategoryProductCount = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			category: z.string(),
		}),
	)
	.handler(async (ctx) => {
		const { category } = ctx.data;
		const cacheKey = `category-product-count-${category}`;
		const cacheHit = await ctx.context?.env.CACHE.get(cacheKey, "json");
		if (cacheHit) {
			return cacheHit;
		}

		const data = await db
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

		ctx.context?.waitUntil(
			ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
				expirationTtl: 7200,
			}),
		);
		return data;
	});

const getProductForSubcategory = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			subcategory: z.string(),
		}),
	)
	.handler(async (ctx) => {
		const { subcategory } = ctx.data;
		const cacheKey = `products-subcategory-${subcategory}`;
		const cacheHit = await ctx.context?.env.CACHE.get(cacheKey, "json");
		if (cacheHit) {
			return cacheHit;
		}

		const data = await db.query.products.findMany({
			where: (products, { eq, and }) =>
				and(eq(products.subcategorySlug, subcategory)),
			orderBy: (products, { asc }) => asc(products.slug),
		});

		ctx.context?.waitUntil(
			ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
				expirationTtl: 7200,
			}),
		);
		return data;
	});

const getSubCategoryProductCount = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			subcategory: z.string(),
		}),
	)
	.handler(async (ctx) => {
		const { subcategory } = ctx.data;
		const cacheKey = `subcategory-product-count-${subcategory}`;
		const cacheHit = await ctx.context?.env.CACHE.get(cacheKey, "json");
		if (cacheHit) {
			return cacheHit;
		}

		const data = await db
			.select({ count: count() })
			.from(products)
			.where(eq(products.subcategorySlug, subcategory));

		ctx.context?.waitUntil(
			ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
				expirationTtl: 7200,
			}),
		);
		return data;
	});

const getProductDetails = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			product: z.string(),
		}),
	)
	.handler(async (ctx) => {
		const { product } = ctx.data;
		const cacheKey = `product-${product}`;
		const cacheHit = await ctx.context?.env.CACHE.get(cacheKey, "json");
		if (cacheHit) {
			return cacheHit;
		}

		const data = await db.query.products.findFirst({
			where: (products, { eq }) => eq(products.slug, product),
		});

		ctx.context?.waitUntil(
			ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
				expirationTtl: 7200,
			}),
		);
		return data;
	});

const getProductsForSubcategory = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			subcategory: z.string(),
		}),
	)
	.handler(async (ctx) => {
		const { subcategory } = ctx.data;
		const cacheKey = `products-subcategory-${subcategory}`;
		const cacheHit = await ctx.context?.env.CACHE.get(cacheKey, "json");
		if (cacheHit) {
			return cacheHit;
		}

		const data = await db.query.products.findMany({
			where: (products, { eq, and }) =>
				and(eq(products.subcategorySlug, subcategory)),
			orderBy: (products, { asc }) => asc(products.slug),
		});

		ctx.context?.waitUntil(
			ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
				expirationTtl: 7200,
			}),
		);
		return data;
	});

const getProductCount = createServerFn({ method: "GET" }).handler(
	async (ctx) => {
		const cacheKey = "product-count";
		const cacheHit = await ctx.context?.env.CACHE.get(cacheKey, "json");
		if (cacheHit) {
			return cacheHit;
		}

		const data = await db.select({ count: count() }).from(products);

		ctx.context?.waitUntil(
			ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
				expirationTtl: 7200,
			}),
		);
		return data;
	},
);

export {
	getCategory,
	getCategoryProductCount,
	getCollectionDetails,
	getCollections,
	getProductCount,
	getProductDetails,
	getProductForSubcategory,
	getProductsForSubcategory,
	getSubCategoryProductCount,
};
