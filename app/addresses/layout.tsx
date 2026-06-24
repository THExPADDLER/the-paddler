import type { Metadata } from "next"

import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Addresses",
  description: "Manage your THE PADDLER saved addresses.",
  path: "/addresses",
  noIndex: true,
})

export default function AddressesLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
