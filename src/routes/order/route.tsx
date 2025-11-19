import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/order")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<main className="min-h-screen p-2 sm:p-4">
			<div className="container mx-auto p-2 sm:p-3 lg:p-4">
				<div className="flex items-center justify-between border-b border-gray-200">
					<h1 className="text-xl sm:text-2xl lg:text-3xl text-accent1">
						Order
					</h1>
				</div>
			</div>
			<Outlet />
		</main>
	);
}
