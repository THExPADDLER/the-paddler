import type { Metadata } from "next"

import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "FAQ",
  description:
    "Answers about THE PADDLER sizing, delivery, payment, returns, refunds, and limited streetwear drops.",
  path: "/faq",
  image: "/images/hero/hero-desktop.webp",
  keywords: ["THE PADDLER FAQ", "streetwear sizing", "returns policy", "delivery"],
})

export default function FaqLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
