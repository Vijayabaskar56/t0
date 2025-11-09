import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/order-history/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/order-history/"!</div>;
}
