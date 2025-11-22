import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import {
	getCategoryOptions,
	getCategoryProductCountOptions,
} from "@/api/query-options";
import type { Category, Subcategory, Subcollection } from "@/db/schema";
import { type PrefetchImage, prefetchImages } from "@/lib/prefetch-images";

interface CategoryData extends Category {
	subcollections: (Subcollection & {
		subcategories: Subcategory[];
	})[];
}

interface ProductCountData {
	count: number;
}

export const Route = createFileRoute("/_layout/products/$category/")({
	beforeLoad: async ({ context, params }) => {
		if (typeof window !== "undefined") {
			const categoryData = (await context.queryClient.ensureQueryData(
				getCategoryOptions(params.category),
			)) as unknown as CategoryData;

			let count = 0;
			const images: PrefetchImage[] =
				categoryData?.subcollections?.flatMap((subcollection) =>
					subcollection.subcategories
						.filter((subcat) => subcat.imageUrl)
						.map((subcat) => ({
							src: subcat.imageUrl ?? "/placeholder.webp",
							alt: subcat.name,
							loading: count++ < 15 ? "eager" : "lazy",
						})),
				) ?? [];

			prefetchImages(images, context.seenManager);
		}
	},
	loader: async ({ params, context }) => {
		// Fire-and-forget image prefetch

		await Promise.all([
			context.queryClient.ensureQueryData(getCategoryOptions(params.category)),
			context.queryClient.ensureQueryData(
				getCategoryProductCountOptions(params.category),
			),
		]);
	},
	component: RouteComponent,
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
		],
	}),
});

function RouteComponent() {
	const { category } = Route.useParams();

	const { data: categoryData } = useSuspenseQuery(getCategoryOptions(category));
	const { data: productCountData } = useSuspenseQuery(
		getCategoryProductCountOptions(category),
	);

	const categoryTyped = categoryData as unknown as CategoryData;
	const productCountTyped = productCountData as unknown as ProductCountData[];

	const finalCount = productCountTyped[0]?.count;

	let imageCount = 0;
	return (
		<div className="container p-4">
			{finalCount && (
				<h1 className="mb-2 border-b-2 text-sm font-bold">
					{finalCount} {finalCount === 1 ? "Product" : "Products"}
				</h1>
			)}
			<div className="space-y-4">
				{categoryTyped?.subcollections.map((subcollection) => (
					<div key={subcollection.id}>
						<h2 className="mb-2 border-b-2 text-lg font-semibold">
							{subcollection.name}
						</h2>
						<div className="flex flex-row flex-wrap gap-2">
							{subcollection.subcategories.map((subcategory) => (
								<Link
									key={subcategory.slug}
									className="group flex h-full w-full flex-row gap-2 border px-4 py-2 hover:bg-gray-100 sm:w-[200px]"
									to="/products/$category/$subcategory"
									params={{
										category: categoryTyped.slug,
										subcategory: subcategory.slug,
									}}
									preload="intent"
								>
									<div className="py-2">
										<Image
											loading={imageCount++ < 15 ? "eager" : "lazy"}
											decoding="sync"
											src={subcategory.imageUrl ?? "/placeholder.webp"}
											alt={`${subcategory.name}`}
											width={48}
											height={48}
											className="h-12 w-12 shrink-0 object-cover"
											options={{
												cloudflare: {
													domain: "images.tancn.dev",
												},
											}}
											operations={{
												cloudflare: {
													width: 48,
													height: 48,
													quality: 60,
												},
											}}
										/>
									</div>
									<div className="flex h-16 grow flex-col items-start py-2">
										<div className="text-sm font-medium text-gray-700 group-hover:underline">
											{subcategory.name}
										</div>
									</div>
								</Link>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
