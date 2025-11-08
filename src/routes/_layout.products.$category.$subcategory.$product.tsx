import { ProductLink } from '@/components/ui/product-card';
import { db } from '@/db';
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start';
import z from 'zod';

const getProductDetails = createServerFn({ method: "GET" })
.inputValidator(z.object({
  product: z.string(),
}))
.handler(async ({ data: { product } }) => {
  return  db.query.products.findFirst({
    where: (products, { eq }) => eq(products.slug, product),
  })
})

const getProductsForSubcategory = createServerFn({ method: "GET" })
.inputValidator(z.object({
  subcategory: z.string(),
}))
.handler(async ({ data: { subcategory } }) => {
  return await  db.query.products.findMany({
    where: (products, { eq, and }) =>
      and(eq(products.subcategorySlug, subcategory)),
    orderBy: (products, { asc }) => asc(products.slug),
  })
})

export const Route = createFileRoute('/_layout/products/$category/$subcategory/$product')({
  component: RouteComponent,
  loader: async ({params }) => {
    const [productData, relatedUnshifted] = await Promise.all([
      getProductDetails({ data : { product: params.product } }),
      getProductsForSubcategory({ data : { subcategory: params.subcategory } }),
    ])
    return { productData, relatedUnshifted }
  },
})

function RouteComponent() {
  const { category, subcategory } = Route.useParams()
  const { productData, relatedUnshifted } = Route.useLoaderData()
  console.log("🚀 ~ file: _layout.products.$category.$subcategory.$product.tsx:43 ~ productData:", productData)

  return  (
    <div className="container p-4">
      <h1 className="border-t-2 pt-1 text-xl font-bold text-accent1">
        {productData?.name} {productData?.name}
      </h1>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <img
            loading="eager"
            decoding="sync"
            src={productData?.imageUrl ?? "/placeholder.svg?height=64&width=64"}
            alt={`A small image of ${productData?.name}`}
            height={256}
            width={256}
            className="h-56 w-56 flex-shrink-0 border-2 md:h-64 md:w-64"
          />
          <p className="flex-grow text-base">{productData?.description}</p>
        </div>
        <p className="text-xl font-bold">
          ${parseFloat(productData?.price).toFixed(2)}
        </p>
        {/* <AddToCartForm productSlug={productData?.slug ?? ""} /> */}
      </div>
      <div className="pt-8">
        {relatedUnshifted.length > 0 && (
          <h2 className="text-lg font-bold text-accent1">
            Explore more products
          </h2>
        )}
        <div className="flex flex-row flex-wrap gap-2">
          {relatedUnshifted?.map((product) => (
            <ProductLink
              key={product.name}
              loading="lazy"
              category_slug={category ?? ""}
              subcategory_slug={subcategory ?? ""}
              product={product}
              imageUrl={product.imageUrl}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
