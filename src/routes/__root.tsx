import "../styles.css";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { lazy, Suspense } from "react";
import { Toaster } from "sonner";
import CartCount from "@/components/cart-count";
import { Image } from "@/components/ui/image";
import { WelcomeToast } from "@/components/welcome-toast";
import type { SeenSetManager } from "@/lib/seen-set-manager";
import { seo } from "@/lib/seo";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

const SearchDropdownComponent = lazy(
	() => import("@/components/search-dropdown"),
);

interface MyRouterContext {
	queryClient: QueryClient;
	seenManager: SeenSetManager;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			...seo({}),
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.ico",
			},
		],
	}),
	shellComponent: RootDocument,
	preload: true,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="h-full w-full">
			<head>
				<HeadContent />
			</head>
			<body
				className={`flex flex-col overflow-y-auto overflow-x-hidden antialiased`}
			>
				<div>
					<header className="fixed top-0 z-10 flex h-[90px] w-screen grow items-center justify-between border-b-2 border-accent2 bg-background p-2 pb-1 pt-2 sm:h-[70px] sm:flex-row sm:gap-4 sm:p-4 sm:pb-1 sm:pt-0">
						<div className="flex grow flex-col">
							<div className="absolute right-2 top-2 flex justify-end pt-2 font-sans text-sm hover:underline sm:relative sm:right-0 sm:top-0"></div>
							<div className="flex w-full flex-col items-start justify-center sm:w-auto sm:flex-row sm:items-center sm:gap-2">
								<Link
									to="/"
									className="text-2xl font-bold text-accent1"
									preload="intent"
								>
									<span className="flex flex-row gap-2">
										<Image
											src="/logo-black.svg"
											alt="logo"
											height={40}
											width={40}
										/>
										TanStack Start Faster
									</span>
								</Link>
								<div className="items flex w-full flex-row items-center justify-between gap-4">
									<div className="mx-0 grow sm:mx-auto sm:grow-0">
										<Suspense
											fallback={
												<div className="h-10 w-full bg-gray-100 animate-pulse rounded" />
											}
										>
											<SearchDropdownComponent />
										</Suspense>
									</div>
									<div className="flex flex-row justify-between space-x-4">
										<div className="relative">
											<Link
												to="/order"
												className="text-lg text-accent1 hover:underline"
											>
												ORDER
											</Link>
											<CartCount />
										</div>
										<Link
											to="/order-history"
											className="hidden text-lg text-accent1 hover:underline md:block"
										>
											ORDER HISTORY
										</Link>
										<Link
											to="/order-history"
											aria-label="Order History"
											className="block text-lg text-accent1 hover:underline md:hidden"
										></Link>
									</div>
								</div>
							</div>
						</div>
					</header>
					<div className="pt-[85px] sm:pt-[70px]">{children}</div>
				</div>
				<footer className="fixed bottom-0 flex h-12 w-screen flex-col items-center justify-between space-y-2 border-t border-gray-400 bg-background px-4 font-sans text-[11px] sm:h-6 sm:flex-row sm:space-y-0">
					<div className="text-center sm:text-right">
						Powered by{" "}
						<a
							href="https://tanstack.com/start/latest"
							className="font-bold text-accent1 hover:underline"
							target="_blank"
							rel="noopener"
						>
							Tanstack Start
						</a>{" "}
						&{" "}
						<a
							href="https://tanstack.com/start/latest"
							className="font-bold text-accent1 hover:underline"
							target="_blank"
							rel="noopener"
						>
							Cloudflare Workers
						</a>
					</div>
					<div className="text-center sm:text-right">
						Check out the{" "}
						<a
							href="https://github.com/Vijayabaskar56/tanstack-start-faster"
							className="font-bold text-accent1 hover:underline"
							target="_blank"
							rel="noopener"
						>
							Source Code
						</a>
					</div>
				</footer>
				{import.meta.env.DEV && (
					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							TanStackQueryDevtools,
						]}
					/>
				)}
				<Suspense fallback={null}>
					<Toaster closeButton />
					<WelcomeToast />
				</Suspense>
				<Scripts />
			</body>
		</html>
	);
}
