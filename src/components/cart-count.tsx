import { useQuery } from "@tanstack/react-query";

const CartCount = () => {
	const { data: cart } = useQuery<{ products: { quantity: number }[] }>({
		queryKey: ["cart-items"],
		queryFn: () => fetch("/order").then((res) => res.json()),
	});
	return (
		<div className="absolute -right-3 -top-1 rounded-full bg-accent2 px-1 text-xs text-accent1">
			{cart?.products?.reduce(
				(acc: number, item: { quantity: number }) => acc + item.quantity,
				0,
			)}
		</div>
	);
};
export default CartCount;
