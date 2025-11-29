import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { ErrorBoundary } from "./components/error-boundary";
import { getContext } from "./integrations/tanstack-query/context";
import { Provider } from "./integrations/tanstack-query/root-provider";
import { SeenSetManager } from "./lib/seen-set-manager";
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
	const rqContext = getContext();
	const seenManager = new SeenSetManager();

	const router = createRouter({
		routeTree,
		context: { ...rqContext, seenManager },
		defaultPreload: "intent",
		scrollRestoration: true,
		defaultStructuralSharing: true,
		scrollRestorationBehavior: "smooth",
		defaultPreloadDelay: 100,
		defaultPreloadIntentProximity: 1000,
		defaultNotFoundComponent: () => <div>Not Found</div>,
		defaultErrorComponent: ({ error, reset }) => (
			<ErrorBoundary error={error} reset={reset} />
		),
		Wrap: (props: { children: React.ReactNode }) => {
			return <Provider {...rqContext}>{props.children}</Provider>;
		},
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient: rqContext.queryClient,
	});

	return router;
};
