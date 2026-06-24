import type { Metadata } from "next"

import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Shop Oversized Streetwear T-Shirts",
  description:
    "Shop THE PADDLER premium oversized T-shirts, heavyweight cotton tees, limited streetwear drops, and free shipping across India.",
  path: "/shop",
  image: "/images/hero/hero-desktop.webp",
  keywords: [
    "shop oversized t-shirts",
    "streetwear t-shirts India",
    "premium oversized tee",
    "free shipping streetwear",
  ],
})

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
