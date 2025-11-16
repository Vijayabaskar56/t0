import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { WelcomeToast } from "@/components/welcome-toast";
import { seo } from "@/lib/seo";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";
import criticalCss from "../critical.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
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
				rel: "preconnect",
				href: "https://github.com",
			},
			{
				rel: "dns-prefetch",
				href: "https://github.com",
			},
			{
				rel: "preload",
				href: "/tanstack-circle-logo.png",
				as: "image",
			},
			{
				rel: "preload",
				href: "/logo192.png",
				as: "image",
			},
			{
				rel: "stylesheet",
				href: criticalCss,
			},
			{
				rel: "stylesheet",
				href: appCss,
				media: "print",
				onLoad: () => {
					const link = document.querySelector(
						`link[href="${appCss}"]`,
					) as HTMLLinkElement;
					if (link) link.media = "all";
				},
			},
			{
				rel: "icon",
				href: "/favicon.ico",
			},
		],
	}),
	shellComponent: RootDocument,
	preload: true,
	notFoundComponent: () => <div>Not Found Component</div>,
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
					<header className="fixed top-0 z-10 flex h-[90px] w-[100vw] flex-grow items-center justify-between border-b-2 border-accent2 bg-background p-2 pb-[4px] pt-2 sm:h-[70px] sm:flex-row sm:gap-4 sm:p-4 sm:pb-[4px] sm:pt-0">
						<div className="flex flex-grow flex-col">
							<div className="absolute right-2 top-2 flex justify-end pt-2 font-sans text-sm hover:underline sm:relative sm:right-0 sm:top-0">
								{/*<LoginForm />*/}
							</div>
							<div className="flex w-full flex-col items-start justify-center sm:w-auto sm:flex-row sm:items-center sm:gap-2">
								<Link to="/" className="text-2xl font-bold text-accent1">
									TanStackStart Faster
								</Link>
								<div className="items flex w-full flex-row items-center justify-between gap-4">
									<div className="mx-0 flex-grow sm:mx-auto sm:flex-grow-0">
										{/* <SearchDropdownComponent /> */}
									</div>
									<div className="flex flex-row justify-between space-x-4">
										<div className="relative">
											<Link
												to="/order"
												preload="intent"
												className="text-lg text-accent1 hover:underline"
											>
												ORDER
											</Link>
											{/* <Suspense>
                        <Cart />
                      </Suspense> */}
										</div>
										<Link
											to="/order-history"
											preload="intent"
											className="hidden text-lg text-accent1 hover:underline md:block"
										>
											ORDER HISTORY
										</Link>
										<Link
											to="/order-history"
											preload="intent"
											aria-label="Order History"
											className="block text-lg text-accent1 hover:underline md:hidden"
										>
											{/* <MenuIcon /> */}
										</Link>
									</div>
								</div>
							</div>
						</div>
					</header>
					<div className="pt-[85px] sm:pt-[70px]">{children}</div>
				</div>
				<footer className="fixed bottom-0 flex h-12 w-screen flex-col items-center justify-between space-y-2 border-t border-gray-400 bg-background px-4 font-sans text-[11px] sm:h-6 sm:flex-row sm:space-y-0">
					<div className="flex flex-wrap justify-center space-x-2 pt-2 sm:justify-start">
						<span className="hover:bg-accent2 hover:underline">Home</span>
						<span>|</span>
						<span className="hover:bg-accent2 hover:underline">FAQ</span>
						<span>|</span>
						<span className="hover:bg-accent2 hover:underline">Returns</span>
						<span>|</span>
						<span className="hover:bg-accent2 hover:underline">Careers</span>
						<span>|</span>
						<span className="hover:bg-accent2 hover:underline">Contact</span>
					</div>
					<div className="text-center sm:text-right">
						By using this website, you agree to check out the{" "}
						<a
							href="https://github.com/tanstack/tanstack-fast"
							className="font-bold text-accent1 hover:underline"
							target="_blank"
							rel="noopener"
						>
							Source Code
						</a>
					</div>
				</footer>
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
				<Suspense fallback={null}>
					<Toaster closeButton />
					<WelcomeToast />
				</Suspense>
				<Scripts />
			</body>
		</html>
	);
}
