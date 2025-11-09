import { createFileRoute } from "@tanstack/react-router";
import {
	getProductForSubcategoryOptions,
	getSubCategoryProductCountOptions,
} from "@/api/query-options";
import { ProductLink } from "@/components/ui/product-card";

export const Route = createFileRoute(
	"/_layout/products/$category/$subcategory/",
)({
	component: RouteComponent,
	loader: async ({ params, context }) => {
		const [products, productCount] = await Promise.all([
			context.queryClient.ensureQueryData(
				getProductForSubcategoryOptions(params.subcategory),
			),
			context.queryClient.ensureQueryData(
				getSubCategoryProductCountOptions(params.subcategory),
			),
		]);
		return { products, productCount };
	},
	pendingComponent: () => <div>Loading...</div>,
	errorComponent: () => <div>Error</div>,
});

function RouteComponent() {
	const { category, subcategory } = Route.useParams();
	const { products, productCount } = Route.useLoaderData();
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
