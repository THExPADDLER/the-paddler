import type { Metadata } from "next"

import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Cart",
  description: "Your THE PADDLER shopping cart.",
  path: "/cart",
  noIndex: true,
})

export default function CartLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
