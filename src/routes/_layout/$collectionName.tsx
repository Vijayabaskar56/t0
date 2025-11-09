import { createFileRoute, Link } from "@tanstack/react-router";
import { getCollectionDetails } from "@/routes/api/server-funtions";

export const Route = createFileRoute("/_layout/$collectionName")({
	component: RouteComponent,
	loader: async ({ params }) => {
		return await getCollectionDetails({
			data: { collectionName: params.collectionName },
		});
	},
	pendingComponent: () => <div>Loading...</div>,
	errorComponent: () => <div>Error</div>,
});

function RouteComponent() {
	const collectionDetails = Route.useLoaderData();
	return (
		<div className="w-full p-4">
			{collectionDetails.map((collection) => (
				<div key={collection.name}>
					<h2 className="text-xl font-semibold">{collection.name}</h2>
					<div className="flex flex-row flex-wrap justify-center gap-2 border-b-2 py-4 sm:justify-start">
						{collection.categories.map((category) => (
							<Link
								preload="intent"
								key={category.name}
								className="flex w-[125px] flex-col items-center text-center"
								to="/$collectionName"
								params={{ collectionName: category.slug }}
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
			))}
		</div>
	);
}
