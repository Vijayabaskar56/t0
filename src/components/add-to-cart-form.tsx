import { useMutation, useQueryClient } from "@tanstack/react-query";

interface AddToCartResponse {
	message: string;
	success?: boolean;
}

export function AddToCartForm({ productSlug }: { productSlug: string }) {
	const queryClient = useQueryClient();
	const { mutate, isPending, data } = useMutation({
		mutationFn: (productSlug: string) =>
			fetch("/order", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ productSlug }),
			}).then((res) => res.json()),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["order-cart"] });
			queryClient.invalidateQueries({ queryKey: ["cart-items"] });
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		mutate(productSlug);
	};

	return (
		<form className="flex flex-col gap-2" onSubmit={handleSubmit}>
			<input type="hidden" name="productSlug" value={productSlug} />
			<button
				type="submit"
				disabled={isPending}
				className="max-w-[150px] rounded-[2px] bg-accent1 px-5 py-1 text-sm font-semibold text-white bg-green-500 disabled:opacity-50"
			>
				{isPending ? "Adding..." : "Add to cart"}
			</button>
			{(data as AddToCartResponse)?.message && (
				<p>{(data as AddToCartResponse).message}</p>
			)}
		</form>
	);
}
