import { createFileRoute, Link } from "@tanstack/react-router";
import {
	getCategoryOptions,
	getCategoryProductCountOptions,
} from "@/api/query-options";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_layout/products/$category/")({
	loader: async ({ params, context }) => {
	console.log(params , 'params')
		const [category, categoryProductCount] = await Promise.all([
			context.queryClient.ensureQueryData(getCategoryOptions(params.category)),
			context.queryClient.ensureQueryData(getCategoryProductCountOptions(params.category)),
		]);
		console.log(category , categoryProductCount)
		return { category, categoryProductCount };
	},
	component: RouteComponent,
  head: ({ loaderData }) => {
  const examples = loaderData?.category?.subcollections?.slice(0, 2)
    .map((s) => s.name)
    .join(", ")
    .toLowerCase();
  console.log(loaderData , 'loader')

    return {
      meta: [
        {
          charSet: "utf-8",
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
      ...seo({ title: loaderData?.category?.name }),
      ],
    }
  },
	pendingComponent: () => <div>Loading...</div>,
	errorComponent: () => <div>Error</div>,
});

function RouteComponent() {
	const { category, categoryProductCount } = Route.useLoaderData();
	const finalCount = categoryProductCount[0]?.count;
	return (
		<div className="container p-4">
			{finalCount && (
				<h1 className="mb-2 border-b-2 text-sm font-bold">
					{finalCount} {finalCount === 1 ? "Product" : "Products"}
				</h1>
			)}
			<div className="space-y-4">
				{category?.subcollections.map((subcollection, index) => (
					<div key={subcollection.id}>
						<h2 className="mb-2 border-b-2 text-lg font-semibold">
							{subcollection.name}
						</h2>
						<div className="flex flex-row flex-wrap gap-2">
							{subcollection.subcategories.map((subcategory) => (
								<Link
									preload="intent"
									key={subcategory.slug}
									className="group flex h-full w-full flex-row gap-2 border px-4 py-2 hover:bg-gray-100 sm:w-[200px]"
									to="/products/$category/$subcategory"
									params={{
										category: category.slug,
										subcategory: subcategory.slug,
									}}
								>
									<div className="py-2">
										<img
											loading="eager"
											decoding="sync"
											src={subcategory.imageUrl ?? "/placeholder.svg"}
											alt={`${subcategory.name}`}
											width={48}
											height={48}
											className="h-12 w-12 flex-shrink-0 object-cover"
										/>
									</div>
									<div className="flex h-16 flex-grow flex-col items-start py-2">
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
