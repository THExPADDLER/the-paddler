import type { MetadataRoute } from "next"

import { products } from "@/lib/products"
import { siteUrl } from "@/lib/seo"

const staticRoutes = [
  "",
  "/shop",
  "/about",
  "/contact",
  "/faq",
  "/influencers",
  "/instagram",
  "/terms-and-conditions",
]

type SitemapChangeFrequency = NonNullable<
  MetadataRoute.Sitemap[number]["changeFrequency"]
>

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified: now,
      changeFrequency: (
        route === "" || route === "/shop" ? "weekly" : "monthly"
      ) as SitemapChangeFrequency,
      priority: route === "" ? 1 : route === "/shop" ? 0.9 : 0.6,
    })),
    ...products.map((product) => ({
      url: `${siteUrl}/product/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ]
}
