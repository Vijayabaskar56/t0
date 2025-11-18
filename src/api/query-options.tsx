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
} from "./server-funtions";

export const getCollectionsOptions = () =>
	queryOptions({
		queryKey: ["collections"],
		queryFn: () => getCollections(),
	});

export const getCollectionDetailsOptions = (collectionName: string) =>
	queryOptions({
		queryKey: ["collection-details", collectionName],
		queryFn: () =>
			getCollectionDetails({
				data: { collectionName },
			}),
	});

export const getCategoryOptions = (category: string) =>
	queryOptions({
		queryKey: ["category", category],
		queryFn: () =>
			getCategory({
				data: { category },
			}),
	});

export const getCategoryProductCountOptions = (category: string) =>
	queryOptions({
		queryKey: ["category-product-count", category],
		queryFn: () =>
			getCategoryProductCount({
				data: { category },
			}),
	});

export const getProductForSubcategoryOptions = (subcategory: string) =>
	queryOptions({
		queryKey: ["product-for-subcategory", subcategory],
		queryFn: () =>
			getProductForSubcategory({
				data: { subcategory },
			}),
	});

export const getSubCategoryProductCountOptions = (subcategory: string) =>
	queryOptions({
		queryKey: ["subcategory-product-count", subcategory],
		queryFn: () =>
			getSubCategoryProductCount({
				data: { subcategory },
			}),
	});

export const getProductDetailsOptions = (product: string) =>
	queryOptions({
		queryKey: ["product-details", product],
		queryFn: () =>
			getProductDetails({
				data: { product },
			}),
	});

export const getProductsForSubcategoryOptions = (subcategory: string) =>
	queryOptions({
		queryKey: ["products-for-subcategory", subcategory],
		queryFn: () =>
			getProductsForSubcategory({
				data: { subcategory },
			}),
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
	});

export const getProductCountOptions = () =>
	queryOptions({
		queryKey: ["product-count"],
		queryFn: () => getProductCount(),
	});

export const getCartOptions = () =>
	queryOptions({
		queryKey: ["cart-items"],
		queryFn: () =>
			fetch("/order").then((res) => res.json()) as Promise<{
				products: (Product & { quantity: number })[];
			}>,
	});
