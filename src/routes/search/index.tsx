import { createFileRoute } from "@tanstack/react-router";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
	categories,
	products,
	productsFts,
	subcategories,
	subcollections,
} from "@/db/schema";

type SearchResult = {
	slug: string;
	name: string;
	description: string;
	price: string;
	subcategorySlug: string;
	imageUrl: string | null;
	categorySlug: string;
}[];

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

						let data: SearchResult;

						if (q.length <= 2) {
							// Short search term: prefix matching with index
							data = await db
								.select({
									slug: products.slug,
									name: products.name,
									description: products.description,
									price: products.price,
									subcategorySlug: products.subcategorySlug,
									imageUrl: products.imageUrl,
									categorySlug: categories.slug,
								})
								.from(products)
								.where(sql`LOWER(${products.name}) LIKE LOWER(${`${q}%`})`)
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
							// Longer search term: FTS with relevance ranking
							data = await db
								.select({
									slug: products.slug,
									name: products.name,
									description: products.description,
									price: products.price,
									subcategorySlug: products.subcategorySlug,
									imageUrl: products.imageUrl,
									categorySlug: categories.slug,
								})
								.from(productsFts)
								.where(sql`${productsFts} MATCH ${q}`)
								.innerJoin(
									products,
									sql`${products.slug} = ${productsFts.slug}`,
								)
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
								.orderBy(sql`bm25(${productsFts})`)
								.limit(5);
						}

						const results = data.map((row) => ({
							slug: row.slug,
							name: row.name,
							description: row.description,
							price: row.price,
							subcategorySlug: row.subcategorySlug,
							imageUrl: row.imageUrl,
							href: `/products/${row.categorySlug}/${row.subcategorySlug}/${row.slug}`,
						}));

						return Response.json(results);
					},
				},
			});
		},
	},
	component: () => null,
});
