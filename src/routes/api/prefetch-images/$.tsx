import { createFileRoute } from "@tanstack/react-router";
import { parseHTML } from "linkedom";

export const Route = createFileRoute("/api/prefetch-images/$")({
	server: {
		handlers: ({ createHandlers }) => {
			return createHandlers({
				GET: {
					handler: async ({ request, params }) => {
						const path = params._splat;
						if (!path) {
							return new Response("Missing path parameter", { status: 400 });
						}

						// Construct the full URL to fetch the page
						const url = new URL(request.url);
						const pageUrl = `${url.protocol}//${url.host}/${path}`;

						try {
							// Fetch the page content
							const pageResponse = await fetch(pageUrl);
							if (!pageResponse.ok) {
								return new Response("Failed to fetch page", {
									status: pageResponse.status,
								});
							}

							const html = await pageResponse.text();

							// Parse HTML with DOM parser for efficient image extraction
							const { document } = parseHTML(html);
							const images = Array.from(document.querySelectorAll("main img"))
								.map((img) => ({
									srcset:
										img.getAttribute("srcset") || img.getAttribute("srcSet"), // Linkedom is case-sensitive
									sizes: img.getAttribute("sizes"),
									src: img.getAttribute("src"),
									alt: img.getAttribute("alt"),
									loading: img.getAttribute("loading"),
								}))
								.filter((img) => img.src);

							return Response.json(
								{ images },
								{
									headers: {
										"Cache-Control": "public, max-age=3600", // Cache for 1 hour
										"Content-Type": "application/json",
									},
								},
							);
						} catch (error) {
							console.error("Error prefetching images:", error);
							return new Response("Internal server error", { status: 500 });
						}
					},
				},
			});
		},
	},
});
