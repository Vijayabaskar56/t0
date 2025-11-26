import { transformUrl } from "unpic";

export function getOptimizedUrl(
	src: string,
	width: number,
	height: number,
	quality: number,
) {
	return (
		transformUrl(
			{
				url: src,
				width,
				height,
				quality,
				provider: "cloudflare",
			},
			{
				cloudflare: {
					f: "auto",
					format: "auto",
				},
			},
			{
				cloudflare: {
					domain: "tanstack-faster.tancn.dev",
				},
			},
		) || src
	);
}
