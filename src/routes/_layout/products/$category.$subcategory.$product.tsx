import { createFileRoute } from "@tanstack/react-router";
import {
	getProductDetailsOptions,
	getProductsForSubcategoryOptions,
} from "@/api/query-options";
import { ProductLink } from "@/components/ui/product-card";
import { seo } from "@/lib/seo";

export const Route = createFileRoute(
	"/_layout/products/$category/$subcategory/$product",
)({
	component: RouteComponent,
	loader: async ({ params, context }) => {
		const [productData, relatedUnshifted] = await Promise.all([
			context.queryClient.ensureQueryData(
				getProductDetailsOptions(params.product),
			),
			context.queryClient.ensureQueryData(
				getProductsForSubcategoryOptions(params.subcategory),
			),
		]);
		return { productData, relatedUnshifted };
	},
	head: ({ loaderData }) => {
		const productName = loaderData?.productData?.name;
		const productDescription = loaderData?.productData?.description;
		const productPrice = loaderData?.productData?.price;
		const productImage = loaderData?.productData?.imageUrl;
		console.log(productName, productDescription, productPrice, productImage ,'dd')
		return {
			meta: [
				{
					charSet: "utf-8",
				},
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
				{
					name: "description",
					content: productDescription?.substring(0, 160),
				},
				{
					property: "og:title",
					content: productName,
				},
				{
					property: "og:description",
					content: productDescription?.substring(0, 160),
				},
				{
					property: "og:image",
					content: productImage,
				},
				{
					property: "og:type",
					content: "product",
				},
				{
					property: "product:price:amount",
					content: productPrice,
				},
				{
					property: "product:price:currency",
					content: "USD",
				},
			...seo({ title: productName }),
			],
		};
	},
});

function RouteComponent() {
	const { category, subcategory, product } = Route.useParams();
	console.log(category, subcategory, product);
	const { productData, relatedUnshifted } = Route.useLoaderData();
	const currentProductIndex = relatedUnshifted.findIndex(
		(p) => p.slug === product,
	);
	const related = [
		...relatedUnshifted.slice(currentProductIndex + 1),
		...relatedUnshifted.slice(0, currentProductIndex),
	];
	console.log(related, "related");
	return (
		<div className="container p-4">
			<h1 className="border-t-2 pt-1 text-xl font-bold text-accent1">
				{productData?.name}
			</h1>
			<div className="flex flex-col gap-2">
				<div className="flex flex-row gap-2">
					<img
						loading="eager"
						decoding="sync"
						src={productData?.imageUrl ?? "/placeholder.svg?height=64&width=64"}
						alt={`${productData?.name}`}
						height={256}
						width={256}
						className="h-56 w-56 flex-shrink-0 border-2 md:h-64 md:w-64"
					/>
					<p className="flex-grow text-base">{productData?.description}</p>
				</div>
				<p className="text-xl font-bold">
					${parseFloat(productData?.price).toFixed(2)}
				</p>
				{/* <AddToCartForm productSlug={productData?.slug ?? ""} /> */}
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
