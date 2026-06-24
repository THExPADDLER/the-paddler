import type { Metadata } from "next"

import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Orders",
  description: "Your THE PADDLER order status and invoices.",
  path: "/orders",
  noIndex: true,
})

export default function OrdersLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
