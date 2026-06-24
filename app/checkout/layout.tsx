import type { Metadata } from "next"

import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Checkout",
  description: "Secure checkout for THE PADDLER orders.",
  path: "/checkout",
  noIndex: true,
})

export default function CheckoutLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
