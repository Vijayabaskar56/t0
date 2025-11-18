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
		try {
			const cacheHit = await ctx.context?.env.CACHE.get("collections", "json");
			if (cacheHit && cacheHit !== null && cacheHit !== undefined) {
				return cacheHit;
			}

			const data = await db.query.collections.findMany({
				with: {
					categories: true,
				},
				orderBy: (collections, { asc }) => asc(collections.name),
			});

			// Cache the result for 2 hours using waitUntil for fire-and-forget caching
			if (data) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put("collections", JSON.stringify(data), {
						expirationTtl: 7200,
					}),
				);
			}
			return data;
		} catch (error) {
			console.error("Error fetching collections:", error);
			throw new Error("Failed to fetch collections");
		}
	},
);

const getCollectionDetails = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			collectionName: z.string(),
		}),
	)
	.handler(async (ctx) => {
		try {
			const { collectionName } = ctx.data;
			const cacheKey = `collection-${collectionName}`;
			const cacheHit = await ctx.context?.env.CACHE.get(cacheKey, "json");
			if (cacheHit && cacheHit !== null && cacheHit !== undefined) {
				return cacheHit;
			}

			const data = await db.query.collections.findMany({
				with: {
					categories: true,
				},
				where: (collections, { eq }) => eq(collections.slug, collectionName),
				orderBy: (collections, { asc }) => asc(collections.slug),
			});

			if (data) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
						expirationTtl: 7200,
					}),
				);
			}
			return data;
		} catch (error) {
			console.error("Error fetching collection details:", error);
			throw new Error("Failed to fetch collection details");
		}
	});

const getCategory = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			category: z.string(),
		}),
	)
	.handler(async (ctx) => {
		try {
			const { category } = ctx.data;
			const cacheKey = `category-${category}`;
			const cacheHit = await ctx.context?.env.CACHE.get(cacheKey, "json");
			if (cacheHit && cacheHit !== null && cacheHit !== undefined) {
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
			if (data) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
						expirationTtl: 7200,
					}),
				);
			}
			return data ?? {};
		} catch (error) {
			console.error("Error fetching category:", error);
			throw new Error("Failed to fetch category");
		}
	});

const getCategoryProductCount = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			category: z.string(),
		}),
	)
	.handler(async (ctx) => {
		try {
			const { category } = ctx.data;
			const cacheKey = `category-product-count-${category}`;
			const cacheHit = await ctx.context?.env.CACHE.get(cacheKey, "json");
			if (cacheHit && cacheHit !== null && cacheHit !== undefined) {
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

			if (data) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
						expirationTtl: 7200,
					}),
				);
			}
			return data;
		} catch (error) {
			console.error("Error fetching category product count:", error);
			throw new Error("Failed to fetch category product count");
		}
	});

const getProductForSubcategory = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			subcategory: z.string(),
		}),
	)
	.handler(async (ctx) => {
		try {
			const { subcategory } = ctx.data;
			const cacheKey = `products-subcategory-${subcategory}`;
			const cacheHit = await ctx.context?.env.CACHE.get(cacheKey, "json");
			if (cacheHit && cacheHit !== null && cacheHit !== undefined) {
				return cacheHit;
			}

			const data = await db.query.products.findMany({
				where: (products, { eq, and }) =>
					and(eq(products.subcategorySlug, subcategory)),
				orderBy: (products, { asc }) => asc(products.slug),
			});

			if (data) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
						expirationTtl: 7200,
					}),
				);
			}
			return data;
		} catch (error) {
			console.error("Error fetching products for subcategory:", error);
			throw new Error("Failed to fetch products for subcategory");
		}
	});

const getSubCategoryProductCount = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			subcategory: z.string(),
		}),
	)
	.handler(async (ctx) => {
		try {
			const { subcategory } = ctx.data;
			const cacheKey = `subcategory-product-count-${subcategory}`;
			const cacheHit = await ctx.context?.env.CACHE.get(cacheKey, "json");
			if (cacheHit && cacheHit !== null && cacheHit !== undefined) {
				return cacheHit;
			}

			const data = await db
				.select({ count: count() })
				.from(products)
				.where(eq(products.subcategorySlug, subcategory));

			if (data) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
						expirationTtl: 7200,
					}),
				);
			}
			return data;
		} catch (error) {
			console.error("Error fetching subcategory product count:", error);
			throw new Error("Failed to fetch subcategory product count");
		}
	});

const getProductDetails = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			product: z.string(),
		}),
	)
	.handler(async (ctx) => {
		try {
			const { product } = ctx.data;
			const cacheKey = `product-${product}`;
			const cacheHit = await ctx.context?.env.CACHE.get(cacheKey, "json");
			if (cacheHit && cacheHit !== null && cacheHit !== undefined) {
				return cacheHit;
			}

			const data = await db.query.products.findFirst({
				where: (products, { eq }) => eq(products.slug, product),
			});

			if (data) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
						expirationTtl: 7200,
					}),
				);
			}
			return data;
		} catch (error) {
			console.error("Error fetching product details:", error);
			throw new Error("Failed to fetch product details");
		}
	});

const getProductsForSubcategory = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			subcategory: z.string(),
		}),
	)
	.handler(async (ctx) => {
		try {
			const { subcategory } = ctx.data;
			const cacheKey = `products-subcategory-${subcategory}`;
			const cacheHit = await ctx.context?.env.CACHE.get(cacheKey, "json");
			if (cacheHit && cacheHit !== null && cacheHit !== undefined) {
				return cacheHit;
			}

			const data = await db.query.products.findMany({
				where: (products, { eq, and }) =>
					and(eq(products.subcategorySlug, subcategory)),
				orderBy: (products, { asc }) => asc(products.slug),
			});

			if (data) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
						expirationTtl: 7200,
					}),
				);
			}
			return data;
		} catch (error) {
			console.error("Error fetching products for subcategory:", error);
			throw new Error("Failed to fetch products for subcategory");
		}
	});

const getRelatedProducts = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			subcategory: z.string(),
			currentProductSlug: z.string(),
		}),
	)
	.handler(async (ctx) => {
		try {
			const { subcategory, currentProductSlug } = ctx.data;
			const cacheKey = `related-products-${subcategory}-${currentProductSlug}`;
			const cacheHit = await ctx.context?.env.CACHE.get(cacheKey, "json");
			if (cacheHit && cacheHit !== null && cacheHit !== undefined) {
				return cacheHit;
			}

			// Use raw SQL to get products in the desired order:
			// 1. Current product first
			// 2. Products after current product (alphabetically)
			// 3. Products before current product (alphabetically)
			const data = await db
				.select()
				.from(products)
				.where(eq(products.subcategorySlug, subcategory))
				.all();

			// Sort the results to put current product first, then subsequent products
			const sortedData = data.sort((a, b) => {
				if (a.slug === currentProductSlug) return -1;
				if (b.slug === currentProductSlug) return 1;

				// Both are not the current product, sort alphabetically
				const aAfterCurrent = a.slug > currentProductSlug ? 1 : 0;
				const bAfterCurrent = b.slug > currentProductSlug ? 1 : 0;

				if (aAfterCurrent !== bAfterCurrent) {
					return bAfterCurrent - aAfterCurrent;
				}

				// Both are either after or before current, sort alphabetically
				return a.slug.localeCompare(b.slug);
			});

			if (sortedData) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put(cacheKey, JSON.stringify(sortedData), {
						expirationTtl: 7200,
					}),
				);
			}
			return sortedData || [];
		} catch (error) {
			console.error("Error fetching related products:", error);
			throw new Error("Failed to fetch related products");
		}
	});

const getProductCount = createServerFn({ method: "GET" }).handler(
	async (ctx) => {
		try {
			const cacheKey = "product-count";
			const cacheHit = await ctx.context?.env.CACHE.get(cacheKey, "json");
			if (cacheHit && cacheHit !== null && cacheHit !== undefined) {
				return cacheHit;
			}

			const data = await db.select({ count: count() }).from(products);

			if (data) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
						expirationTtl: 7200,
					}),
				);
			}
			return data;
		} catch (error) {
			console.error("Error fetching product count:", error);
			throw new Error("Failed to fetch product count");
		}
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
	getRelatedProducts,
	getSubCategoryProductCount,
};
