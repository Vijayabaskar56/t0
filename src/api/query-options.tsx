import { queryOptions } from "@tanstack/react-query";
import type { Product } from "@/db/schema";
import {
	getCategory,
	getCategoryProductCount,
	getCollectionDetails,
	getCollections,
	getProductCount,
	getProductDetails,
	getProductForSubcategory,
	getProductsForSubcategory,
	getRelatedProducts,
	getSubCategoryProductCount,
	getUser,
	searchProducts,
} from "./server-funtions";

export const getCollectionsOptions = () =>
	queryOptions({
		queryKey: ["collections"],
		queryFn: ({ signal }) => getCollections({ signal }),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getCollectionDetailsOptions = (collectionName: string) =>
	queryOptions({
		queryKey: ["collection-details", collectionName],
		queryFn: ({ signal }) =>
			getCollectionDetails({
				data: { collectionName },
				signal,
			}),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getCategoryOptions = (category: string) =>
	queryOptions({
		queryKey: ["category", category],
		queryFn: ({ signal }) =>
			getCategory({
				data: { category },
				signal,
			}),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getCategoryProductCountOptions = (category: string) =>
	queryOptions({
		queryKey: ["category-product-count", category],
		queryFn: ({ signal }) =>
			getCategoryProductCount({
				data: { category },
				signal,
			}),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getProductForSubcategoryOptions = (subcategory: string) =>
	queryOptions({
		queryKey: ["product-for-subcategory", subcategory],
		queryFn: ({ signal }) =>
			getProductForSubcategory({
				data: { subcategory },
				signal,
			}),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getSubCategoryProductCountOptions = (subcategory: string) =>
	queryOptions({
		queryKey: ["subcategory-product-count", subcategory],
		queryFn: ({ signal }) =>
			getSubCategoryProductCount({
				data: { subcategory },
				signal,
			}),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getProductDetailsOptions = (product: string) =>
	queryOptions({
		queryKey: ["product-details", product],
		queryFn: ({ signal }) =>
			getProductDetails({
				data: { product },
				signal,
			}),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getProductsForSubcategoryOptions = (subcategory: string) =>
	queryOptions({
		queryKey: ["products-for-subcategory", subcategory],
		queryFn: ({ signal }) =>
			getProductsForSubcategory({
				data: { subcategory },
				signal,
			}),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getRelatedProductsOptions = (
	subcategory: string,
	currentProductSlug: string,
) =>
	queryOptions({
		queryKey: ["related-products", subcategory, currentProductSlug],
		queryFn: ({ signal }) =>
			getRelatedProducts({
				data: { subcategory, currentProductSlug },
				signal,
			}),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getProductCountOptions = () =>
	queryOptions({
		queryKey: ["product-count"],
		queryFn: ({ signal }) => getProductCount({ signal }),
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getCartOptions = () =>
	queryOptions({
		queryKey: ["cart-items"],
		queryFn: ({ signal }) =>
			fetch("/order", { signal }).then((res) => res.json()) as Promise<{
				products: (Product & { quantity: number })[];
			}>,
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const searchProductsOptions = (q: string) =>
	queryOptions({
		queryKey: ["search-products", q],
		queryFn: ({ signal }) =>
			searchProducts({
				data: { q },
				signal,
			}),
		enabled: q.length >= 2,
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

export const getUserOptions = () =>
	queryOptions({
		queryKey: ["user"],
		queryFn: ({ signal }) => getUser({ signal }),
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
