import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getCollectionDetailsOptions } from "@/api/query-options";
import { Image } from "@/components/ui/image";
import type { Category, Collection } from "@/db/schema";
import { prefetchCollectionImages } from "@/lib/prefetch-images";

export const Route = createFileRoute("/_layout/$collectionName")({
	loader: async ({ params, context }) => {
		const collectionDetails = await context.queryClient.ensureQueryData(
			getCollectionDetailsOptions(params.collectionName),
		);

		// Fire-and-forget image prefetching
		prefetchCollectionImages(collectionDetails, context.seenManager);

		return collectionDetails;
	},
	head: () => ({
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
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { collectionName } = Route.useParams();
	const { data: collectionDetails } = useSuspenseQuery(
		getCollectionDetailsOptions(collectionName),
	);

	const collections = collectionDetails as unknown as (Collection & {
		categories: Category[];
	})[];
	if (!collections || collections.length === 0)
		return <div>No collection found</div>;

	const collection = collections[0];
	let imageCount = 0;
	return (
		<div className="w-full p-4">
			<div key={collection.name}>
				<h2 className="text-xl font-semibold">{collection.name}</h2>
				<div className="flex flex-row flex-wrap justify-center gap-2 border-b-2 py-4 sm:justify-start">
					{collection.categories.map((category) => (
						<Link
							key={category.name}
							className="flex w-[125px] flex-col items-center text-center"
							to="/products/$category"
							preload="intent"
							params={{
								category: category.slug,
							}}
						>
							<Image
								loading={imageCount++ < 30 ? "eager" : "lazy"}
								decoding="sync"
								src={category.imageUrl ?? "/placeholder.webp"}
								alt={`${category.name}`}
								className="mb-2 h-14 w-14 border hover:bg-accent2"
								width={48}
								height={48}
								quality={65}
							/>
							<span className="text-xs">{category.name}</span>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}
