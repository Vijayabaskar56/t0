import { createFileRoute, Link } from "@tanstack/react-router";
import { getCollectionDetailsOptions } from "@/api/query-options";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_layout/$collectionName")({
	loader: async ({ params, context }) => {
		return await context.queryClient.ensureQueryData(
			getCollectionDetailsOptions(params.collectionName),
		);
	},
	head: ({ loaderData }) => ({
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
		// ...seo({ title: loaderData?.[0]?.name }),
	}),
	component: RouteComponent,
	pendingComponent: () => <div>Loading...</div>,
	errorComponent: () => <div>Error</div>,
});

function RouteComponent() {
	const collectionDetails = Route.useLoaderData();
	if (!collectionDetails || collectionDetails.length === 0) return null;

	const collection = collectionDetails[0];
	return (
		<div className="w-full p-4">
			<div key={collection.name}>
				<h2 className="text-xl font-semibold">{collection.name}</h2>
				<div className="flex flex-row flex-wrap justify-center gap-2 border-b-2 py-4 sm:justify-start">
					{collection.categories.map((category) => (
						<Link
							preload="intent"
							key={category.name}
							className="flex w-[125px] flex-col items-center text-center"
							to="/products/$category"
							params={{
								category: category.slug,
							}}
						>
							<img
								decoding="sync"
								src={category.imageUrl ?? "/placeholder.svg"}
								alt={`${category.name}`}
								className="mb-2 h-14 w-14 border hover:bg-accent2"
								width={48}
								height={48}
							/>
							<span className="text-xs">{category.name}</span>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}
