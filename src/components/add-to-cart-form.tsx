"use client";
import { addToCart } from "@/api/server-funtions";

export function AddToCartForm({ productSlug }: { productSlug: string }) {
	const handleSubmit = async () => {
		await addToCart({ data: { productSlug } });
	};

	return (
		<form className="flex flex-col gap-2" action={handleSubmit}>
			<input type="hidden" name="productSlug" value={productSlug} />
			<button
				type="submit"
				className="max-w-[150px] rounded-[2px] bg-accent1 px-5 py-1 text-sm font-semibold text-white"
			>
				Add to cart
			</button>
		</form>
	);
}
