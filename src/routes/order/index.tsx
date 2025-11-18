import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { getCookie, setResponseHeader } from "@tanstack/react-start/server";
import { X } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import z from "zod";
import { Image } from "@/components/ui/image";
import { db } from "@/db";
import type { Product } from "@/db/schema";

export const cartSchema = z.array(
	z.object({
		productSlug: z.string(),
		quantity: z.number(),
	}),
);

const getCart = createMiddleware({ type: "request" }).server(
	async ({ next, context }) => {
		const cart = await getCookie("cart");
		const cartValue = cartSchema.safeParse(JSON.parse(cart ?? "[]"));
		if (!cartValue.success) {
			throw new Error("Failed to parse cart cookie", {
				cause: cartValue.error,
			});
		}
		return next({
			context: {
				...context,
				cart: cartValue.data,
			},
		});
	},
);

const updateCart = (updatedCart: { productSlug: string; quantity: number }[]) =>
	setResponseHeader(
		"Set-Cookie",
		[
			`cart=${encodeURIComponent(JSON.stringify(updatedCart))}`,
			"Path=/",
			"HttpOnly",
			process.env.NODE_ENV === "production" ? "Secure" : "",
			"SameSite=Strict",
			`Max-Age=${60 * 60 * 24 * 7}`,
		]
			.filter(Boolean)
			.join("; "),
	);

export const Route = createFileRoute("/order/")({
	server: {
		middleware: [getCart],
		handlers: ({ createHandlers }) => {
			return createHandlers({
				GET: {
					handler: async ({ context }) => {
						const cart = context.cart;
						const products = await db.query.products.findMany({
							where: (products, { inArray }) =>
								inArray(
									products.slug,
									cart.map((item) => item.productSlug),
								),
							with: {
								subcategory: {
									with: {
										subcollection: true,
									},
								},
							},
						});

						const withQuantity = products.map((product) => ({
							...product,
							quantity:
								cart.find((item) => item.productSlug === product.slug)
									?.quantity ?? 0,
						}));
						return Response.json({
							products: withQuantity,
						});
					},
				},
				POST: {
					handler: async ({ context, request }) => {
						const prevCart = context.cart;
						const { productSlug } = (await request.json()) as {
							productSlug: string;
						};
						if (typeof productSlug !== "string") {
							return;
						}
						const itemAlreadyExists = prevCart.find(
							(item) => item.productSlug === productSlug,
						);
						if (itemAlreadyExists) {
							const newQuantity = itemAlreadyExists.quantity + 1;
							const newCart = prevCart.map((item) => {
								if (item.productSlug === productSlug) {
									return {
										...item,
										quantity: newQuantity,
									};
								}
								return item;
							});
							await updateCart(newCart);
						} else {
							const newCart = [
								...prevCart,
								{
									productSlug,
									quantity: 1,
								},
							];
							await updateCart(newCart);
						}

						return Response.json({
							success: true,
							message: "Items added to cart",
						});
					},
				},
				PUT: {
					handler: async ({ context, request }) => {
						const prevCart = context.cart;
						const { productSlug } = (await request.json()) as {
							productSlug: string;
						};
						if (typeof productSlug !== "string") {
							return Response.json(
								{ error: "Invalid productSlug" },
								{ status: 400 },
							);
						}

						const newCart = prevCart.filter(
							(item) => item.productSlug !== productSlug,
						);

						await updateCart(newCart);

						return Response.json({
							success: true,
							message: "Item removed from cart",
						});
					},
				},
				PATCH: {
					handler: async ({ context, request }) => {
						const prevCart = context.cart;
						const { productSlug, action } = (await request.json()) as {
							productSlug: string;
							action: "increase" | "decrease";
						};

						if (typeof productSlug !== "string" || !action) {
							return Response.json(
								{ error: "Invalid request" },
								{ status: 400 },
							);
						}

						const itemExists = prevCart.find(
							(item) => item.productSlug === productSlug,
						);

						if (!itemExists) {
							return Response.json(
								{ error: "Item not found in cart" },
								{ status: 404 },
							);
						}

						let newQuantity: number;
						if (action === "increase") {
							newQuantity = itemExists.quantity + 1;
						} else {
							newQuantity = Math.max(1, itemExists.quantity - 1);
						}

						if (newQuantity === 0) {
							// Remove item entirely if quantity would be 0
							const newCart = prevCart.filter(
								(item) => item.productSlug !== productSlug,
							);
							await updateCart(newCart);

							return Response.json({
								success: true,
								message: "Item removed from cart",
								removed: true,
							});
						}

						const newCart = prevCart.map((item) => {
							if (item.productSlug === productSlug) {
								return {
									...item,
									quantity: newQuantity,
								};
							}
							return item;
						});

						await updateCart(newCart);

						return Response.json({
							success: true,
							message: `Item quantity ${action}d`,
							newQuantity,
						});
					},
				},
			});
		},
	},
	component: RouteComponent,
});

function RouteComponent() {
	const [totalCost, setTotalCost] = useState(0);
	const { data: cart } = useSuspenseQuery({
		queryKey: ["order-cart"],
		queryFn: () => fetch("/order").then((res) => res.json()),
	});
	useEffect(() => {
		setTotalCost(
			(
				cart as { products: { quantity: number; price: string }[] }
			)?.products?.reduce<number>(
				(acc: number, item: { quantity: number; price: string }) =>
					acc + (item.quantity ?? 0) * Number(item.price),
				0,
			) ?? 0,
		);
	}, [cart]);

	return (
		<div className="flex mx-auto  grid-cols-3 flex-col gap-8 pt-4 lg:grid">
			<div className="col-span-2">
				<Suspense>
					<CartItems
						cart={
							(cart as { products: (Product & { quantity: number })[] })
								.products
						}
					/>
				</Suspense>
			</div>

			<div className="space-y-4">
				<div className="rounded bg-gray-100 p-4">
					<p className="font-semibold">
						Merchandise{" "}
						<Suspense>
							<span>${totalCost.toFixed(2)}</span>
						</Suspense>
					</p>
					<p className="text-sm text-gray-500">
						Applicable shipping and tax will be added.
					</p>
				</div>
				{/* <Suspense>
                <PlaceOrderAuth />
              </Suspense> */}
			</div>
		</div>
	);
}

export function CartItems({
	cart,
}: {
	cart: (Product & { quantity: number })[];
}) {
	return (
		<>
			{cart.length > 0 && (
				<div className="pb-4">
					<p className="font-semibold text-accent1">Delivers in 2-4 weeks</p>
					<p className="text-sm text-gray-500">Need this sooner?</p>
				</div>
			)}
			{cart.length > 0 ? (
				<div className="flex flex-col space-y-10">
					{cart.map((item) => (
						<CartItem key={item.slug} product={item} />
					))}
				</div>
			) : (
				<p>No items in cart</p>
			)}
		</>
	);
}

function CartItem({ product }: { product: Product & { quantity: number } }) {
	// limit to 2 decimal places
	const { queryClient } = Route.useRouteContext();
	const cost = (Number(product.price) * product.quantity).toFixed(2);

	const { mutate: removeItemFromCart } = useMutation({
		mutationFn: (productSlug: string) =>
			fetch("/order", {
				method: "PUT",
				body: JSON.stringify({ productSlug }),
			}).then((res) => res.json()),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["order-cart"] });
		},
	});

	const { mutate: updateQuantity } = useMutation({
		mutationFn: ({
			productSlug,
			action,
		}: {
			productSlug: string;
			action: "increase" | "decrease";
		}) =>
			fetch("/order", {
				method: "PATCH",
				body: JSON.stringify({ productSlug, action }),
			}).then((res) => res.json()),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["order-cart"] });
		},
	});

	return (
		<div className="flex flex-row items-center justify-between border-t border-gray-200 pt-4">
			<Link
				preload="intent"
				to="/products/$category/$subcategory/$product"
				params={{
					category: product.subcategorySlug,
					subcategory: product.subcategorySlug,
					product: product.slug,
				}}
			>
				<div className="flex flex-row space-x-2">
					<div className="flex h-24 w-24 items-center justify-center bg-gray-100">
						<Image
							loading="eager"
							decoding="sync"
							src={product.imageUrl ?? "/placeholder.jpeg"}
							alt="Product"
							width={256}
							height={256}
							quality={75}
						/>
					</div>
					<div className="max-w-[100px] flex-grow sm:max-w-full">
						<h2 className="font-semibold">{product.name}</h2>
						<p className="text-sm md:text-base">{product.description}</p>
					</div>
				</div>
			</Link>
			<div className="flex items-center justify-center md:space-x-10">
				<div className="flex flex-col-reverse md:flex-row md:gap-4">
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() =>
								updateQuantity({
									productSlug: product.slug,
									action: "decrease",
								})
							}
							disabled={product.quantity <= 1}
							className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
						>
							-
						</button>
						<span className="w-8 text-center">{product?.quantity ?? 0}</span>
						<button
							type="button"
							onClick={() =>
								updateQuantity({
									productSlug: product.slug,
									action: "increase",
								})
							}
							className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-100"
						>
							+
						</button>
					</div>
					<div className="flex md:block">
						<div className="min-w-8 text-sm md:min-w-24 md:text-base">
							<p>${Number(product.price).toFixed(2)} each</p>
						</div>
					</div>
					<div className="min-w-24">
						<p className="font-semibold">${cost}</p>
					</div>
				</div>
				<form
					action={() => {
						removeItemFromCart(product.slug);
					}}
				>
					<button type="submit">
						<input type="hidden" name="productSlug" value={product.slug} />
						<X className="h-6 w-6" />
					</button>
				</form>
			</div>
		</div>
	);
}
