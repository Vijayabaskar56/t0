import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { and, count, eq } from "drizzle-orm";
import z from "zod";
import { db } from "@/db";
import {
	categories,
	type NewUser,
	products,
	subcategories,
	subcollections,
	users,
} from "@/db/schema";
import {
	comparePasswords,
	hashPassword,
	setSession,
	verifyToken,
} from "@/lib/auth";
import type { RequestContext } from "@/server";

// Helper function to check rate limit
async function checkRateLimit(
	ctx: {
		context: RequestContext;
	},
	limiterName: "API_LIMITER" | "CART_WRITE_LIMITER",
) {
	const ip = getRequest().headers.get("cf-connecting-ip") || "unknown";
	const { success } = await ctx.context.env[limiterName].limit({ key: ip });
	return success;
}

const authSchema = z.object({
	username: z.string().min(1),
	password: z.string().min(1),
});

const signUp = createServerFn({ method: "POST" })
	.inputValidator(authSchema)
	.handler(async (ctx) => {
		try {
			const { username, password } = ctx.data;

			// Rate limiting check (simplified version)
			// Note: You'll need to implement rate limiting utilities
			const existingUser = await db
				.select()
				.from(users)
				.where(eq(users.username, username))
				.limit(1);

			if (existingUser.length > 0) {
				return { error: "Username already taken. Please try again." };
			}

			const passwordHash = await hashPassword(password);

			const newUser: NewUser = {
				username,
				passwordHash,
			};

			const [createdUser] = await db.insert(users).values(newUser).returning();

			if (!createdUser) {
				return { error: "Failed to create user. Please try again." };
			}

			await setSession(createdUser);

			return { success: true, user: createdUser };
		} catch (error) {
			console.error("Error signing up:", error);
			throw new Error("Failed to sign up");
		}
	});

const signIn = createServerFn({ method: "POST" })
	.inputValidator(authSchema)
	.handler(async (ctx) => {
		try {
			const { username, password } = ctx.data;

			// Rate limiting check (simplified)
			// Note: You'll need to implement rate limiting utilities

			const user = await db
				.select({
					user: users,
				})
				.from(users)
				.where(eq(users.username, username))
				.limit(1);

			if (user.length === 0) {
				return { error: "Invalid username or password. Please try again." };
			}

			const { user: foundUser } = user[0];

			const isPasswordValid = await comparePasswords(
				password,
				foundUser.passwordHash,
			);

			if (!isPasswordValid) {
				return { error: "Invalid username or password. Please try again." };
			}

			await setSession(foundUser);

			return { success: true, user: foundUser };
		} catch (error) {
			console.error("Error signing in:", error);
			throw new Error("Failed to sign in");
		}
	});

const getCollections = createServerFn({ method: "GET" }).handler(
	async (ctx) => {
		try {
			// Rate limiting
			if (!(await checkRateLimit(ctx, "API_LIMITER"))) {
				throw new Error("Rate limit exceeded. Try again later.");
			}

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

			// Cache collections for 24 hours (rarely change)
			if (data) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put("collections", JSON.stringify(data), {
						expirationTtl: 86400,
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

			// Cache collection details for 24 hours
			if (data) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
						expirationTtl: 86400,
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
			// Cache categories for 12 hours
			if (data) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
						expirationTtl: 43200,
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

			// Cache product counts for 12 hours
			if (data) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
						expirationTtl: 43200,
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

			// Cache products for 1 hour
			if (data) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
						expirationTtl: 3600,
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

			// Cache subcategory product counts for 12 hours
			if (data) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
						expirationTtl: 43200,
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

			// Cache product details for 1 hour
			if (data) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
						expirationTtl: 3600,
					}),
				);
			}
			return data;
		} catch (error) {
			console.error("Error fetching product details:", error);
			throw new Error("Failed to fetch product details");
		}
	});

// Alias for backward compatibility
const getProductsForSubcategory = getProductForSubcategory;

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

			// Cache related products for 1 hour
			if (sortedData) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put(cacheKey, JSON.stringify(sortedData), {
						expirationTtl: 3600,
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

			// Cache total product count for 12 hours
			if (data) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put(cacheKey, JSON.stringify(data), {
						expirationTtl: 43200,
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

const cartSchema = z.array(
	z.object({
		productSlug: z.string(),
		quantity: z.number(),
	}),
);

export type CartItem = z.infer<typeof cartSchema>[number];

// Helper function to set cart cookie
function updateCart(newItems: CartItem[]) {
	const cookieValue = encodeURIComponent(JSON.stringify(newItems));
	const maxAge = 60 * 60 * 24 * 7; // 1 week
	const cookieOptions = `cart=${cookieValue}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}; Path=/`;
	setResponseHeader("Set-Cookie", cookieOptions);
}

const getCart = createServerFn({ method: "GET" }).handler(async () => {
	try {
		// Get cart cookie from request headers
		const cartCookie = getRequest()
			.headers.get("cookie")
			?.match(/cart=([^;]+)/)?.[1];

		if (!cartCookie) {
			return [];
		}

		try {
			return cartSchema.parse(JSON.parse(decodeURIComponent(cartCookie)));
		} catch {
			console.error("Failed to parse cart cookie");
			return [];
		}
	} catch (error) {
		console.error("Error getting cart:", error);
		throw new Error("Failed to get cart");
	}
});

const detailedCart = createServerFn({ method: "GET" }).handler(async () => {
	try {
		const cart = await getCart();

		if (cart.length === 0) {
			return [];
		}

		const products = await db.query.products.findMany({
			where: (products, { inArray }) =>
				inArray(
					products.slug,
					cart.map((item) => item.productSlug),
				),
			with: {
				subcategory: {
					with: {
						subcollection: true,
					},
				},
			},
		});

		const withQuantity = products.map((product) => ({
			...product,
			quantity:
				cart.find((item) => item.productSlug === product.slug)?.quantity ?? 0,
		}));

		return withQuantity;
	} catch (error) {
		console.error("Error getting detailed cart:", error);
		throw new Error("Failed to get detailed cart");
	}
});

const addToCart = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			productSlug: z.string(),
		}),
	)
	.handler(async (ctx) => {
		try {
			// Rate limiting for writes
			if (!(await checkRateLimit(ctx, "CART_WRITE_LIMITER"))) {
				throw new Error("Rate limit exceeded. Try again later.");
			}

			const { productSlug } = ctx.data;
			const prevCart = await getCart();

			const itemAlreadyExists = prevCart.find(
				(item) => item.productSlug === productSlug,
			);

			if (itemAlreadyExists) {
				const newQuantity = itemAlreadyExists.quantity + 1;
				const newCart = prevCart.map((item) => {
					if (item.productSlug === productSlug) {
						return {
							...item,
							quantity: newQuantity,
						};
					}
					return item;
				});

				updateCart(newCart);
				return "Item quantity updated";
			} else {
				const newCart = [
					...prevCart,
					{
						productSlug,
						quantity: 1,
					},
				];

				updateCart(newCart);
				return "Item added to cart";
			}
		} catch (error) {
			console.error("Error adding to cart:", error);
			throw new Error("Failed to add to cart");
		}
	});

const removeFromCart = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			productSlug: z.string(),
		}),
	)
	.handler(async (ctx) => {
		try {
			// Rate limiting for writes
			if (!(await checkRateLimit(ctx, "CART_WRITE_LIMITER"))) {
				throw new Error("Rate limit exceeded. Try again later.");
			}

			const { productSlug } = ctx.data;
			const prevCart = await getCart();

			const itemAlreadyExists = prevCart.find(
				(item) => item.productSlug === productSlug,
			);

			if (!itemAlreadyExists) {
				return "Item not found in cart";
			}

			const newCart = prevCart.filter(
				(item) => item.productSlug !== productSlug,
			);
			updateCart(newCart);

			return "Item removed from cart";
		} catch (error) {
			console.error("Error removing from cart:", error);
			throw new Error("Failed to remove from cart");
		}
	});

const searchProducts = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			q: z.string().min(2),
		}),
	)
	.handler(async (ctx) => {
		try {
			// Rate limiting
			if (!(await checkRateLimit(ctx, "API_LIMITER"))) {
				throw new Error("Rate limit exceeded. Try again later.");
			}

			const { q } = ctx.data;
			const cacheKey = `search-${q}`;
			const cacheHit = await ctx.context?.env.CACHE.get(cacheKey, "json");
			if (cacheHit && cacheHit !== null && cacheHit !== undefined) {
				return cacheHit;
			}

			const data = await db.query.products.findMany({
				where: (products, { like }) => like(products.name, `%${q}%`),
				orderBy: (products, { asc }) => asc(products.name),
			});

			const results = data.map((product) => ({
				...product,
				href: `/products/${product.subcategorySlug}/${product.slug}`,
			}));

			// Cache search results for 2 hours
			if (results) {
				ctx.context?.waitUntil(
					ctx.context.env.CACHE.put(cacheKey, JSON.stringify(results), {
						expirationTtl: 7200,
					}),
				);
			}
			return results;
		} catch (error) {
			console.error("Error searching products:", error);
			throw new Error("Failed to search products");
		}
	});

const getUser = createServerFn({ method: "GET" }).handler(async () => {
	try {
		const sessionCookie = getRequest()
			.headers.get("cookie")
			?.match(/session=([^;]+)/)?.[1];

		if (!sessionCookie) {
			return null;
		}

		const sessionData = await verifyToken(decodeURIComponent(sessionCookie));

		if (
			!sessionData ||
			!sessionData.user ||
			typeof sessionData.user.id !== "number"
		) {
			return null;
		}

		if (new Date(sessionData.expires) < new Date()) {
			return null;
		}

		const user = await db
			.select()
			.from(users)
			.where(and(eq(users.id, sessionData.user.id)))
			.limit(1);

		if (user.length === 0) {
			return null;
		}

		return user[0];
	} catch (error) {
		console.error("Error getting user:", error);
		return null;
	}
});

const signOut = createServerFn({ method: "POST" }).handler(async () => {
	try {
		setResponseHeader(
			"Set-Cookie",
			"session=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/",
		);
		return { success: true };
	} catch (error) {
		console.error("Error signing out:", error);
		throw new Error("Failed to sign out");
	}
});

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
	signIn,
	signUp,
	getCart,
	detailedCart,
	addToCart,
	removeFromCart,
	searchProducts,
	getUser,
	signOut,
};
