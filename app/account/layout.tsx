import type { Metadata } from "next"

import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Account",
  description: "Manage your THE PADDLER account.",
  path: "/account",
  noIndex: true,
})

export default function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
