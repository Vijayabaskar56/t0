import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { count, eq } from "drizzle-orm";
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

			// Password hashing (simplified - you'll need to implement hashPassword)
			const passwordHash = password; // Replace with: await hashPassword(password);

			const newUser: NewUser = {
				username,
				passwordHash,
			};

			const [createdUser] = await db.insert(users).values(newUser).returning();

			if (!createdUser) {
				return { error: "Failed to create user. Please try again." };
			}

			// Session setting (simplified - you'll need to implement setSession)
			// await setSession(createdUser);

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

			// Password comparison (simplified - you'll need to implement comparePasswords)
			const isPasswordValid = password === foundUser.passwordHash; // Replace with: await comparePasswords(password, foundUser.passwordHash);

			if (!isPasswordValid) {
				return { error: "Invalid username or password. Please try again." };
			}

			// Session setting (simplified - you'll need to implement setSession)
			// await setSession(foundUser);

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

// Path parser for route type detection
function parseRoutePath(path: string) {
	const segments = path.split("/").filter(Boolean);

	if (segments[0] === "products" && segments.length === 4) {
		return {
			type: "product" as const,
			category: segments[1],
			subcategory: segments[2],
			product: segments[3],
		};
	}
	if (segments[0] === "products" && segments.length === 3) {
		return {
			type: "subcategory" as const,
			category: segments[1],
			subcategory: segments[2],
		};
	}
	if (segments[0] === "products" && segments.length === 2) {
		return { type: "category" as const, category: segments[1] };
	}
	if (segments.length === 1) {
		return { type: "collection" as const, collection: segments[0] };
	}
	return null;
}

// Image prefetching for all route types
const getPrefetchImages = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			path: z.string(),
		}),
	)
	.handler(async (ctx) => {
		try {
			const { path } = ctx.data;
			const cacheKey = `prefetch-images-${path}`;
			const cacheHit = await ctx.context?.env.CACHE.get(cacheKey, "json");
			if (cacheHit && cacheHit !== null && cacheHit !== undefined) {
				return cacheHit;
			}

			const routeInfo = parseRoutePath(path);
			if (!routeInfo) {
				return { images: [] };
			}

			const images: Array<{
				src: string;
				srcset?: string | null;
				sizes?: string | null;
				alt?: string;
				loading?: string;
			}> = [];

			let imageCount = 0;

			switch (routeInfo.type) {
				case "product": {
					// Get product + subcategory + category images
					const data = await db.query.products.findFirst({
						where: (products, { eq }) => eq(products.slug, routeInfo.product),
						with: {
							subcategory: {
								with: {
									subcollection: {
										with: {
											category: true,
										},
									},
								},
							},
						},
					});

					if (data?.imageUrl) {
						images.push({
							src: data.imageUrl,
							alt: data.name,
							loading: imageCount++ < 20 ? "eager" : "lazy",
						});
					}

					if (data?.subcategory?.imageUrl) {
						images.push({
							src: data.subcategory.imageUrl,
							alt: data.subcategory.name,
							loading: imageCount++ < 20 ? "eager" : "lazy",
						});
					}

					if (data?.subcategory?.subcollection?.category?.imageUrl) {
						images.push({
							src: data.subcategory.subcollection.category.imageUrl,
							alt: data.subcategory.subcollection.category.name,
							loading: imageCount++ < 20 ? "eager" : "lazy",
						});
					}
					break;
				}

				case "subcategory": {
					// Get all products in subcategory + subcategory + category images
					const data = await db.query.subcategories.findFirst({
						where: (subcategories, { eq }) =>
							eq(subcategories.slug, routeInfo.subcategory),
						with: {
							products: true,
							subcollection: {
								with: {
									category: true,
								},
							},
						},
					});

					// Add all product images
					if (data?.products) {
						for (const product of data.products) {
							if (product.imageUrl) {
								images.push({
									src: product.imageUrl,
									alt: product.name,
									loading: imageCount++ < 20 ? "eager" : "lazy",
								});
							}
						}
					}

					// Add subcategory image
					if (data?.imageUrl) {
						images.push({
							src: data.imageUrl,
							alt: data.name,
							loading: imageCount++ < 20 ? "eager" : "lazy",
						});
					}

					// Add category image
					if (data?.subcollection?.category?.imageUrl) {
						images.push({
							src: data.subcollection.category.imageUrl,
							alt: data.subcollection.category.name,
							loading: imageCount++ < 20 ? "eager" : "lazy",
						});
					}
					break;
				}

				case "category": {
					// Get all subcategories in category + category image
					const data = await db.query.categories.findFirst({
						where: (categories, { eq }) =>
							eq(categories.slug, routeInfo.category),
						with: {
							subcollections: {
								with: {
									subcategories: true,
								},
							},
						},
					});

					// Add all subcategory images
					if (data?.subcollections) {
						for (const subcollection of data.subcollections) {
							for (const subcategory of subcollection.subcategories) {
								if (subcategory.imageUrl) {
									images.push({
										src: subcategory.imageUrl,
										alt: subcategory.name,
										loading: imageCount++ < 20 ? "eager" : "lazy",
									});
								}
							}
						}
					}

					// Add category image
					if (data?.imageUrl) {
						images.push({
							src: data.imageUrl,
							alt: data.name,
							loading: imageCount++ < 20 ? "eager" : "lazy",
						});
					}
					break;
				}

				case "collection": {
					// Get all categories in collection
					const data = await db.query.collections.findFirst({
						where: (collections, { eq }) =>
							eq(collections.slug, routeInfo.collection),
						with: {
							categories: true,
						},
					});

					// Add all category images
					if (data?.categories) {
						for (const category of data.categories) {
							if (category.imageUrl) {
								images.push({
									src: category.imageUrl,
									alt: category.name,
									loading: imageCount++ < 20 ? "eager" : "lazy",
								});
							}
						}
					}
					break;
				}
			}

			// Remove duplicates and filter out null/undefined images
			const uniqueImages = images.filter(
				(img, index, self) =>
					img.src && self.findIndex((i) => i.src === img.src) === index,
			);

			const result = { images: uniqueImages };

			// Cache the result
			ctx.context?.waitUntil(
				ctx.context.env.CACHE.put(cacheKey, JSON.stringify(result), {
					expirationTtl: 7200, // 2 hours
				}),
			);

			return result;
		} catch (error) {
			console.error("Error fetching prefetch images:", error);
			return { images: [] };
		}
	});

export {
	getCategory,
	getCategoryProductCount,
	getCollectionDetails,
	getCollections,
	getProductCount,
	getProductDetails,
	getPrefetchImages,
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
};
