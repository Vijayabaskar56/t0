import type { SeenSetManager } from "./seen-set-manager";

export type PrefetchImage = {
	src: string;
	srcset?: string | null;
	sizes?: string | null;
	loading?: string;
};

export function prefetchImages(
	images: PrefetchImage[] | undefined,
	seenManager: SeenSetManager,
) {
	if (!images) return;

	for (const image of images) {
		if (image.loading === "lazy" || seenManager.isSeen(image.src)) continue;

		const img = new Image();
		img.decoding = "async";
		img.fetchPriority = "low";
		if (image.sizes) img.sizes = image.sizes;
		if (image.srcset) img.srcset = image.srcset;
		seenManager.markSeen(image.src);
		img.src = image.src;
	}
}
