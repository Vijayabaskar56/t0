import { createFileRoute } from "@tanstack/react-router";
import { or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
	categories,
	products,
	subcategories,
	subcollections,
} from "@/db/schema";

export const Route = createFileRoute("/search/")({
	server: {
		handlers: ({ createHandlers }) => {
			return createHandlers({
				GET: {
					handler: async ({ request }) => {
						const url = new URL(request.url);
						const q = url.searchParams.get("q");

						if (!q || q.length < 2) {
							return Response.json([]);
						}

						let data: any;

						if (q.length <= 2) {
							// Short search term: prefix matching
							data = await db
								.select({
									product: products,
									subcategory: subcategories,
									subcollection: subcollections,
									category: categories,
								})
								.from(products)
								.where(sql`${products.name} LIKE ${`${q}%`} COLLATE NOCASE`)
								.innerJoin(
									subcategories,
									sql`${products.subcategorySlug} = ${subcategories.slug}`,
								)
								.innerJoin(
									subcollections,
									sql`${subcategories.subcollectionId} = ${subcollections.id}`,
								)
								.innerJoin(
									categories,
									sql`${subcollections.categorySlug} = ${categories.slug}`,
								)
								.orderBy(sql`${products.name} ASC`)
								.limit(5);
						} else {
							// Longer search term: multi-word matching
							const searchWords = q
								.split(" ")
								.filter((term) => term.trim() !== "")
								.map((word) => `%${word}%`);

							// Build OR conditions for each word
							const conditions = searchWords.map(
								(word) => sql`${products.name} LIKE ${word} COLLATE NOCASE`,
							);

							data = await db
								.select({
									product: products,
									subcategory: subcategories,
									subcollection: subcollections,
									category: categories,
								})
								.from(products)
								.where(or(...conditions))
								.innerJoin(
									subcategories,
									sql`${products.subcategorySlug} = ${subcategories.slug}`,
								)
								.innerJoin(
									subcollections,
									sql`${subcategories.subcollectionId} = ${subcollections.id}`,
								)
								.innerJoin(
									categories,
									sql`${subcollections.categorySlug} = ${categories.slug}`,
								)
								.orderBy(sql`${products.name} ASC`)
								.limit(5);
						}

						const results = data.map((row) => ({
							slug: row.product.slug,
							name: row.product.name,
							description: row.product.description,
							price: row.product.price,
							subcategorySlug: row.product.subcategorySlug,
							imageUrl: row.product.imageUrl,
							href: `/products/${row.category.slug}/${row.product.subcategorySlug}/${row.product.slug}`,
						}));

						return Response.json(results);
					},
				},
			});
		},
	},
	component: () => null,
});
