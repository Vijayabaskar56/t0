import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	getProductDetailsOptions,
	getProductsForSubcategoryOptions,
} from "@/api/query-options";
import { Image } from "@/components/ui/image";
import { ProductLink } from "@/components/ui/product-card";
import type { Product } from "@/db/schema";

export const Route = createFileRoute(
	"/_layout/products/$category/$subcategory/$product",
)({
	component: RouteComponent,
	loader: async ({ params, context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(
				getProductDetailsOptions(params.product),
			),
			context.queryClient.ensureQueryData(
				getProductsForSubcategoryOptions(params.subcategory),
			),
		]);
	},
	head: () => {
		return {
			meta: [
				{
					charSet: "utf-8",
				},
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
			],
		};
	},
});

function RouteComponent() {
	const { category, subcategory, product } = Route.useParams();

	const { data: productData } = useSuspenseQuery(
		getProductDetailsOptions(product),
	);
	const { data: relatedProductsData } = useSuspenseQuery(
		getProductsForSubcategoryOptions(subcategory),
	);

	const currentProduct = productData as unknown as Product;
	const relatedProducts = relatedProductsData as unknown as Product[];

	const currentProductIndex = relatedProducts.findIndex(
		(p) => p.slug === product,
	);
	const related = [
		...relatedProducts.slice(currentProductIndex + 1),
		...relatedProducts.slice(0, currentProductIndex),
	].filter((p) => p.slug !== product);

	return (
		<div className="container p-4">
			<h1 className="border-t-2 pt-1 text-xl font-bold text-accent1">
				{currentProduct?.name}
			</h1>
			<div className="flex flex-col gap-2">
				<div className="flex flex-row gap-2">
					<Image
						loading="eager"
						decoding="sync"
						src={
							currentProduct?.imageUrl ?? "/placeholder.jpeg"
						}
						alt={`${currentProduct?.name}`}
						height={256}
						width={256}
						quality={80}
						className="h-56 w-56 flex-shrink-0 border-2 md:h-64 md:w-64"
					/>
					<p className="flex-grow text-base">{currentProduct?.description}</p>
				</div>
				<p className="text-xl font-bold">
					${parseFloat(currentProduct?.price || "0").toFixed(2)}
				</p>
				{/* <AddToCartForm productSlug={currentProduct?.slug ?? ""} /> */}
			</div>
			<div className="pt-8">
				{related.length > 0 && (
					<h2 className="text-lg font-bold text-accent1">
						Explore more products
					</h2>
				)}
				<div className="flex flex-row flex-wrap gap-2">
					{related?.map((product) => (
						<ProductLink
							key={product.name}
							loading="lazy"
							category_slug={category ?? ""}
							subcategory_slug={subcategory ?? ""}
							product={product}
							imageUrl={product.imageUrl}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
