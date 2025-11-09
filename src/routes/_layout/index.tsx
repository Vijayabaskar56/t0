import { createFileRoute, Link } from "@tanstack/react-router";
import {
	getCollectionsOptions,
	getProductCountOptions,
} from "@/api/query-options";

export const Route = createFileRoute("/_layout/")({
	component: RouteComponent,
	loader: async ({ context }) => {
		const [collections, productCount] = await Promise.all([
			context.queryClient.ensureQueryData(getCollectionsOptions()),
			context.queryClient.ensureQueryData(getProductCountOptions()),
		]);
		return { collections, productCount };
	},
});

function RouteComponent() {
	const { collections, productCount } = Route.useLoaderData();
	return (
		<div className="w-full p-4">
			<div className="mb-2 w-full grow border-b border-accent1 text-sm font-semibold text-black">
				Explore {productCount.at(0)?.count.toLocaleString()} productssss
			</div>
			{collections.map((collection) => (
				<div key={collection.name}>
					<h2 className="text-xl font-semibold">{collection.name}</h2>
					<div className="flex flex-row flex-wrap justify-center gap-2 border-b-2 py-4 sm:justify-start">
						{collection.categories.map((category) => (
							<Link
								preload="intent"
								key={category.name}
								className="flex w-[125px] flex-col items-center text-center"
								to="/products/$category"
								params={{ category: category.slug }}
							>
								<img
									decoding="sync"
									src={category.imageUrl ?? "/placeholder.svg"}
									alt={`A small picture of ${category.name}`}
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
