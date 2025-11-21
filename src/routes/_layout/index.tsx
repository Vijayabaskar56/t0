import { createFileRoute, Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import {
	getCollectionsOptions,
	getProductCountOptions,
	prefetchImagesOptions,
} from "@/api/query-options";
// import { Image } from "@/components/ui/image";
import type { Category, Collection } from "@/db/schema";
import { type PrefetchImage, prefetchImages } from "@/lib/prefetch-images";
import { seo } from "@/lib/seo";

interface LayoutLoaderData {
	collections: (Collection & { categories: Category[] })[];
	productCount: { count: number }[];
}

export const Route = createFileRoute("/_layout/")({
	beforeLoad: async ({ location, context }) => {
		if (typeof window !== "undefined") {
			const data = await context.queryClient.ensureQueryData(
				prefetchImagesOptions(location.pathname),
			);
			const images = (data as { images?: PrefetchImage[] })?.images;
			prefetchImages(images, context.seenManager);
		}
	},
	loader: async ({ context }) => {
		const [collections, productCount] = await Promise.all([
			context.queryClient.ensureQueryData(getCollectionsOptions()),
			context.queryClient.ensureQueryData(getProductCountOptions()),
		]);
		return { collections, productCount };
	},
	head: ({ loaderData }) => {
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
					title: "TanStack Start Starter",
				},
			],
			...seo({
				title: (loaderData as LayoutLoaderData)?.collections?.[0]?.name,
			}),
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { collections, productCount } =
		Route.useLoaderData() as LayoutLoaderData;

	let imageCount = 0;
	return (
		<div className="w-full p-4">
			<div className="mb-2 w-full grow border-b border-accent1 text-sm font-semibold text-black">
				Explore{" "}
				{(productCount as { count: number }[])?.at(0)?.count.toLocaleString()}{" "}
				productssss
			</div>
			{(collections as (Collection & { categories: Category[] })[]).map(
				(collection) => (
					<div key={collection.name}>
						<h2 className="text-xl font-semibold">{collection.name}</h2>
						<div className="flex flex-row flex-wrap justify-center gap-2 border-b-2 py-4 sm:justify-start">
							{collection.categories.map((category: Category) => (
								<Link
									key={category.name}
									className="flex w-[125px] flex-col items-center text-center"
									to="/products/$category"
									params={{ category: category.slug }}
									preload="intent"
								>
									<Image
										loading={imageCount++ < 15 ? "eager" : "lazy"}
										decoding="sync"
										src={category.imageUrl ?? "/placeholder.webp"}
										alt={`${category.name} category`}
										className="mb-2 h-14 w-14 border hover:bg-accent2"
										width={48}
										height={48}
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
									<span className="text-xs">{category.name}</span>
								</Link>
							))}
						</div>
					</div>
				),
			)}
		</div>
	);
}
