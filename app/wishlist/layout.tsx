import type { Metadata } from "next"

import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Wishlist",
  description: "Your saved THE PADDLER drops.",
  path: "/wishlist",
  noIndex: true,
})

export default function WishlistLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
