import { createLink } from "@tanstack/react-router";
import * as React from "react";

type PrefetchImage = {
	srcset: string | null;
	sizes: string | null;
	src: string;
	alt: string;
	loading: string;
};

// Image prefetching utilities
const seen = new Set<string>();
const imageCache = new Map<string, PrefetchImage[]>();

async function prefetchImages(href: string): Promise<PrefetchImage[]> {
	// Skip prefetching for certain routes
	if (
		!href ||
		!href.startsWith("/") ||
		href.startsWith("/order") ||
		href === "/"
	) {
		return [];
	}

	// Check cache first
	if (imageCache.has(href)) {
		const cached = imageCache.get(href);
		return cached || [];
	}

	try {
		if (typeof window === "undefined") return [];
		const url = new URL(href, window.location.href);
		const imageResponse = await fetch(`/api/prefetch-images${url.pathname}`, {
			priority: "low",
		});

		if (!imageResponse.ok) {
			if (import.meta.env.DEV) {
				throw new Error("Failed to prefetch images");
			}
			return [];
		}

		const response = (await imageResponse.json()) as {
			images: PrefetchImage[];
		};
		const { images } = response;
		imageCache.set(href, images);
		return images;
	} catch (error) {
		if (import.meta.env.DEV) {
			console.error("Error prefetching images:", error);
		}
		return [];
	}
}

function prefetchImage(image: PrefetchImage) {
	// Skip lazy-loaded images
	if (image.loading === "lazy") {
		return;
	}

	// Check if already prefetched
	if (seen.has(image.src)) {
		return;
	}

	const img = new Image();
	img.decoding = "async";
	img.fetchPriority = "low";

	if (image.sizes) img.sizes = image.sizes;
	if (image.srcset) img.srcset = image.srcset;

	seen.add(image.src);
	img.src = image.src;
	img.alt = image.alt;
}

const CustomLinkComponent = React.forwardRef<
	HTMLAnchorElement,
	React.AnchorHTMLAttributes<HTMLAnchorElement>
>((props, ref) => {
	const linkRef = React.useRef<HTMLAnchorElement>(null);
	const prefetchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

	// Combine refs
	const combinedRef = React.useCallback(
		(node: HTMLAnchorElement) => {
			linkRef.current = node;
			if (typeof ref === "function") {
				ref(node);
			} else if (ref) {
				ref.current = node;
			}
		},
		[ref],
	);

	// Get href for image prefetching (client-side only)
	const href = React.useMemo(() => {
		if (typeof window === "undefined" || !props.href) {
			return "";
		}
		const url = new URL(props.href, window.location.href);
		return url.pathname + url.search + url.hash;
	}, [props.href]);

	React.useEffect(() => {
		const linkElement = linkRef.current;
		if (!linkElement) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry.isIntersecting) {
					prefetchTimeoutRef.current = setTimeout(async () => {
						if (href && !imageCache.has(href)) {
							void prefetchImages(href).then((images) => {
								imageCache.set(href, images);
							}, console.error);
						}
						observer.unobserve(entry.target);
					}, 150);
				} else if (prefetchTimeoutRef.current) {
					clearTimeout(prefetchTimeoutRef.current);
					prefetchTimeoutRef.current = null;
				}
			},
			{ rootMargin: "0px", threshold: 0.1 },
		);

		observer.observe(linkElement);

		return () => {
			observer.disconnect();
			if (prefetchTimeoutRef.current) {
				clearTimeout(prefetchTimeoutRef.current);
			}
		};
	}, [href]);

	const handleMouseEnter = async () => {
		if (href) {
			let images = imageCache.get(href);
			if (!images) {
				images = await prefetchImages(href);
			}
			for (const image of images) {
				prefetchImage(image);
			}
		}
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: <explanation>
		<a ref={combinedRef} {...props} onMouseEnter={handleMouseEnter}>
			{props.children}
		</a>
	);
});

CustomLinkComponent.displayName = "CustomLinkComponent";

export const OptimisticLink = createLink(CustomLinkComponent);
