import { createFileRoute } from "@tanstack/react-router";

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

							// Simple HTML parsing to extract image information
							// Using regex as a lightweight solution for Cloudflare Workers
							const imgRegex = /<img[^>]+>/gi;
							const imgMatches = html.match(imgRegex) || [];

							const images = imgMatches
								.map((imgTag) => {
									const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
									const srcsetMatch = imgTag.match(/srcset=["']([^"']+)["']/i);
									const sizesMatch = imgTag.match(/sizes=["']([^"']+)["']/i);
									const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
									const loadingMatch = imgTag.match(
										/loading=["']([^"']+)["']/i,
									);

									const src = srcMatch ? srcMatch[1] : null;
									if (!src) return null;

									return {
										src,
										srcset: srcsetMatch ? srcsetMatch[1] : null,
										sizes: sizesMatch ? sizesMatch[1] : null,
										alt: altMatch ? altMatch[1] : "",
										loading: loadingMatch ? loadingMatch[1] : "auto",
									};
								})
								.filter((img): img is NonNullable<typeof img> => img !== null);

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
