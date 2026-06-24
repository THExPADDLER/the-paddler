import type { Metadata } from "next"

import ProductClient from "@/app/product/[slug]/product-client"
import { getProductBySlug, products } from "@/lib/products"
import {
  buildMetadata,
  buildProductMetadata,
  productJsonLd,
  siteName,
} from "@/lib/seo"

type ProductPageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }))
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = getProductBySlug(slug)

  if (!product) {
    return buildMetadata({
      title: "Product Not Found",
      description: `This ${siteName} product is currently unavailable.`,
      path: `/product/${slug}`,
      noIndex: true,
    })
  }

  return buildProductMetadata(product)
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = getProductBySlug(slug)

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productJsonLd(product)),
          }}
        />
      )}
      <ProductClient />
    </>
  )
}
