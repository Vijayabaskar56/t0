import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	getProductForSubcategoryOptions,
	getSubCategoryProductCountOptions,
} from "@/api/query-options";
import { ProductLink } from "@/components/ui/product-card";
import type { Product } from "@/db/schema";
import { prefetchSubcategoryImages } from "@/lib/prefetch-images";
import { seo } from "@/lib/seo";

interface ProductCountData {
	count: number;
}

export const Route = createFileRoute(
	"/_layout/products/$category/$subcategory/",
)({
	loader: async ({ params, context }) => {
		const [productsData] = await Promise.all([
			context.queryClient.ensureQueryData(
				getProductForSubcategoryOptions(params.subcategory),
			),
			context.queryClient.ensureQueryData(
				getSubCategoryProductCountOptions(params.subcategory),
			),
		]);

		// Fire-and-forget image prefetching
		prefetchSubcategoryImages(productsData, context.seenManager);
	},
	head: ({ params }) => {
		return {
			meta: [
				{
					charSet: "utf-8",
				},
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
				...seo({
					title: `${params.subcategory.slice(0, 1).toUpperCase() + params.subcategory.slice(1).toLowerCase().replaceAll("-", " ")}`,
				}),
			],
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { category, subcategory } = Route.useParams();

	const { data: productsData } = useSuspenseQuery(
		getProductForSubcategoryOptions(subcategory),
	);
	const { data: productCountData } = useSuspenseQuery(
		getSubCategoryProductCountOptions(subcategory),
	);

	const products = productsData as unknown as Product[];
	const productCount = productCountData as unknown as ProductCountData[];

	const finalCount = productCount[0]?.count;

	return (
		<div className="container mx-auto p-4">
			{finalCount > 0 ? (
				<h1 className="mb-2 border-b-2 text-sm font-bold">
					{finalCount} {finalCount === 1 ? "Product" : "Products"}
				</h1>
			) : (
				<p>No products for this subcategory</p>
			)}
			<div className="flex flex-row flex-wrap gap-2">
				{products.map((product) => (
					<ProductLink
						key={product.name}
						loading="eager"
						category_slug={category}
						subcategory_slug={subcategory}
						product={product}
						imageUrl={product.imageUrl}
					/>
				))}
			</div>
		</div>
	);
}
