import { createIsomorphicFn } from "@tanstack/react-start";
import type { Category, Collection } from "@/db/schema";
import { getEagerImageCount } from "./get-eager-image-count";
import { getOptimizedUrl } from "./image-optimization";
import type { SeenSetManager } from "./seen-set-manager";

export type PrefetchImage = {
	src: string;
	srcset?: string | null;
	sizes?: string | null;
	loading?: string;
	width?: number;
	quality?: number;
};

export const prefetchCollectionsImages = createIsomorphicFn().client(
	async (
		collections: (Collection & { categories: Category[] })[],
		seenManager: SeenSetManager,
	) => {
		const eagerCount = getEagerImageCount();
		let count = 0;
		const images: PrefetchImage[] = collections.flatMap((collection) =>
			collection.categories
				.filter((cat) => cat.imageUrl)
				.map((cat) => ({
					src: getOptimizedUrl(cat.imageUrl ?? "/placeholder.webp", 48, 48, 65),
					alt: cat.name,
					loading: count++ < eagerCount ? "eager" : "lazy",
					width: 48,
					quality: 65,
				})),
		);

		prefetchImages(images, seenManager);
	},
);

export const prefetchCategoryImages = createIsomorphicFn().client(
	async (categoryData: any, seenManager: SeenSetManager) => {
		const eagerCount = getEagerImageCount();
		let count = 0;
		const images: PrefetchImage[] =
			categoryData?.subcollections?.flatMap((subcollection: any) =>
				subcollection.subcategories
					.filter((subcat: any) => subcat.imageUrl)
					.map((subcat: any) => ({
						src: getOptimizedUrl(
							subcat.imageUrl ?? "/placeholder.webp",
							48,
							48,
							65,
						),
						alt: subcat.name,
						loading: count++ < eagerCount ? "eager" : "lazy",
						width: 48,
						quality: 65,
					})),
			) ?? [];

		prefetchImages(images, seenManager);
	},
);

export const prefetchProductImages = createIsomorphicFn().client(
	async (currentProduct: any, seenManager: SeenSetManager) => {
		const images: PrefetchImage[] = [
			currentProduct?.imageUrl
				? {
						src: getOptimizedUrl(currentProduct.imageUrl, 256, 256, 65),
						alt: currentProduct.name,
						loading: "eager",
						width: 256,
						quality: 60,
					}
				: null,
		].filter(Boolean) as PrefetchImage[];

		prefetchImages(images, seenManager);
	},
);

export const prefetchCollectionImages = createIsomorphicFn().client(
	async (collectionDetails: any, seenManager: SeenSetManager) => {
		const eagerCount = getEagerImageCount();
		let count = 0;
		const images: PrefetchImage[] =
			collectionDetails?.[0]?.categories
				?.filter((cat: any) => cat.imageUrl)
				.map((cat: any) => ({
					src: getOptimizedUrl(cat.imageUrl ?? "/placeholder.webp", 48, 48, 65),
					alt: cat.name,
					loading: count++ < eagerCount ? "eager" : "lazy",
					width: 48,
					quality: 65,
				})) ?? [];

		prefetchImages(images, seenManager);
	},
);

export const prefetchSubcategoryImages = createIsomorphicFn().client(
	async (productsData: any, seenManager: SeenSetManager) => {
		const eagerCount = getEagerImageCount();
		let count = 0;
		const images: PrefetchImage[] =
			productsData
				?.filter((product: any) => product.imageUrl)
				.map((product: any) => ({
					src: getOptimizedUrl(
						product.imageUrl ?? "/placeholder.webp",
						48,
						48,
						60,
					),
					alt: product.name,
					loading: count++ < eagerCount ? "eager" : "lazy",
					width: 48,
					quality: 60,
				})) ?? [];

		prefetchImages(images, seenManager);
	},
);

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
