export const seo = ({
	title = "TanStack Fast - High-Performance E-commerce on Cloudflare",
	description = "A blazing fast e-commerce template using TanStack Router, Query, and Start deployed on Cloudflare's edge network. Inspired by NextFaster.",
	keywords = "ecommerce, tanstack, cloudflare, react, performance, edge computing, router, query",
	image = "https://tanstack-faster.tancn.dev/twitter-image.jpg",
	url = "https://tanstack-faster.tancn.dev/",
	siteName = "tanstack-fast",
	twitterSite = "@vijayabaskar56",
	twitterCreator = "@vijayabaskar56",
}: {
	title?: string;
	description?: string;
	image?: string;
	keywords?: string;
	url?: string;
	siteName?: string;
	twitterSite?: string;
	twitterCreator?: string;
}) => {
	const tags = [
		{ title: `${title ?? "TanstackStart Faster"} | TanstackStart Faster` },
		{ name: "description", content: description },
		{ name: "keywords", content: keywords },
		{ name: "twitter:title", content: title },
		{ name: "twitter:description", content: description },
		{ name: "twitter:creator", content: twitterCreator },
		{ name: "twitter:site", content: twitterSite },
		{ name: "twitter:url", content: url },
		{ name: "og:type", content: "website" },
		{ name: "og:title", content: title },
		{ name: "og:description", content: description },
		{ name: "og:url", content: url },
		{ name: "og:site_name", content: siteName },
		...(image
			? [
					{ name: "twitter:image", content: image },
					{ name: "twitter:card", content: "summary_large_image" },
					{ name: "og:image", content: image },
				]
			: []),
	];

	return tags;
};
