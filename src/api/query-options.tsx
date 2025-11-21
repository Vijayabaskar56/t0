import { queryOptions } from "@tanstack/react-query";
import type { Product } from "@/db/schema";
import {
	getCategory,
	getCategoryProductCount,
	getCollectionDetails,
	getCollections,
	getPrefetchImages,
	getProductCount,
	getProductDetails,
	getProductForSubcategory,
	getProductsForSubcategory,
	getRelatedProducts,
	getSubCategoryProductCount,
	searchProducts,
} from "./server-funtions";

export const getCollectionsOptions = () =>
	queryOptions({
		queryKey: ["collections"],
		queryFn: () => getCollections(),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getCollectionDetailsOptions = (collectionName: string) =>
	queryOptions({
		queryKey: ["collection-details", collectionName],
		queryFn: () =>
			getCollectionDetails({
				data: { collectionName },
			}),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getCategoryOptions = (category: string) =>
	queryOptions({
		queryKey: ["category", category],
		queryFn: () =>
			getCategory({
				data: { category },
			}),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getCategoryProductCountOptions = (category: string) =>
	queryOptions({
		queryKey: ["category-product-count", category],
		queryFn: () =>
			getCategoryProductCount({
				data: { category },
			}),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getProductForSubcategoryOptions = (subcategory: string) =>
	queryOptions({
		queryKey: ["product-for-subcategory", subcategory],
		queryFn: () =>
			getProductForSubcategory({
				data: { subcategory },
			}),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getSubCategoryProductCountOptions = (subcategory: string) =>
	queryOptions({
		queryKey: ["subcategory-product-count", subcategory],
		queryFn: () =>
			getSubCategoryProductCount({
				data: { subcategory },
			}),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getProductDetailsOptions = (product: string) =>
	queryOptions({
		queryKey: ["product-details", product],
		queryFn: () =>
			getProductDetails({
				data: { product },
			}),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getProductsForSubcategoryOptions = (subcategory: string) =>
	queryOptions({
		queryKey: ["products-for-subcategory", subcategory],
		queryFn: () =>
			getProductsForSubcategory({
				data: { subcategory },
			}),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getRelatedProductsOptions = (
	subcategory: string,
	currentProductSlug: string,
) =>
	queryOptions({
		queryKey: ["related-products", subcategory, currentProductSlug],
		queryFn: () =>
			getRelatedProducts({
				data: { subcategory, currentProductSlug },
			}),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getProductCountOptions = () =>
	queryOptions({
		queryKey: ["product-count"],
		queryFn: () => getProductCount(),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getCartOptions = () =>
	queryOptions({
		queryKey: ["cart-items"],
		queryFn: () =>
			fetch("/order").then((res) => res.json()) as Promise<{
				products: (Product & { quantity: number })[];
			}>,
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const searchProductsOptions = (q: string) =>
	queryOptions({
		queryKey: ["search-products", q],
		queryFn: () =>
			searchProducts({
				data: { q },
			}),
		enabled: q.length >= 2,
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const prefetchImagesOptions = (path: string) =>
	queryOptions({
		queryKey: ["pre-fetch-images", path],
		queryFn: () => getPrefetchImages({ data: { path } }),
		enabled: typeof window !== "undefined",
		staleTime: 1000 * 60 * 10, // 10 minutes
	});
