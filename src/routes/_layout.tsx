import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { getCollectionsOptions } from "@/api/query-options";

export const Route = createFileRoute("/_layout")({
	component: RouteComponent,
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(getCollectionsOptions()),
	pendingComponent: () => <div>Loading...</div>,
	errorComponent: () => <div>Error</div>,
});

function RouteComponent() {
	const allCollections = Route.useLoaderData();
	return (
		<div className="flex grow font-mono">
			<aside className="fixed left-0 hidden w-64 min-w-64 max-w-64 overflow-y-auto border-r p-4 md:block md:h-full">
				<h2 className="border-b border-accent1 text-sm font-semibold text-accent1">
					Choose a Category
				</h2>
				<ul className="flex flex-col items-start justify-center">
					{allCollections.map((collection: any) => (
						<li key={collection.slug} className="w-full">
							<Link
								to="/$collectionName"
								params={{ collectionName: collection.slug }}
								preload="intent"
								className="block w-full py-1 text-xs text-gray-800 hover:bg-accent2 hover:underline"
							>
								{collection.name}
							</Link>
						</li>
					))}
				</ul>
			</aside>
			<main className="min-h-[calc(100vh-113px)] flex-1 overflow-y-auto p-4 pt-0 md:pl-64">
				<Outlet />
			</main>
		</div>
	);
}
