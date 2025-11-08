import { ProductLink } from '@/components/ui/product-card'
import { db } from '@/db'
import { products } from '@/db/schema'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { count, eq } from 'drizzle-orm'
import z from 'zod'

const getProductForSubcategory = createServerFn({ method: "GET" })
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

const getSubCategoryProductCount = createServerFn({ method: "GET" })
.inputValidator(z.object({
  subcategory: z.string(),
}))
.handler(async ({ data: { subcategory } }) => {
  return await db.select({ count: count() })
  .from(products)
  .where(eq(products.subcategorySlug, subcategory))
})

export const Route = createFileRoute('/_layout/products/$category/$subcategory/')({
  component: RouteComponent,
  loader: async ({params }) => {
    const [products, productCount] = await Promise.all([
      getProductForSubcategory({ data : { subcategory: params.subcategory } }),
      getSubCategoryProductCount({ data : { subcategory: params.subcategory } }),
    ])
    return { products, productCount }
  },
  pendingComponent: () => <div>Loading...</div>,
  errorComponent: () => <div>Error</div>,
})

function RouteComponent() {
  const { category, subcategory } = Route.useParams()
  const { products, productCount } = Route.useLoaderData()
  const finalCount = productCount[0]?.count
  return (
    <div className="container mx-auto p-4">
      {finalCount > 0 ? (
        <h1 className="mb-2 border-b-2 text-sm font-bold">
          {finalCount} {finalCount === 1 ? "Product" : "Products"}
        </h1>
      ) : (
        <p>No products for this subcategory</p>
      )}
      <div className="flex flex-row flex-wrap gap-2">
        {products.map((product) => (
          <ProductLink
            key={product.name}
            loading="eager"
            category_slug={category}
            subcategory_slug={subcategory}
            product={product}
            imageUrl={product.imageUrl}
          />
        ))}
      </div>
    </div>
  );
}
