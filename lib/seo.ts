import type { Metadata } from "next"

import type { Product } from "@/lib/products"

export const siteUrl = "https://thepaddler.in"
export const siteName = "THE PADDLER"
export const siteTagline = "Not Just Clothing. A Statement."
export const brandDescription =
  "Premium oversized streetwear built for people who move different. Limited drop T-shirts, streetwear fits, free shipping, and secure checkout across India."
export const defaultOgImage = "/images/hero/hero-desktop.webp"
export const brandLogo = "/images/paddler-logo.png"

export const absoluteUrl = (path = "") => {
  if (!path) return siteUrl
  if (path.startsWith("http")) return path
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`
}

export const pageTitle = (title?: string) =>
  title ? `${title} | ${siteName}` : `${siteName} | ${siteTagline}`

export const buildMetadata = ({
  title,
  description = brandDescription,
  path = "",
  image = defaultOgImage,
  noIndex = false,
  keywords = [],
}: {
  title?: string
  description?: string
  path?: string
  image?: string
  noIndex?: boolean
  keywords?: string[]
}): Metadata => {
  const resolvedTitle = pageTitle(title)
  const url = absoluteUrl(path)
  const imageUrl = absoluteUrl(image)

  return {
    metadataBase: new URL(siteUrl),
    title: resolvedTitle,
    description,
    keywords: [
      "THE PADDLER",
      "Paddler streetwear",
      "oversized t-shirts India",
      "premium streetwear India",
      "streetwear t-shirt",
      "heavyweight cotton t-shirt",
      ...keywords,
    ],
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: "website",
      siteName,
      title: resolvedTitle,
      description,
      url,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: resolvedTitle,
        },
      ],
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: [imageUrl],
    },
  }
}

export const productDescription = (product: Product) =>
  `${product.name} by ${siteName}. ${product.color} ${product.description.toLowerCase()} crafted for premium streetwear fits. Free shipping across India.`

export const buildProductMetadata = (product: Product): Metadata =>
  buildMetadata({
    title: `${product.name} - ${product.color} Oversized Tee`,
    description: productDescription(product),
    path: `/product/${product.slug}`,
    image: product.image,
    keywords: [
      product.name,
      product.color,
      `${product.color} oversized t-shirt`,
      `${product.color} streetwear tee`,
      "limited drop t-shirt",
      ...(product.tags || []),
    ],
  })

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: siteUrl,
  logo: absoluteUrl(brandLogo),
  sameAs: ["https://www.instagram.com/thepaddler.in"],
}

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/shop?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
}

export const productJsonLd = (product: Product) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: productDescription(product),
  image: product.images?.length
    ? product.images.map((image) => absoluteUrl(image))
    : [absoluteUrl(product.image)],
  sku: `TP-${product.slug.toUpperCase()}`,
  brand: {
    "@type": "Brand",
    name: siteName,
  },
  color: product.color,
  keywords: product.tags?.join(", "),
  material: "240 GSM heavyweight cotton",
  category: "Apparel & Accessories > Clothing > Shirts & Tops",
  offers: {
    "@type": "Offer",
    url: absoluteUrl(`/product/${product.slug}`),
    priceCurrency: "INR",
    price: product.price,
    availability: product.inStock
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: {
      "@type": "Organization",
      name: siteName,
    },
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        value: 0,
        currency: "INR",
      },
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: "IN",
      },
    },
  },
})
