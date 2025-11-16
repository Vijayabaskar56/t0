import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/order-history/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
 <main className="min-h-screen p-4">
      <h1 className="w-full border-b-2 border-accent1 text-left text-2xl text-accent1">
        Order History
      </h1>
      <div className="mx-auto flex max-w-md flex-col gap-4 text-black">
        <Suspense>
          {/*<OrderHistoryDynamic />*/}
        </Suspense>
      </div>
    </main>
	)
}
