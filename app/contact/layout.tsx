import type { Metadata } from "next"

import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description:
    "Contact THE PADDLER for orders, returns, collaborations, and streetwear drop support.",
  path: "/contact",
  image: "/images/hero/hero-desktop.webp",
  keywords: ["THE PADDLER contact", "streetwear support", "order support"],
})

export default function ContactLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
